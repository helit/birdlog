# PRD: Nearby Birds Reliability — Rolling Window + Refresh Button

**Slug:** `nearby-birds-reliability`
**Phase:** 7b
**Status:** Draft
**Created:** 2026-04-06

---

## Problem

The "Vanligast nära dig" and "Ovanliga nära dig" sections on the landing page produce unreliable classifications, particularly in the first days of a new calendar month. The current implementation fetches report counts for only the current calendar month, meaning on April 6th there are just 6 days of data. With so few reports, year-round residents like blue tit and woodpecker appear in the "Ovanliga" section while freshly-arriving migrants dominate "Vanligast" — the opposite of their actual frequency. Displayed observation counts are correspondingly low and misleading. Separately, the 24-hour cache on the server makes it impossible to see fresh results without restarting the server, which hinders both development and normal use (e.g. when a user moves to a new area).

---

## Success Criteria

- [ ] "Vanligast nära dig" consistently shows genuinely common local birds regardless of calendar position
- [ ] "Ovanliga nära dig" consistently shows genuinely less-frequently-reported birds with ≥3 reports
- [ ] Observation counts displayed per bird reflect the rolling 30-day window and feel plausible relative to how common a species is
- [ ] A refresh icon button is visible on the landing page and busts both server-side caches, triggering a fresh fetch
- [ ] The refresh button shows a loading/spinning state while the request is in flight
- [ ] The UI label for observation counts reads "obs senaste 30 dagarna" (not "denna månad")
- [ ] Non-goal: redesigning the rarity algorithm (MIN_REPORTS threshold, top-3/bottom-3 logic) — the fix is limited to the date window

---

## Non-Goals

- Redesigning the rarity classification algorithm beyond the date window change
- Fixing any potential taxon ID level mismatch between TaxonAggregation and Search endpoints (investigate during implementation; fix only if confirmed as a contributing factor)
- Making the refresh button dev-only or hidden behind a flag

---

## Reproduction Steps

1. Open the app on the 1st–7th of any calendar month
2. View "Vanligast nära dig" and "Ovanliga nära dig" on the landing page

**Observed behavior:** Common year-round residents (e.g. blåmes, större hackspett) appear in "Ovanliga" with low observation counts; less-common species appear in "Vanligast"

**Expected behavior:** Sections reflect true relative frequency in the area, with stable classification throughout the month

**Scope:** All users; most severe on days 1–7 of each month

---

## Root Cause

**Primary — insufficient data (likely, confidence: high):** Both `getTopBirdTaxa()` and `getAllReportCounts()` in `packages/server/src/services/artdatabanken.ts` filter by `startDate = first day of current month`. In early April (day 6), only 6 days of reports exist, producing noisy rankings. Switching both calls to a rolling 30-day window gives consistent data volume every day of the year.

**Secondary — taxon ID level mismatch (uncertain):** `TaxonAggregation` may aggregate to species-level taxon IDs while Search records carry subspecies-level IDs. If so, `reportCounts.get(speciesId)` undercounts species commonly logged at subspecies level, depressing their apparent frequency. This should be investigated during implementation by logging the taxon IDs returned by both endpoints for a known common bird (e.g. blåmes). If confirmed, the fix is to aggregate counts upward from subspecies to species level.

---

## Technical Scope

### Server changes
- [ ] No Prisma schema changes
- [ ] GraphQL: add optional `force: Boolean` argument to `nearbyBirds` query
- [ ] Resolver (`resolvers.ts`): if `force: true`, skip the 24h `nearbyBirdsCache` check AND clear the matching `distributionCache` entry before calling `getAreaDistribution()`
- [ ] `artdatabanken.ts` — `getTopBirdTaxa()`: change date range from calendar month to rolling 30 days (`startDate = today − 30 days`, `endDate = today`)
- [ ] `artdatabanken.ts` — `getAllReportCounts()`: same date range change
- [ ] `artdatabanken.ts` — `getDistributionCacheKey()`: cache key currently includes `year-month`; update to include the rolling start date (rounded to nearest day) so cache invalidates correctly when the window advances

