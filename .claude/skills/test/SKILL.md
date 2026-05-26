---
name: test
description: Phase 4 of the Stage 3 feature workflow — reads implementation state from the task issue, runs the full test suite and linter via the verification-before-completion skill, posts results as a TL;DR comment, and updates the issue.
allowed-tools: Bash, Read
---

# Test Skill — Phase 4 of 6 (Stage 3)

You are running **Phase 4: Test** of the Stage 3 feature workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/test <N>`.

## Anti-Rationalization Guards

- "The tests were passing earlier in Phase 3 — no need to re-run" → No. Always run fresh. Prior results are not evidence.
- "There are a few failing tests but the main paths work" → No. Hard gate: zero failing tests before proceeding.
- "The linter has minor warnings but nothing critical" → No. Zero lint errors before proceeding. Warnings must be assessed and either fixed or explicitly accepted by the user.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments
```

Extract the branch name from the child body's `**Branch:**` field (and from the Phase 3 TL;DR).

**Verify gate:** Phase 3 must be `[x]` in `## Task Workflow Progress`. If not, stop and tell the user to complete `/implement <N>` first.

Ensure you're on the correct branch:

```bash
git status
git branch --show-current
```

---

## Step 2 — Run the Full Test Suite

Invoke the `verification-before-completion` skill — it reads the test/lint commands from `.claude/CLAUDE.md` §Per-project config and runs them fresh.

Capture the complete output — do not summarise or paraphrase. The raw output is the evidence.

**Hard gate:** Do not proceed if any tests fail or if there are lint errors. Fix failures (diagnose → fix code, not the test unless the test was wrong → re-run) until clean.

---

## Step 3 — Post TL;DR and Update Issue

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 4 TL;DR: Test
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Full test suite run: [N] tests passed, 0 failed
- Linter run: 0 errors, [N] warnings (accepted/fixed)
- [Note any failures found and fixed during this phase]

### Key artifacts
- Test output: clean ✅
- Lint output: clean ✅

### Next step
Run `/clear`, then `/review <N>` in a fresh session.
EOF
)"
```

Update the child body: set `- [x] Phase 4: Test — <YYYY-MM-DD>` in `## Task Workflow Progress`.

---

## Handoff

> **Phase 4: Test — Complete ✅**
> All tests pass, linter clean.
>
> Next: Run `/clear`, then:
>
> ```
> /review <N>
> ```
