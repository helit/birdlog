---
name: test
description: Phase 4 of the SDD workflow — reads implementation state from the issue tracker, runs the full test suite and linter via the verification-before-completion skill, posts results as a TL;DR comment, and updates the issue.
allowed-tools: Bash, Read
---

# Test Skill — Phase 4 of 6

You are running **Phase 4: Test** of the Spec-Driven Development workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If you have prior conversation history in this session unrelated to this phase, ask the user to run `/clear` and then re-run `/test <issue-number>`.

## Anti-Rationalization Guards

- "The tests were passing earlier in Phase 3 — no need to re-run" → No. Always run fresh. Prior results are not evidence.
- "There are a few failing tests but the main paths work" → No. Hard gate: zero failing tests before proceeding.
- "The linter has minor warnings but nothing critical" → No. Zero lint errors before proceeding. Warnings must be assessed and either fixed or explicitly accepted by the user.

---

## Step 1 — Load State from Issue Tracker

Ask the user for the issue number if not provided as an argument.

> **Platform note:** Commands below use `gh` (GitHub CLI). Check the **Version Control** section in `.claude/CLAUDE.md` for your project's platform and substitute accordingly (e.g. `glab issue view` for GitLab).

Run:
```bash
gh issue view <N> --json number,title,body,comments
```

From the output:
- Extract the branch name and spec path from the Phase 3 TL;DR comment

**Verify gate:** Check that Phase 3 is marked `[x]` in the issue's Workflow Progress checklist. If Phase 3 is not complete, stop and tell the user to complete `/implement <N>` first.

Ensure you are on the correct branch:
```bash
git status
git branch --show-current
```

If not on `feat/<feature-slug>`, ask the user to switch branches before proceeding.

---

## Step 2 — Run the Full Test Suite

Invoke the `verification-before-completion` skill.

Run the full test suite: `[TODO: insert test command from project config]`
Run the linter: `[TODO: insert lint command from project config]`

Capture the complete output — do not summarise or paraphrase. The raw output is the evidence.

**Hard gate:** Do not proceed to Step 3 if any tests fail or if there are lint errors. Fix failures before continuing.

If tests fail: diagnose the failure, fix the code (not the test, unless the test was wrong), re-run. Repeat until clean.

---

## Step 3 — Post TL;DR Comment and Update Issue

After a clean test run:

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 4 TL;DR: Test
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Full test suite run: [N] tests passed, 0 failed
- Linter run: 0 errors, [N] warnings (accepted/fixed)
- [Note any failures that were found and fixed during this phase]

### Key artifacts
- Test output: clean ✅
- Lint output: clean ✅

### Next step
Run `/clear`, then `/review <N>` in a fresh session.
EOF
)"
```

Update the issue body to mark Phase 4 complete:

```bash
gh issue edit <N> --body "$(cat <<'EOF'
## Feature: <feature-name>

<description>

## Workflow Progress
- [x] Phase 1: Define — <date>
- [x] Phase 2: Spec — <date>
- [x] Phase 3: Implement — <date>
- [x] Phase 4: Test — <YYYY-MM-DD>
- [ ] Phase 5: Review
- [ ] Phase 6: Commit & PR

## Links
- PRD: <path or "none">
- Spec: docs/specs/<feature-slug>.md
- Branch: feat/<feature-slug>
- PR: (to be added in Phase 6)
EOF
)"
```

---

## Handoff

Tell the user:

> **Phase 4: Test — Complete ✅**
> All tests pass, linter clean.
>
> Next: Run `/clear` to start a fresh session, then run:
> ```
> /review <N>
> ```
