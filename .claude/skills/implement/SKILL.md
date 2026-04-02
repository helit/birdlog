---
name: implement
description: Implement a single GitHub issue using strict red/green/refactor TDD — one test at a time, then opens a PR.
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

TDD protocol — strict red/green/refactor, one test at a time:

Work through the Test Requirements from the issue in order. For each test:

**RED** — Write one test. Run the test suite and confirm:
- This test fails
- No other previously-passing tests broke
- Vitest: `npm run test --workspace=packages/client` or `packages/server`
- Playwright: `npm run test:e2e` (only if the issue requires it)

**GREEN** — Write the minimal implementation to make this test pass. No more than needed. Run tests again and confirm:
- This test now passes
- Nothing else broke

**REFACTOR** — With tests green, improve the code: remove duplication, clarify names, simplify logic. Run tests again to confirm still green.
- Do not add new behavior during refactor
- Do not skip this pass — even if nothing is obvious, take a moment to look

Commit, then move to the next test and repeat.

Rules:
- Never write more than one new test at a time
- Never write implementation before the test exists and is confirmed red
- Commit strategy: one commit per completed cycle, or group closely related cycles if they form a natural unit

After all tests pass:
- Run `npm run typecheck` — fix any type errors
- Run `npm run lint` — fix any lint errors

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