### Client changes
- [ ] Modified page: `IdentifyPage.tsx` — update `NEARBY_BIRDS` GraphQL query to accept optional `force` variable
- [ ] Modified page: `IdentifyPage.tsx` — add refresh icon button (circular arrows, `aria-label="Uppdatera fåglar nära dig"`) near the "Vanligast nära dig" section header; disabled + spinning while query is loading; calls `refetch({ force: true })`
- [ ] Modified page: `IdentifyPage.tsx` — update the per-bird observation count label from "obs denna månad" to "obs senaste 30 dagarna"

### Shared changes
- None

---

## Acceptance Criteria

1. Given the app is opened on any day of the month, when the nearby birds data loads, then "Vanligast nära dig" shows birds with the highest 30-day report counts and "Ovanliga nära dig" shows birds with the lowest credible (≥3) 30-day report counts
2. Given a user views a bird card on the landing page, when they read the observation count label, then it reads "X obs senaste 30 dagarna"
3. Given the landing page has loaded nearby birds, when the user taps the refresh icon button, then both the 24h resolver cache and the 2h distribution cache are bypassed and a fresh API call is made
4. Given the user has tapped the refresh button, when the request is in flight, then the button icon spins and is non-interactive (disabled)
5. Given the user has tapped the refresh button, when the fresh data arrives, then the sections update with the new results
6. Given the `nearbyBirds` query is called with `force: true`, when the resolver runs, then it does not read from `nearbyBirdsCache` and clears the matching `distributionCache` entry before fetching

---

## Test Requirements

### Unit/Integration (Vitest)

**`packages/server/src/services/artdatabanken.test.ts`** (new file or extend existing):
- Assert that `getTopBirdTaxa()` constructs a date range of `[today − 30 days, today]`, not `[first of month, last of month]`
- Assert that `getAllReportCounts()` constructs the same rolling 30-day range
- Assert that `getDistributionCacheKey()` produces different keys on day 1 vs day 15 of the same month (i.e., key changes as the rolling window advances)

**`packages/server/src/schema/resolvers.test.ts`** (extend existing if present, else new):
- Given a populated `nearbyBirdsCache`, when `nearbyBirds` is called with `force: true`, then `getAreaDistribution` is called (cache is bypassed)
- Given a populated `distributionCache`, when `nearbyBirds` is called with `force: true`, then the distribution cache entry is cleared before `getAreaDistribution` is called

### E2E (Playwright)
- None required; the refresh button behavior is covered by integration tests and the visual state change is straightforward

---

## Regression Risk

- The rolling window changes the cache key shape — on first deploy, all existing `distributionCache` entries (2h TTL, in-memory) will be effectively cold. No persistent state at risk since both caches are in-memory.
- The `NEARBY_BIRDS` GraphQL query signature changes (new optional arg) — client must pass `force` as a variable, not hardcoded. No breaking change since `force` is optional.
- Any existing tests that mock `getAllReportCounts` with fixed start/end dates will need updating.

---

## Glossary Updates

No new terms. "Report count" already defined.

---

## Open Questions

- [ ] Secondary root cause (taxon ID mismatch): investigate during implementation. If confirmed, add a follow-up issue.

---

## Implementation Notes

**TDD order:**
1. Write failing test: `getAllReportCounts` startDate = today − 30 days → implement rolling window in `artdatabanken.ts`
2. Write failing test: `getDistributionCacheKey` includes rolling start date → update key function
3. Write failing test: resolver bypasses cache when `force: true` → add `force` arg to resolver + GraphQL schema
4. Implement refresh button in `IdentifyPage.tsx` — use Apollo's `refetch({ force: true })`; hook into `loading` state for the spinner

**Rolling window implementation:** Use `new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)` for startDate. Round to day granularity for the cache key (`yyyy-mm-dd`). This means the cache key changes daily — acceptable since the 2h TTL already means cache turns over multiple times per day.

**Cache busting on `force`:** In the resolver, after confirming `force: true`, delete the matching `nearbyBirdsCache` entry AND call `clearDistributionCache(latitude, longitude)` (or inline the deletion) before calling `getAreaDistribution()`. Export a `clearDistributionCache` helper from `artdatabanken.ts` for testability.

**Icon:** Use a Lucide `RefreshCw` icon (already in the project's icon set) sized at 18px, placed inline with the "Vanligast nära dig" heading.
