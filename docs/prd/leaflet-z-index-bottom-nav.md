# PRD: Leaflet map floats over bottom navigation

**Slug:** `leaflet-z-index-bottom-nav`
**Phase:** 7b
**Status:** Draft
**Created:** 2026-04-02

---

## Problem

On `SightingDetailPage`, the page is scrollable and contains a `SightingMap` (Leaflet) partway down. Leaflet's internal CSS assigns z-indices of 200–700 to its pane elements (tile pane: 200, overlay pane: 400, shadow pane: 500, marker pane: 600, popup pane: 700). `BottomNav` has no explicit z-index — it uses the browser default (`auto`) — so Leaflet's panes paint over the nav bar during scroll. The fix is a CSS-only z-index correction across two components: `BottomNav` (raise above Leaflet) and `Sheet` (raise above `BottomNav` to preserve its layering).

---

## Success Criteria

- [ ] Scrolling `SightingDetailPage` never causes the Leaflet map to visually overlap the bottom navigation bar
- [ ] The bottom navigation remains fully visible and tappable at all times when a map is on screen
- [ ] The Sheet bottom sheet (sort picker on `SightingsListPage`) still renders above the bottom navigation when open
- [ ] `PickLocationPage` (fullscreen map, no `BottomNav`) is unaffected

---

## Non-Goals

- No changes to Leaflet's z-index values or configuration
- No layout changes to any page or component beyond the z-index properties being fixed
- Not fixing any other stacking context issues that may exist elsewhere

---

## Reproduction Steps

1. Log in and navigate to any sighting with a saved location (`/sighting/:id`)
2. Scroll the page down until the map is near the bottom of the viewport
3. Observe the Leaflet tile layer and/or marker pane overlapping the bottom navigation bar

**Observed behavior:** The Leaflet map tiles (and potentially markers) render on top of the bottom navigation bar, obscuring it.

**Expected behavior:** The bottom navigation bar always renders above page content including Leaflet map layers.

**Scope:** All users; any viewport where `SightingDetailPage` content is tall enough to scroll (all devices with a map sighting).

---

## Root Cause

**Confidence: confirmed.**

`BottomNav` (`packages/client/src/components/BottomNav.tsx:24`) declares `fixed bottom-0 left-0 right-0` via Tailwind but sets no `z-index`. Without an explicit z-index on a `position: fixed` element, the browser treats it as `z-index: auto`, which participates in the default stacking order. Leaflet's stylesheet (`leaflet/dist/leaflet.css`) hard-codes z-indices on its internal pane elements (up to 700 for `.leaflet-popup-pane`). These values exceed the effective stacking order of `BottomNav`, causing Leaflet content to paint on top.

Secondary: `SheetOverlay` and `SheetContent` in `packages/client/src/components/ui/sheet.tsx` both use `z-50` (Tailwind = `z-index: 50`), which is already below Leaflet's z-indices. After raising `BottomNav` to `z-[800]`, the Sheet would render behind the nav bar unless its z-index is also raised to `z-[900]`.

---

## Technical Scope

### Server changes
- None

### Client changes
- [ ] Modified components:
  - `packages/client/src/components/BottomNav.tsx` — add `z-[800]` to the `<nav>` element
  - `packages/client/src/components/ui/sheet.tsx` — update `SheetOverlay` from `z-50` to `z-[900]` and `SheetContent` (DialogPrimitive.Popup) from `z-50` to `z-[900]`

### Shared changes
- None

---

## Acceptance Criteria

1. Given the user is on `SightingDetailPage` with a map, when they scroll so the map reaches the bottom of the viewport, then the bottom navigation bar is fully visible above the map at all times.
2. Given the user is on `SightingsListPage`, when they tap the sort button and the Sheet opens, then the Sheet overlay and content render above the bottom navigation bar.
3. Given the user is on `PickLocationPage`, when they interact with the fullscreen map, then no visual regressions are introduced (page uses its own fixed overlay, no `BottomNav` rendered).

---

## Test Requirements

### Unit/Integration (Vitest)
- None required — z-index stacking is not testable at unit level.

### E2E (Playwright)
- None required — the fix is a two-line CSS change with trivially verifiable acceptance criteria; manual QA on a mobile viewport is sufficient.

---

## Regression Risk

- **Sheet bottom sheet:** `SheetOverlay` and `SheetContent` in `sheet.tsx` are both at `z-50`. After `BottomNav` moves to `z-[800]`, the Sheet must be raised to `z-[900]`. If this update is missed, the sort picker on `SightingsListPage` will render behind the nav bar.
- **No existing tests cover z-index stacking** — there are no Playwright tests for this code path.
- **`PickLocationPage`** uses a `z-[1000]` inner overlay and its own fixed bottom bar; `BottomNav` is not rendered on that page. Unaffected.

---

## Glossary Updates

No new terms.

---

## Open Questions

None.

---

## Implementation Notes

Apply changes in this order to avoid partial breakage:

1. `BottomNav.tsx:24` — add `z-[800]` to the `<nav>` className.
2. `sheet.tsx:27` — change `z-50` → `z-[900]` on `SheetOverlay`.
3. `sheet.tsx:45` — change `z-50` → `z-[900]` on `SheetContent` (the `DialogPrimitive.Popup`).

Z-index ladder established by this fix:
- Leaflet panes: 200–700 (unchanged, from Leaflet CSS)
- `BottomNav`: 800
- `Sheet` overlay + content: 900
