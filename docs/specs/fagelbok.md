# Spec: Fågelbok — Bird Dictionary

**Status:** Approved
**Author:** Henrik Littke
**Date:** 2026-04-22
**PRD reference:** none — driven by Phase 1 Define TL;DR (GitHub issue #17)

---

## Overview

### What

Add a searchable Swedish bird dictionary as the fifth bottom-nav tab (**Fågelbok**). Users land on an alphabetical Order list at `/guidebook`, drill into Family (`/guidebook/order/:orderSlug`), then Species (`/guidebook/family/:familySlug`), and tap a species to open the existing `/bird/:scientificName` info page. A sticky search bar on the landing view returns a flat species list matched on Swedish common name and scientific name with case- and accent-insensitive substring matching. The species universe is locked to the existing ~336-row seed; taxonomy (`order`, `orderScientific`, `familyScientific`) is added to `Species` via a one-time Artdatabanken backfill with a static Swedish-name fallback. LifeListDetailPage drops the inline description, enlarges the species image, and gains a **"Mer om arten"** primary button that links to `/bird/:scientificName`. BirdInfoPage enlarges its hero image to match.

### Why

BirdLog currently has no browsing affordance for birds the user has not yet logged. `/bird/:scientificName` exists but is reachable only via the identify flows and life list. A taxonomic browse + search lets birders explore the Swedish avifauna as a field-guide index, which is on-brand (field guide, not fitness tracker) and closes a navigational gap. Adding `order` + scientific family/order fields also unlocks future grouping on life list, observations, and rarity screens.

---

## User Stories

- As a birder, I want a dictionary of all Swedish birds from the app's seed so I can browse the species the app recognises.
- As a birder, I want to search by Swedish common name with accent-insensitive substring match, so "blames" finds "Blåmes" and "ostlig" finds "Östlig…".
- As a birder, I want to search by scientific name ("Parus major") and land on the right species page, so the app works interchangeably with printed Latin references.
- As a birder, I want to drill from Order → Family → Species, so I can explore unfamiliar birds in taxonomic context.
- As a birder, I want to tap a species and land on the same bird info page I already know from identify flows, so browsing and identification feed the same screen.
- As a birder on my life-list detail page, I want a clearly enlarged image and a direct **"Mer om arten"** button to the bird info page, since the inline description duplicates content and crowds the image.
- As a birder on the bird info page, I want the species image displayed large, so I can clearly see how the bird looks.
- As a birder, I want the feature to work even if Artdatabanken has no Swedish name for some orders/families, so the feature ships without blocking on API coverage.

---

## Technical Approach

### Data Model

Prisma schema change in `packages/server/prisma/schema.prisma`:

```prisma
model Species {
  id                 String     @id @default(cuid())
  swedishName        String
  scientificName     String     @unique
  englishName        String?
  family             String?                        // existing — Swedish family name
  description        String?                        // existing
  imageUrl           String?                        // existing
  // NEW:
  order              String?                        // Swedish order name (e.g. "Tättingar")
  orderScientific    String?                        // Scientific order (e.g. "Passeriformes")
  familyScientific   String?                        // Scientific family (e.g. "Paridae")
  sightings          Sighting[]

  @@index([orderScientific])
  @@index([familyScientific])
}
```

- All three new columns nullable so the migration lands without a data value. Expected post-backfill: 100% of rows have `orderScientific` and `familyScientific`; ≥ 90% have Swedish `order`.
- Resolvers tolerate `null` Swedish names by rendering only the scientific name in italics.
- `@@index([orderScientific])` supports the `order(slug)` → families query; `@@index([familyScientific])` supports the `family(slug)` → species query. Both are additive and cheap.
- No renames, no drops. Existing `family` (Swedish) remains the source of truth for Swedish family names.
- Migration name: `add_species_taxonomy` → `npx prisma migrate dev --name add_species_taxonomy`.

No other tables change.

### API Endpoints

GraphQL additions in `packages/server/src/schema/typeDefs.ts`:

```graphql
type Order {
  slug: String!
  swedishName: String          # null when no Swedish name is known
  scientificName: String!
}

type Family {
  slug: String!
  swedishName: String
  scientificName: String!
  order: Order!                # parent order (for header rendering)
}

type OrderDetail {
  order: Order!
  families: [Family!]!
}

type FamilyDetail {
  family: Family!
  species: [Species!]!
}

extend type Query {
  allOrders: [Order!]!
  order(slug: String!): OrderDetail
  family(slug: String!): FamilyDetail
  speciesSearch(query: String!): [Species!]!
}
```

Behaviour:

- **`allOrders`** — resolver selects distinct `orderScientific` from `Species`, projects to `[{ slug, swedishName, scientificName }]`, sorted by Swedish name using `Intl.Collator('sv', { sensitivity: 'base' })`. Rows without Swedish name sort last, alphabetised by scientific. Auth: none. No nested families/species — payload stays ~20–25 strings.
- **`order(slug)`** — resolves slug → `orderScientific`, returns `{ order, families }` where `families` is distinct `familyScientific` in that order, each with parent `Order` populated. Returns `null` for unknown slug (client shows 404 card). Auth: none.
- **`family(slug)`** — resolves slug → `familyScientific`, returns `{ family, species }` where `species` is all species with that `familyScientific`, sorted by Swedish name (Swedish collator). Returns `null` for unknown slug. Auth: none.
- **`speciesSearch(query: String!)`** — empty/whitespace query returns `[]`. Non-empty runs a two-phase match (see Business Logic). Returns at most 100 species. Auth: none.
- **Slug derivation**: single helper `packages/server/src/utils/slug.ts` — `scientificToSlug(name: string): string` that lowercases, NFD-normalises, strips non-ASCII, and collapses whitespace to dashes. Reused by resolvers and the backfill script.
- **Errors**: unknown slug → GraphQL `null`; transport/server errors bubble through Apollo and trigger the client error state copy ("Kunde inte hämta…").

Existing queries (`species`, `speciesById`, `searchSpecies`, `speciesByScientificName`, etc.) are unchanged.

### Business Logic

#### Row rendering

Fågelbok rows at all three levels (Order, Family, Species) share a simple layout: Swedish name primary (`font-medium`), scientific name secondary (`text-xs italic text-muted-foreground`), right-side `ChevronRightIcon`. **No thumbnails, no images** in browse lists. When a Swedish name is missing, the scientific name moves to the primary line in italic; the secondary line stays empty. One shared row component (`packages/client/src/components/GuidebookRow.tsx`) is used for all three levels.

#### Sorting

Orders, Families, Species all sort by Swedish name using `Intl.Collator('sv', { sensitivity: 'base' })`. Rows with `swedishName === null` sort after all named rows, alphabetised by scientific name.

#### Search normalisation

`packages/server/src/utils/normalize.ts`:

```ts
export function normalizeForSearch(s: string): string {
  return s.toLocaleLowerCase("sv").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
```

`Query.speciesSearch` resolver runs a two-phase lookup:

1. Trim query; return `[]` on empty.
2. Coarse fetch via Prisma:
   ```ts
   prisma.species.findMany({
     where: {
       OR: [
         { swedishName: { contains: trimmed, mode: "insensitive" } },
         { scientificName: { contains: trimmed, mode: "insensitive" } },
       ],
     },
   });
   ```
   Postgres `ILIKE` catches the common case ("blåmes" contains "blå") but misses accent-insensitive matches ("blames" → "Blåmes").
3. If the coarse fetch returns fewer than 5 matches, run a broader fallback: load all species (≤ 336 rows) and JS-filter with `normalizeForSearch(candidate.swedishName).includes(normalizeForSearch(query)) || normalizeForSearch(candidate.scientificName).includes(normalizeForSearch(query))`. Union, dedupe by `id`.
4. Sort results by Swedish name (Swedish collator), take first 100.

English names are **not** searched.

#### Client search UX

- Search input on `/guidebook` only (drilled views have none).
- Placeholder: `Sök art…`. No autofocus.
- `useDeferredValue` (React 18) defers the query that is sent to the Apollo hook. Apollo's `useQuery` is skipped while the deferred trimmed value is empty.
- Clear (×) button appears when the query is non-empty; tapping it empties the query.
- Query is preserved across species drill-down + back; cleared only on full reload or tab unmount.
- Comparison is accent-insensitive on both client and server paths. Display values always retain diacritics.
- Search results list is wrapped in `<div role="status" aria-live="polite" aria-atomic="false">` with a visually-hidden summary ("N arter matchar") announced when the deferred query settles.

#### Backfill rules

Script location: `packages/server/prisma/backfill-taxonomy.ts`. Wired to `npm run backfill:taxonomy` via a new entry in `packages/server/package.json`. Not part of `prisma migrate deploy` or CI.

For each species in DB:

1. By default, skip species where `orderScientific` is already set. `--force` flag re-runs everything.
2. Resolve `taxonId` via new helper `findTaxonIdByScientificName(scientificName: string): Promise<number | null>` in `services/artdatabanken.ts`.
3. Resolve parents via new helper `getTaxonParents(taxonId: number): Promise<{ family: TaxonRef | null; order: TaxonRef | null }>`, where `TaxonRef = { taxonId: number; scientificName: string; vernacularName: string | null }`. Implementation: Artdatabanken Search endpoint with `output.fieldSet: "All"` to include `taxon.higherClassification`; pick rank = "Family" and rank = "Order". If the SOS API does not return this in practice, the Taxonomy service endpoint is the fallback — validated in Task 3 before the backfill runs.
4. Write `{ familyScientific, orderScientific, order }`. Leave existing `family` (Swedish) alone — already correct in the seed.
5. If Artdatabanken returns no Swedish vernacular for the order, look up `packages/server/src/data/swedish-taxonomy-names.json`. If still missing, leave `order = null`.
6. Rate limit: 5 concurrent lookups, 200 ms pause between batches (matches existing `bulkResolveTaxonNames` pattern). Expected total runtime ≈ 15 s for the ~336-row seed.
7. Log progress every 50 species. Log the count of null `order` at the end.

Idempotent by default; safe to re-run after a partial failure.

#### LifeListDetailPage changes

- Remove the description paragraph from the page.
- Enlarge the species image to an `aspect-[4/3] object-cover` container that fills content width (minus standard padding).
- Drop `description` from the `MY_LIFE_LIST` GraphQL query selection set (`packages/client/src/graphql/queries.ts`) to avoid firing the Wikipedia resolver unnecessarily on life-list rows that never render it.
- Add a `<Button variant="default" className="w-full" asChild>` wrapping `<Link to={"/bird/" + encodeURIComponent(species.scientificName)}>`, label `Mer om arten`, leading `<BookOpenIcon className="mr-2 h-4 w-4" />`. Placed inline below the image, above the metadata card.
- Metadata card, map, and observation list are **unchanged**.

#### BirdInfoPage hero image change

- Replace the existing ~20×20 thumbnail with an `aspect-[4/3] object-cover` hero image filling content width. Same treatment as LifeListDetailPage for visual consistency.
- No other change to BirdInfoPage.

### Integrations

- **Artdatabanken SOS API** — two new helpers in `packages/server/src/services/artdatabanken.ts`:
  - `findTaxonIdByScientificName(scientificName)` — Search endpoint filtered by `taxon.scientificName`, returns the first matching `taxonId` or `null`.
  - `getTaxonParents(taxonId)` — Search endpoint with `output.fieldSet: "All"` and the given taxonId, picks rank = "Family" and "Order" from `taxon.higherClassification`. Fallback path: Taxonomy service endpoint if SOS does not expose `higherClassification`.
- **OpenAI, Wikimedia, PostgreSQL** — no changes specific to this feature.
- **Static fallback JSON** — `packages/server/src/data/swedish-taxonomy-names.json`:
  ```json
  {
    "orders": { "passeriformes": { "sv": "Tättingar" } },
    "families": { "paridae": { "sv": "Mesar" } }
  }
  ```
  Imported via TypeScript `resolveJsonModule`. Initial content covers orders not already carried by the seed's `family` strings.

---

## Implementation Plan

- [x] **Task 1:** Prisma migration `add_species_taxonomy` — add `order`, `orderScientific`, `familyScientific` (all `String?`) and two `@@index` declarations to `Species`.
  - Test: `npx prisma migrate dev --name add_species_taxonomy` succeeds on a clean DB; `prisma.species.findFirst()` includes the new (null) fields; `npm run test --workspace=packages/server` still green.
  - Notes: Additive only. No existing columns touched.

- [x] **Task 2:** Utilities — `packages/server/src/utils/slug.ts` (`scientificToSlug`) and `packages/server/src/utils/normalize.ts` (`normalizeForSearch`).
  - Test: Vitest unit tests — `scientificToSlug("Passeriformes") === "passeriformes"`, `scientificToSlug("Motacilla alba") === "motacilla-alba"`; `normalizeForSearch("Blåmes") === "blames"`, `normalizeForSearch("Östlig törnskata") === "ostlig tornskata"`.
  - Notes: Pure functions, no deps. Both used by resolvers and the backfill script.

- [x] **Task 3:** Artdatabanken helpers — add `findTaxonIdByScientificName(scientificName)` and `getTaxonParents(taxonId)` in `services/artdatabanken.ts`. Validate the `higherClassification` path works against the live SOS API before locking the implementation; document the chosen endpoint in a short code comment.
  - Test: Vitest — mock `fetch` returning a taxon with `higherClassification` that contains Family and Order entries; assert `getTaxonParents` returns the correct `TaxonRef` for each rank. Separate test for the `null` path (taxon not found, or higherClassification missing).
  - Notes: Reuse existing request patterns (scalar env reads, `AbortSignal.timeout`, Ocp-Apim-Subscription-Key header).

- [ ] **Task 4:** Static fallback JSON — `packages/server/src/data/swedish-taxonomy-names.json` with initial entries for orders not already carried by the seed.
  - Test: Vitest — the file parses; every key is lowercase ASCII `[a-z0-9-]+`; every `sv` value is a non-empty string.
  - Notes: Start with the obvious gaps (e.g. `passeriformes` → Tättingar). Expand as the backfill surfaces missing names in Task 5.

- [ ] **Task 5:** Backfill script — `packages/server/prisma/backfill-taxonomy.ts` + `npm run backfill:taxonomy` entry in `packages/server/package.json`.
  - Test: Vitest — unit test the pure resolution function (given mocked Artdatabanken responses + static-fallback import, produces the correct update payload for a sample species); integration test against a local test DB with a 3-species fixture runs end-to-end and asserts idempotency on re-run.
  - Notes: Idempotent by default; `--force` re-runs. 5 concurrent + 200 ms pause. Log progress every 50 species and the count of null `order` at the end.

- [ ] **Task 6:** GraphQL schema additions — `Order`, `Family`, `OrderDetail`, `FamilyDetail` types and `allOrders`, `order(slug)`, `family(slug)`, `speciesSearch(query)` queries in `packages/server/src/schema/typeDefs.ts`.
  - Test: Schema loads without error in the existing server test harness; `introspectionQuery` returns the new types and fields.
  - Notes: Keep `Order`, `Family`, `Species` as separate types; `Family.order` is the only cross-link.

- [ ] **Task 7:** Resolvers — `allOrders`, `order(slug)`, `family(slug)`, `speciesSearch(query)` in `packages/server/src/schema/resolvers.ts`.
  - Test: Integration tests in `resolvers.test.ts`: (a) `allOrders` returns distinct orders sorted by Swedish name, nulls last; (b) `order(slug)` returns `null` for unknown slug; (c) `order(slug)` returns families sorted by Swedish name; (d) `family(slug)` returns species sorted by Swedish name; (e) `speciesSearch("blåmes")` returns Blåmes; (f) `speciesSearch("blames")` (accent-stripped) also returns Blåmes via the JS post-filter fallback; (g) `speciesSearch("")` returns `[]`.
  - Notes: No auth guards.

- [ ] **Task 8:** Client GraphQL queries — `GET_ALL_ORDERS`, `GET_ORDER_BY_SLUG`, `GET_FAMILY_BY_SLUG`, `SPECIES_SEARCH` in `packages/client/src/graphql/queries.ts`.
  - Test: Vitest — each query compiles; Apollo `MockedProvider` resolves a sample response.
  - Notes: Browse queries select **only** `{ id, swedishName, scientificName }` on `Species` and `{ slug, swedishName, scientificName }` on `Order` / `Family`. Do **not** select `imageUrl` or `description` anywhere in the Fågelbok path. `fetchPolicy: "cache-first"` on `GET_ALL_ORDERS`, `GET_ORDER_BY_SLUG`, `GET_FAMILY_BY_SLUG`. Default fetch policy on `SPECIES_SEARCH`; skip the hook when the trimmed query is empty.

- [ ] **Task 9:** Shared row component — `packages/client/src/components/GuidebookRow.tsx`. Swedish name primary (`font-medium`), scientific italic secondary (`text-xs italic text-muted-foreground`), right-side `ChevronRightIcon`, `truncate` on both lines, full-row `<button>`, `active:bg-muted/50`, `border-b border-border/50 last:border-b-0`. When Swedish name is null, scientific moves to primary line in italic, secondary empty.
  - Test: Vitest + RTL — renders Swedish + scientific lines; renders scientific-only fallback when Swedish is null; button activates on Enter.
  - Notes: Reused for Order, Family, Species rows.

- [ ] **Task 10:** `FagelbokLandingPage` at `/guidebook` — sticky search bar + Order list; search results swap in when deferred query non-empty.
  - Test: Vitest + RTL — (a) renders orders from `MockedProvider`; (b) typing a query and waiting for `useDeferredValue` triggers `SPECIES_SEARCH` and renders results; (c) × button clears the query and restores the Order list; (d) hidden aria-live summary announces "N arter matchar" on settle; (e) 0 results renders *"Inga arter matchar din sökning."*.
  - Notes: `useDeferredValue` debounce. Input has a visually-hidden `<label>` "Sök bland arter". No autofocus.

- [ ] **Task 11:** `FagelbokOrderPage` at `/guidebook/order/:orderSlug` — in-page back chevron, header (Swedish primary, scientific italic fallback), family list.
  - Test: Vitest + RTL — (a) renders families from `MockedProvider`; (b) unknown slug renders 404 card *"Ordningen finns inte."* with a "Till Fågelboken" link to `/guidebook`; (c) tapping a family row navigates to `/guidebook/family/:familySlug`.
  - Notes: Back chevron uses `navigate(-1)`.

- [ ] **Task 12:** `FagelbokFamilyPage` at `/guidebook/family/:familySlug` — in-page back chevron, header, species list.
  - Test: Vitest + RTL — (a) renders species list; (b) unknown slug renders *"Familjen finns inte."* 404 card; (c) tapping a species row navigates to `/bird/:scientificName`.
  - Notes: Reuses `GuidebookRow`.

- [ ] **Task 13:** BottomNav — add Fågelbok as the 5th tab with `BookOpenIcon` and label "Fågelbok"; route target `/guidebook`.
  - Test: Vitest + RTL — 5 tabs render; the Fågelbok tab highlights as active on `/guidebook`, `/guidebook/order/*`, and `/guidebook/family/*`; 320 px-wide viewport still fits 5 tabs without overflow.
  - Notes: Tighter spacing is acceptable at 320 px; revisit only if it tests poorly.

- [ ] **Task 14:** Routes — add `/guidebook`, `/guidebook/order/:orderSlug`, `/guidebook/family/:familySlug` to `packages/client/src/App.tsx` after `/bird/:scientificName`.
  - Test: Vitest + RTL — each route renders its page; unknown `/guidebook/foo` falls through to the existing catch-all.
  - Notes: None.

- [ ] **Task 15:** LifeListDetailPage — remove description, enlarge image to `aspect-[4/3] object-cover`, add "Mer om arten" button; drop `description` from `MY_LIFE_LIST`.
  - Test: Vitest + RTL — description element absent from DOM; image container has the `aspect-[4/3]` class; button renders with `BookOpenIcon` and navigates to `/bird/:scientificName`; `MY_LIFE_LIST` no longer requests `description` (assert via Apollo mock).
  - Notes: Quick grep to confirm no other component consumes `Species.description` via `MY_LIFE_LIST`.

- [ ] **Task 16:** BirdInfoPage — enlarge hero image to `aspect-[4/3] object-cover` filling content width.
  - Test: Vitest + RTL — image container has the `aspect-[4/3]` class and no fixed 20 px dimension class; existing tests still pass.
  - Notes: Scope-only change; no other BirdInfoPage content is touched.

- [ ] **Task 17:** Glossary update — edit `GLOSSARY.md` to add the four new App Concept entries (Guidebook/Fågelbok, Order, Family, Taxonomy backfill) and update the Phase 8 line.
  - Test: File parses as valid Markdown; the four new entries are present.
  - Notes: See `Overview → Glossary updates` below.

- [ ] **Task 18:** E2E Playwright test — `packages/e2e/tests/fagelbok.spec.ts` covering the full browse + search + LifeListDetail flow.
  - Test: The Playwright spec itself. Open Fågelbok tab → Order list renders → tap Tättingar → Family list → tap Mesar → Species list → tap Talgoxe → `/bird/parus-major` renders. Back to landing. Type "blames" → Blåmes appears → tap → `/bird/parus-caeruleus`. From life-list: open a species → tap "Mer om arten" → BirdInfoPage.
  - Notes: E2E setup runs the seed + `npm run backfill:taxonomy` so taxonomy fields are populated.

---

## Acceptance Criteria

- [ ] Bottom-nav has a 5th tab "Fågelbok" with `BookOpenIcon`; active state lights up across `/guidebook` and its children.
- [ ] `/guidebook` renders a sticky search bar ("Sök art…") and an alphabetical Order list (Swedish primary, scientific italic secondary).
- [ ] Typing ≥ 1 character in the search bar replaces the Order list with a flat species list matching Swedish or scientific name, accent-insensitive, after `useDeferredValue` settles.
- [ ] `/guidebook/order/:orderSlug` and `/guidebook/family/:familySlug` render with in-page back chevrons and drop back through the history linearly.
- [ ] Tapping any species row (in any Fågelbok view) navigates to `/bird/:scientificName`.
- [ ] Unknown slugs render 404-style cards (*"Ordningen finns inte."* / *"Familjen finns inte."*) with a "Till Fågelboken" link.
- [ ] Browse queries (`allOrders`, `order`, `family`, `speciesSearch`) never select `Species.imageUrl` or `Species.description`, so they never trigger Wikipedia/Wikimedia fetches.
- [ ] LifeListDetailPage no longer renders the inline description; species image fills content width at `aspect-[4/3]`; "Mer om arten" button is present and links to `/bird/:scientificName`.
- [ ] BirdInfoPage hero image fills content width at `aspect-[4/3]` (enlarged from the current thumbnail).
- [ ] `npm run backfill:taxonomy` populates `orderScientific` and `familyScientific` for all seeded species; ≥ 90% also have a Swedish `order`. Re-running without `--force` is a no-op.
- [ ] `GLOSSARY.md` includes the four new entries and the updated Phase 8 line.
- [ ] `npm run test --workspace=packages/server` passes.
- [ ] `npm run test --workspace=packages/client` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `npm run lint` and `npm run typecheck` pass.

---

## Non-Goals

- This spec does **not** cover offline caching of the dictionary or species pages.
- This spec does **not** cover filters beyond name search (no red-list, habitat, migration, or size filters).
- This spec does **not** allow users to edit species content (notes, tags, custom descriptions).
- This spec does **not** surface the user's observation history on BirdInfoPage.
- This spec does **not** bulk-prefetch images or descriptions — enrichment remains on-demand at BirdInfoPage open.
- This spec does **not** show species thumbnails or any decorative imagery in Fågelbok browse lists.
- This spec does **not** show rarity context in Fågelbok (Fågelbok is non-geolocation).
- This spec does **not** add gamification, streaks, counts on Order/Family rows, badges, or progress indicators.
- This spec does **not** redesign BirdInfoPage beyond enlarging the hero image.
- This spec does **not** support English-name search.
- This spec does **not** add audio or range-map features.
- This spec does **not** introduce taxonomic levels beyond Order and Family (no Class, Genus, etc.).
- This spec does **not** expand the ~336-species seed.
- This spec does **not** auto-sync taxonomy with Artdatabanken — the backfill is a one-time manual run.
- This spec does **not** virtualise any list (336 rows fit natively in the DOM).
- This spec does **not** install the Postgres `unaccent` extension — accent-insensitive search is handled with a JS post-filter.

---

## Security & Compliance Considerations

- All dictionary data is public (species + taxonomy). No user PII involved.
- Search queries are not logged.
- No new external data is shown to users beyond what Artdatabanken and Wikipedia already surface.
- No auth changes; all new queries are public.
- No GDPR implications — cached data is species-level, not user-level.
- The backfill script runs against the Artdatabanken API with the existing subscription key; no new secrets.

---

## Glossary updates (applied in Task 17)

Add to `GLOSSARY.md` under **App Concepts**:

- **Guidebook (Fågelbok)** — in-app bird dictionary feature at `/guidebook`; searchable, with Order → Family → Species drill-down of the seeded Swedish bird universe
- **Order (Ordning)** — taxonomic rank above family (e.g. Passeriformes / Tättingar); added to `Species` in this feature
- **Family (Familj)** — taxonomic rank above species (e.g. Paridae / Mesar); `Species.family` holds the Swedish name, `Species.familyScientific` the Latin name
- **Taxonomy backfill** — one-time script (`npm run backfill:taxonomy`) that enriches existing seeded species with order + scientific family/order via Artdatabanken, with a static JSON fallback

Replace under **Phases**:

- `Phase 8 — bird dictionary / discover feature` → `Phase 8 — Fågelbok (guidebook): bird dictionary with taxonomic browse and search`

---

## Risks & Open Questions

| # | Risk / Question | Owner | Status |
|---|----------------|-------|--------|
| 1 | Artdatabanken taxonomy endpoint shape — SOS `higherClassification` availability vs the Taxonomy service `/parents` endpoint | Henrik | Open — validate in Task 3; if neither works, backfill blocked until resolved |
| 2 | Swedish order-name coverage from Artdatabanken — some orders may have no Swedish name anywhere | Henrik | Accepted — UX gracefully degrades to scientific italic; static JSON covers known gaps |
| 3 | Bottom-nav spacing with 5 tabs on 320 px-wide phones | Henrik | Accepted — tighter spacing fits; verify in Task 13 |
| 4 | Accent-insensitive search without the Postgres `unaccent` extension | Henrik | Mitigated — JS post-filter after coarse Prisma `ILIKE` fetch |
| 5 | Backfill fails mid-run (API rate limit, network) | Henrik | Mitigated — script is idempotent; re-run resumes where it left off |
| 6 | `MY_LIFE_LIST` selection change drops `description`; could break another component that consumes it | Henrik | Open — audit in Task 15 |
| 7 | Two `PrismaClient` instances across server modules (backfill script + existing resolvers) | Henrik | Accepted — matches the existing pattern; shared singleton is a future refactor |

---

## Review Checklist

- [ ] Data model reviewed (architect / lead)
- [ ] API design reviewed
- [ ] Security considerations addressed
- [ ] Implementation tasks are granular enough (each testable in isolation)
- [ ] Non-goals are explicit
- [ ] Acceptance criteria are measurable
