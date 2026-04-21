# Spec: Nearby Birds — Persistent Cache & First-Load Performance

**Status:** Approved  
**Author:** Henrik Littke  
**Date:** 2026-04-20  
**PRD reference:** `docs/prd/nearby-birds-reliability.md` (prior phase; this extends it)

---

## Overview

### What

Persist the area distribution cache to PostgreSQL so it survives server restarts, introduce stale-while-revalidate so cached data is served immediately while a background refresh runs, parallelise the two independent Artdatabanken API calls in `fetchAreaDistribution()`, and fix a taxon ID mismatch that causes observation counts to appear as 0 for common birds on force-refresh.

### Why

The current in-memory caches are wiped on every server restart, causing a 10-second cold fetch on the first request after any deployment or maintenance event. Sequential API calls double the cold-fetch time unnecessarily. The taxon ID mismatch causes all birds to switch on force-refresh, undermining user trust in the data.

---

## User Stories

- As a birder opening BirdLog after the server has restarted, I want to see nearby birds populated immediately from a persistent cache so the app is useful even after server maintenance.
- As a birder opening the app after my phone has been idle, I want the nearby birds sections to appear within 500ms even if the data is up to an hour old, so I am not staring at loading skeletons every morning.
- As a birder waiting for initial data on a cold cache, I want the fetch to complete in approximately 5 seconds (down from ~10s) so I spend less time waiting.
- As a birder viewing bird cards, I want the observation counts to be stable and non-zero for common species across refreshes.
- As a birder who taps the refresh button, I want it to continue bypassing all caches and returning fully fresh data — behaviour unchanged.

---

## Technical Approach

### Data Model

New Prisma model added to `packages/server/prisma/schema.prisma`:

```prisma
model AreaDistributionCache {
  cacheKey     String   @id
  entries      Json
  totalSpecies Int
  fetchedAt    DateTime

  @@index([fetchedAt])
}
```

- `cacheKey` — primary key; produced by existing `getDistributionCacheKey()` (e.g. `297_90_2026-03-21`). No new key format.
- `entries` — `DistributionEntry[]` stored as a JSON column. Always fetched as a complete set; no per-entry querying is needed.
- `totalSpecies` — mirrors `AreaDistribution.totalSpecies`.
- `fetchedAt` — UTC `DateTime`. Converted from/to epoch ms (`number`) at the `loadFromDb`/`saveToDb` boundary.
- `@@index([fetchedAt])` — supports future janitor cleanup; additive and cheap.
- Migration: `CREATE TABLE` only — fully additive. No existing tables are modified.

### API Endpoints

No GraphQL schema changes. The `nearbyBirds(latitude, longitude, force)` query signature and response type are unchanged. The client is unaffected.

### Business Logic

#### Stale-while-revalidate in `getAreaDistribution()`

`SWR_STALE_TTL = 1 * 60 * 60 * 1000` (1 hour) is the boundary for "fresh enough to serve without triggering a background refresh".

Four-tier lookup order:

1. **In-memory hit, fresh** (age < `SWR_STALE_TTL`): return immediately; no background work.
2. **In-memory hit, stale** (age ≥ `SWR_STALE_TTL`): return stale data immediately; trigger `fetchAreaDistribution()` in background (fire-and-forget; errors caught and logged).
3. **DB hit** (no in-memory entry): hydrate `distributionCache` from DB row, return immediately; trigger background refresh if row is also stale.
4. **Cold** (no in-memory, no DB): block caller until `fetchAreaDistribution()` completes (current behaviour).

Background refreshes are guarded by `inflightRequests` — if a background fetch is already in flight for the same cache key, do not start another one.

#### `fetchAreaDistribution()` changes

- Replace sequential `await getTopBirdTaxa(...)` + `await getAllReportCounts(...)` with:
  ```typescript
  const [taxa, reportCounts] = await Promise.all([
    getTopBirdTaxa(latitude, longitude, 200, date),
    getAllReportCounts(latitude, longitude, date),
  ]);
  ```
- After writing to `distributionCache`, call `saveToDb(cacheKey, distribution)` fire-and-forget (errors caught and logged; a DB write failure must never throw from the fetch path).
- Taxon mismatch fallback: change `observationCount: reportCounts.get(t.taxonId) ?? 0` to `observationCount: reportCounts.get(t.taxonId) ?? t.observationCount`. When the Search endpoint returns subspecies-level IDs that don't match the species-level IDs from TaxonAggregation, fall back to the TaxonAggregation observation count for ranking purposes.
- Add a log line counting how many entries fell back to the TaxonAggregation count (to confirm the mismatch rate in production). Remove after confirmed.

#### `clearDistributionCache()` changes

- Becomes `async Promise<void>`.
- Adds `await prisma.areaDistributionCache.delete({ where: { cacheKey } })` after the in-memory deletes. Errors silently ignored (row may not exist).
- Call site in `resolvers.ts` (`nearbyBirds` force path) must `await clearDistributionCache(...)`.

#### New helper functions in `artdatabanken.ts`

- `loadFromDb(key: string): Promise<AreaDistribution | null>` — reads one `AreaDistributionCache` row; returns `null` if not found; converts `row.fetchedAt` (Date) to epoch ms.
- `saveToDb(key: string, distribution: AreaDistribution): Promise<void>` — upserts an `AreaDistributionCache` row.
- Module-level `const prisma = new PrismaClient()` added (consistent with `resolvers.ts` pattern).

#### UX behaviour

Background SWR refreshes are silent — no spinner, no "Uppdaterar..." label. Stale content is rendered immediately; the in-place update on refresh completion has no animation. If the background refresh fails, stale content remains visible; no error is shown. The manual refresh button retains its existing spinner/disabled behaviour and is unaffected by background SWR activity.

