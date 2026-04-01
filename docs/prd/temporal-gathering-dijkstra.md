# PRD: Sortering av observationer

**Slug:** `temporal-gathering-dijkstra`
**Phase:** 7b
**Status:** Approved
**Created:** 2026-04-01

---

## Problem

The sightings list has a fixed sort order (newest first, server-side). Users have no way to sort by species name or location, making it hard to find specific sightings when they remember the bird or place but not the date.

---

## Success Criteria

- [ ] User can switch sort order between 4 options: Nyast först, Äldst först, Art (A–Ö), Plats (A–Ö)
- [ ] Sort button in the page header reflects the active sort when non-default
- [ ] Tapping the sort button opens a bottom sheet with radio-style options
- [ ] Date sorts preserve existing month grouping
- [ ] Species and location sorts render a flat list (no section headers)
- [ ] Null/empty locations sort to the end of the list
- [ ] Swedish locale ordering is used (Å/Ä/Ö after Z)
- [ ] Sort state is ephemeral — not persisted in URL or localStorage
- [ ] User cannot sort by rarity (explicit non-goal)

---

## Non-Goals

- No server or GraphQL changes — all sorting is client-side only
- No URL param or localStorage persistence for sort state
- No rarity sort option (too many nulls make it unreliable)
- No grouping by species or location when sorted by those fields

---

## User Stories

1. As an authenticated birdwatcher, I want to sort my sightings by species name (A–Ö) so that I can quickly find all observations of a specific bird.
2. As an authenticated birdwatcher, I want to sort my sightings by location (A–Ö) so that I can review everything I have seen at a specific place.
3. As an authenticated birdwatcher, I want to sort oldest-first so that I can review my earliest observations.

---

## Technical Scope

### Server changes
- None

### Client changes
- [ ] New component: `packages/client/src/components/ui/sheet.tsx` — reusable bottom sheet built on `@base-ui/react/dialog` (same pattern as `dialog.tsx`); exports `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`
- [ ] New utility: `packages/client/src/lib/sortSightings.ts` — pure sort utility; exports `SortKey` type, `SORT_OPTIONS`, `sortSightings(sightings, sort)`, `isDateSort(sort)`
- [ ] New test file: `packages/client/src/lib/sortSightings.test.ts` — written first (TDD)
- [ ] Modified page: `packages/client/src/pages/SightingsListPage.tsx` — add sort state, sort button, sheet trigger, and conditional grouped/flat rendering

### Shared changes
- None

---

## Acceptance Criteria

1. Given the sightings list is open, when the user taps the sort button, then a bottom sheet opens with 4 sort options displayed as a radio list.
2. Given the bottom sheet is open, when the user selects a sort option, then the sheet closes and the list re-renders immediately in the chosen order.
3. Given sort is set to "Nyast först" (default), when the list renders, then the sort button shows no active label override.
4. Given sort is set to any non-default option, when the list renders, then the sort button label shows the active sort name (e.g. "Art (A–Ö)").
5. Given sort is "date-desc" or "date-asc", when the list renders, then sightings are grouped by month as before.
6. Given sort is "species-asc", when the list renders, then sightings appear as a flat list sorted by Swedish name using `localeCompare("sv")`.
7. Given sort is "location-asc", when the list renders, then sightings with null or empty location appear at the end, and named locations are sorted A–Ö using `localeCompare("sv")`.
8. Given two sightings with the same date, when sorted by "date-desc", then the sighting with the higher id appears first.

---

## Test Requirements

### Unit/Integration (Vitest)
- `sortSightings.test.ts`:
  - `date-desc`: newest first; tie on date → higher id first; does not mutate input array
  - `date-asc`: oldest first
  - `species-asc`: Swedish locale ordering (Å/Ä/Ö after Z)
  - `location-asc`: named locations A–Ö; null/empty sorts to end; Swedish locale
  - `isDateSort`: returns true for `date-desc`/`date-asc`, false for others
  - `SORT_OPTIONS`: exactly 4 entries, first is `date-desc`

### E2E (Playwright)
- None required (UI interaction covered by manual verification; sort logic covered by unit tests)

---

## Glossary Updates

New terms introduced by this feature (these get appended to GLOSSARY.md):

| Term | Definition |
|------|-----------|
| sort key | An identifier string for a sighting sort order (e.g. `date-desc`, `species-asc`) |
| bottom sheet | A modal panel that slides up from the bottom of the screen, used for contextual option selection |
| flat list | A sightings list rendered without section/month headers, used for non-date sort orders |

---

## Open Questions

- None

---

## Implementation Notes

- TDD order: write `sortSightings.test.ts` (all failing) → implement `sortSightings.ts` → build `sheet.tsx` → update `SightingsListPage.tsx`.
- `sheet.tsx` should follow the exact same pattern as the existing `dialog.tsx` component — use `@base-ui/react/dialog` internally, slide up from bottom.
- `sortSightings` must return a new array and never mutate its input.
- For `location-asc`, treat both `null` and `""` as "no location" — sort these to the end.
- Verification: `npm run test --workspace=packages/client` passes; manual check on mobile viewport for bottom sheet behaviour and Swedish locale ordering (Å/Ä/Ö after Z).
