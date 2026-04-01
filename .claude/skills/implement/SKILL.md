---
name: implement
description: Implement a single GitHub issue using TDD. Writes failing tests first, then implements, then opens a PR.
---

Usage: /implement ISSUE_NUMBER

This skill runs in a fresh context. It reads all context from artifacts — no prior conversation history required.

Bootstrap sequence (always run these first, in order):
1. `gh issue view ISSUE_NUMBER` — read the full issue body
2. Note the PRD slug from the issue body. Read `docs/prd/FEATURE_SLUG.md`.
3. Read `CLAUDE.md` — conventions, test commands, GraphQL pattern, data layer pattern.
4. Read `GLOSSARY.md` — domain terms.
5. Read every file listed in the issue's "Files to Read Before Starting" section.

Branch setup:
```
git checkout -b feat/issue-ISSUE_NUMBER-short-description
```

TDD protocol — strictly in this order:
1. Write failing tests first. Vitest tests go colocated with source (`src/**/*.test.ts(x)`). Playwright tests go in `packages/client/e2e/`.
2. Run tests to confirm they fail:
   - Client: `npm run test --workspace=packages/client`
   - Server: `npm run test --workspace=packages/server`
   - E2E: `npm run test:e2e` (only if the issue requires Playwright)
3. Write the implementation to make the tests pass. Follow the patterns from the files you read in the bootstrap sequence.
4. Run tests again to confirm they pass.
5. Run `npm run typecheck` — fix any type errors before continuing.
6. Run `npm run lint` — fix any lint errors before continuing.

Commit convention:
- `feat(scope): description` for new features
- `fix(scope): description` for bug fixes
- `test(scope): description` for test-only changes

PR creation:
```
gh pr create \
  --title "TITLE" \
  --body "$(cat <<'EOF'
## Summary
[one sentence]

## Changes
[bullet list of what was changed]

## Tests
- Vitest: [list test files and what they cover]
- Playwright: [list E2E scenarios covered, or "none"]

Closes #ISSUE_NUMBER
EOF
)"
```

CHECKPOINT: Tell the user — "PR opened at [URL]. Assign yourself for review. Do not merge until review is complete. Run `/review PR_NUMBER` to address review comments when they arrive."

Do not merge. Stop here and wait for the user.