### Integrations

- **Artdatabanken SOS API** — unchanged; `getTopBirdTaxa()` and `getAllReportCounts()` now run concurrently.
- **PostgreSQL** — new `AreaDistributionCache` table; accessed via Prisma.

---

## Implementation Plan

- [ ] **Task 1:** Add `AreaDistributionCache` Prisma model and run migration
  - Test: Migration runs without error; `prisma.areaDistributionCache.findMany()` returns `[]` on a fresh DB.
  - Notes: Additive migration only (`CREATE TABLE`). Run `prisma migrate dev --name nearby-birds-cache`.

- [ ] **Task 2:** Add `loadFromDb` and `saveToDb` helpers in `artdatabanken.ts`; add module-level `PrismaClient`
  - Test: Unit tests — `saveToDb` calls `prisma.areaDistributionCache.upsert` with correct `cacheKey`, `entries`, `totalSpecies`, and a `Date` for `fetchedAt`; `loadFromDb` returns `null` when no row exists, and returns hydrated `AreaDistribution` (with `fetchedAt` as epoch ms) when a row exists.
  - Notes: `entries` field from Prisma is `JsonValue` (`unknown`) — type-assert to `DistributionEntry[]` in `loadFromDb`.

- [ ] **Task 3:** Implement stale-while-revalidate in `getAreaDistribution()`
  - Test: (a) In-memory fresh → `fetchAreaDistribution` not called. (b) In-memory stale → returns stale immediately AND `fetchAreaDistribution` called in background. (c) DB hit fresh → hydrates in-memory, returns immediately, no background fetch. (d) DB hit stale → returns immediately AND background fetch triggered. (e) Cold → blocks and returns fresh data.
  - Notes: `SWR_STALE_TTL = 60 * 60 * 1000`. Background calls guarded by `inflightRequests`.

- [ ] **Task 4:** Parallelise API calls in `fetchAreaDistribution()`; add `saveToDb` call
  - Test: Both `fetch` calls start before either resolves (assert `fetch` called twice before first mock resolves). `saveToDb` called with correct args after distribution is built.
  - Notes: If either `Promise.all` leg throws, the whole `fetchAreaDistribution` rejects — same as current behaviour.

- [ ] **Task 5:** Fix taxon ID mismatch fallback in `fetchAreaDistribution()`
  - Test: When `getTopBirdTaxa` returns `[{ taxonId: 99, observationCount: 7 }]` and `getAllReportCounts` returns an empty map, the resulting entry has `observationCount: 7` (not 0).
  - Notes: Fallback is `reportCounts.get(t.taxonId) ?? t.observationCount`. Add log line counting fallbacks; remove after confirming in production.

- [ ] **Task 6:** Make `clearDistributionCache()` async; update call site and test mock
  - Test: `clearDistributionCache` calls `prisma.areaDistributionCache.delete` with the correct `cacheKey`. Existing resolver test "calls clearDistributionCache before getAreaDistribution when force: true" still passes with updated mock.
  - Notes: Change mock in `resolvers.test.ts` from `mockImplementation(() => {})` to `mockResolvedValue(undefined)`. Update `resolvers.ts` call site to `await clearDistributionCache(...)`.

---

## Acceptance Criteria

- [ ] After a server restart, the first `nearbyBirds` request to a previously-cached location returns a response in < 500ms (from DB cache)
- [ ] Cold fetch (no cache anywhere) completes in approximately 5 seconds (parallel API calls)
- [ ] Data served on a warm-cache load is at most 1 hour old
- [ ] Force refresh (`force: true`) still bypasses all caches (in-memory, DB, distribution) and returns fully fresh data
- [ ] Common birds (e.g. blåmes) display non-zero observation counts consistently, including after force-refresh
- [ ] The Prisma migration is additive — no existing tables or columns are modified
- [ ] All unit tests pass: `npm run test --workspace=packages/server`
- [ ] No linter errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

---

## Non-Goals

- This spec does **not** change the rarity classification algorithm (hero/common/uncommon selection, MIN_REPORTS threshold, percentile bands, `calculateSpeciesRarity`)
- This spec does **not** persist the `nearbyBirdsCache` (24h resolver-level result cache) — only the underlying `distributionCache` is persisted
- This spec does **not** implement multi-location cache pre-warming
- This spec does **not** add any new user-facing UI elements
- This spec does **not** modify the GraphQL schema visible to the client
- This spec does **not** implement a shared `PrismaClient` singleton — the second instance in `artdatabanken.ts` is acceptable at current scale

---

## Security & Compliance Considerations

- The `AreaDistributionCache` table stores only species observation data — public, non-personal data from Artdatabanken. No user PII is involved.
- No new data is logged. The temporary fallback log line counts mismatched entries only (taxon IDs, no coordinates or user data).
- No auth changes.
- No GDPR implications — cached data is species-level, not user-level.

---

## Risks & Open Questions

| # | Risk / Question | Owner | Status |
|---|----------------|-------|--------|
| 1 | Taxon ID mismatch may be more complex than a simple fallback (e.g. subspecies IDs don't appear in TaxonAggregation at all) | Henrik | Open — confirm via production log line in Task 5 |
| 2 | Two `PrismaClient` instances may cause connection pool contention under load | Henrik | Accepted — low risk at current scale; shared singleton is a future refactor |
| 3 | Background SWR refresh may race with a simultaneous force-refresh | Henrik | Mitigated — `inflightRequests` guard prevents duplicate concurrent fetches; force-refresh deletes the cache key before calling `getAreaDistribution`, so the next call hits the cold path |
