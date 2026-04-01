---
name: Feature task
about: Implementation task generated from a PRD
title: "[SLUG] Short description of task"
labels: feature
assignees: ''
---

## Summary

One sentence describing what this issue implements.

**PRD:** [docs/prd/FEATURE_SLUG.md](../docs/prd/FEATURE_SLUG.md)
**Part of feature:** FEATURE_SLUG
**Depends on:** #ISSUE_NUMBER (if any) | none

---

## Acceptance Criteria

Taken from the PRD "Acceptance Criteria" section. Copy only the criteria relevant to this issue.

- [ ] Given..., when..., then...
- [ ] Given..., when..., then...

---

## Test Requirements

### Vitest
- [ ] Describe what unit/integration test covers this

### Playwright
- [ ] Describe the E2E scenario — or "not required"

---

## Implementation Hints

- Key files to modify: [list specific file paths]
- Existing pattern to follow: [e.g., "follow pattern in packages/server/src/schema/resolvers.ts"]
- Known gotchas: [or "none"]

---

## Files to Read Before Starting

A fresh Claude must read these before writing any code:

- `docs/prd/FEATURE_SLUG.md`
- `CLAUDE.md`
- `GLOSSARY.md`
- [list 2–4 specific source files most relevant to this issue]

---

## Definition of Done

- [ ] Tests written first (TDD)
- [ ] Tests pass: `npm run test --workspace=packages/[client|server]`
- [ ] Typecheck passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] PR opened referencing this issue (`Closes #N`)
- [ ] PR reviewed and merged
