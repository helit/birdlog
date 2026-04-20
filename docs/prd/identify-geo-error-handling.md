# PRD: Identify Page Geolocation Error Handling

**Slug:** `identify-geo-error-handling`
**Phase:** 7b
**Status:** Draft
**Created:** 2026-04-06

---

## Problem

The `IdentifyPage` (landing page `/`) calls `navigator.geolocation.getCurrentPosition` without a `timeout` option, which defaults to `Infinity`. On Firefox desktop, dismissing the location permission prompt (clicking X rather than Allow or Block) leaves the request silently pending — neither the success nor the error callback ever fires. Since `isLoading` depends on either `latitude` being set or `geoError` being true, the page is permanently stuck showing skeleton loaders with no error message and no way to recover, without any visible console errors.

---

## Success Criteria

- [ ] The skeleton resolves within 10 seconds on any browser where geolocation doesn't respond
- [ ] When geolocation times out, a "Försök igen" button lets the user re-trigger the permission prompt
- [ ] When geolocation is explicitly denied, the UI shows a message explaining the user must allow location services
- [ ] When geolocation is denied, no retry button is shown (re-prompting is impossible)
- [ ] When retry succeeds, the page loads normally with nearby birds data

**Non-goals:**
- Storing or remembering the last known location between sessions
- Automatically retrying without user action
- Detecting or handling OS-level location service being disabled

---

## Non-Goals

- Storing last known location in localStorage or similar
- Retry with exponential backoff or automatic retry
- Distinguishing between OS-level and browser-level permission denial

---

## Reproduction Steps

1. Open the app in Firefox desktop
2. When the location permission prompt appears, click X (dismiss without allowing or denying)
3. Observe the page

**Observed behavior:** Skeleton loaders remain indefinitely. No error shown. No way to recover without a full page reload.

**Expected behavior:** After 10 seconds, the skeleton resolves into an error card with context-appropriate messaging and (if dismissal/timeout) a retry button.

**Scope:** Reproducible in Firefox desktop. Chrome and Safari trigger the error callback on dismissal so are less affected, but the timeout fix benefits all browsers where GPS acquisition is slow.

---

## Root Cause

**Confidence: confirmed**

`getCurrentPosition` is called without a `timeout` option (line 112 of `IdentifyPage.tsx`):

```ts
navigator.geolocation.getCurrentPosition(
  (pos) => { ... },
  () => setGeoError(true),
);
```

The default `timeout` is `Infinity`. Firefox does not call either callback when the user dismisses (rather than denies) the permission prompt. The `isLoading` guard:

```ts
const isLoading = !geoError && !error && (loading || !latitude);
```

remains `true` forever because `latitude` is never set and `geoError` is never set.

Fix: pass `{ timeout: 10000 }` as the third argument to `getCurrentPosition`. The browser will then call the error callback with `GeolocationPositionError.TIMEOUT` (code 3) after 10 seconds if no position has been obtained. Additionally, distinguish the error type to show appropriate UI for `PERMISSION_DENIED` (code 1) vs `TIMEOUT` (code 3).

---

## Technical Scope

### Server changes
- None

### Client changes
- [ ] Modified pages: `packages/client/src/pages/IdentifyPage.tsx`
  - Replace `geoError: boolean` state with `geoErrorType: 'denied' | 'timeout' | null`
  - Pass `{ timeout: 10000 }` to `getCurrentPosition`
  - In the error callback, set `geoErrorType` to `'denied'` if `error.code === 1`, else `'timeout'`
  - Add retry handler: resets `latitude`, `longitude`, and `geoErrorType` to initial state, then calls `getCurrentPosition` again
  - Render "Försök igen" button when `geoErrorType === 'timeout'`
  - Render "Du måste tillåta platstjänster i din webbläsare" when `geoErrorType === 'denied'`
  - Update `isLoading` guard: replace `geoError` references with `geoErrorType !== null`

### Shared changes
- None

---

## Acceptance Criteria

1. Given the location permission prompt is dismissed (or geolocation does not respond), when 10 seconds have elapsed, then the skeleton is replaced by an error card showing "Kunde inte hämta din position" and a "Försök igen" button.
2. Given the "Försök igen" button is shown, when the user taps it, then `getCurrentPosition` is called again and the skeleton shows while waiting.
3. Given the user taps "Försök igen" and then allows location, then the page loads with nearby birds data.
4. Given the user taps "Försök igen" and then denies location, then the error card updates to show "Du måste tillåta platstjänster i din webbläsare" with no retry button.
5. Given the location permission is explicitly denied on first load (error code 1), then the skeleton is immediately replaced by the denied error card with no retry button.

---

## Test Requirements

### Unit/Integration (Vitest)

File: `packages/client/src/pages/IdentifyPage.test.tsx`

- Mock `navigator.geolocation.getCurrentPosition` to call the error callback with `{ code: 1 }` (PERMISSION_DENIED) → assert the denied message renders and no retry button is present
- Mock `navigator.geolocation.getCurrentPosition` to call the error callback with `{ code: 3 }` (TIMEOUT) → assert "Försök igen" button renders
- Mock `getCurrentPosition` to call error with `{ code: 3 }` on first call, then success with a valid position on second call → click "Försök igen" → assert `getCurrentPosition` was called twice and skeleton transitions to data loading state
- Assert `getCurrentPosition` is called with a third argument containing `{ timeout: 10000 }`

### E2E (Playwright)

None required — geolocation permission mocking in Playwright is environment-specific and the unit tests cover the critical paths.

---

## Regression Risk

- The existing `geoError: boolean` state is replaced by `geoErrorType: 'denied' | 'timeout' | null`. Any reference to `geoError` in `isLoading` must be updated to `geoErrorType !== null`. Missing this would re-introduce the infinite skeleton.
- No existing tests cover `IdentifyPage` geolocation paths, so there is no regression test safety net — the new tests added here are the first coverage of this code path.

---

## Glossary Updates

No new terms.

---

## Open Questions

None.

---

## Implementation Notes

- The retry handler should extract `getCurrentPosition` into a named function (e.g., `fetchLocation`) so it can be called both from the `useEffect` and the retry button `onClick`.
- `maximumAge: 300000` (5 min) can be added alongside `timeout: 10000` to allow cached positions and speed up repeat loads, but is optional.
- TDD order: write failing tests for PERMISSION_DENIED UI, TIMEOUT UI, and retry flow first; then implement state change; then confirm passing.
