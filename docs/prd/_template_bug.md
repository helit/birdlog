# PRD: [Bug Title]

**Slug:** `bug-slug`
**Phase:** [e.g., 7b, 8]
**Status:** Draft | Approved | Implemented
**Created:** YYYY-MM-DD

---

## Problem

One paragraph. What is broken, under what conditions, and why it matters.

---

## Success Criteria

What the user observes when the bug is fixed. Observable behaviors, not implementation details.

- [ ] Bug no longer reproduces when...
- [ ] User can... (restored capability)
- [ ] User cannot... (explicit non-goal that might be assumed)

---

## Non-Goals

Explicit scope limits on the fix:

- ...

---

## Reproduction Steps

Exact steps to reproduce:

1. ...
2. ...

**Observed behavior:** ...

**Expected behavior:** ...

**Scope:** All users | Specific conditions (describe)

---

## Root Cause

Hypothesis from code reading. Include confidence level (confirmed / likely / uncertain).

...

---

## Technical Scope

### Server changes
- [ ] Prisma schema changes (describe new models/fields)
- [ ] GraphQL type changes (new types, queries, mutations)
- [ ] New resolver logic
- [ ] External API calls (Artdatabanken, OpenAI, Wikipedia)

### Client changes
- [ ] New pages (list with route)
- [ ] Modified pages (list with what changes)
- [ ] New components
- [ ] GraphQL queries/mutations added or modified

### Shared changes
- None | [describe]

---

## Acceptance Criteria

Numbered, testable, specific. Use Given/when/then format. These become issue acceptance criteria.

1. Given [context], when [action], then [result]
2. Given [context], when [action], then [result]

---

## Test Requirements

### Unit/Integration (Vitest)
- [what to test at unit level — or "none required"]

### E2E (Playwright)
- [user journey to cover — or "none required"]

---

## Regression Risk

What else could break. Which existing tests cover the affected code path.

- ...

---

## Glossary Updates

New terms introduced by this fix (these get appended to GLOSSARY.md):

| Term | Definition |
|------|-----------|
| example-term | what it means in this project |

---

## Open Questions

- [ ] Question 1 (owner, deadline)

---

## Implementation Notes

Optional hints for the implementing Claude — root cause analysis, preferred fix approach, gotchas.
