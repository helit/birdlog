---
name: verification-before-completion
description: Use before claiming any task, feature, or bug fix is complete. Requires running the test suite and linter fresh and providing the actual output as evidence. Apply at the end of every Phase 3 task, before Phase 4 sign-off, and before creating a PR.
allowed-tools: Bash
---

# Verification Before Completion Skill

No task is complete without fresh evidence. This skill enforces a hard gate before any completion claim.

## When I Activate

- ✅ Before claiming a task is "done" or "complete"
- ✅ Before marking a plan sub-task as `[x]`
- ✅ Before moving from Phase 3 → Phase 4
- ✅ Before moving from Phase 4 → Phase 5
- ✅ Before creating a PR
- ✅ After any bug fix, before committing
- ✅ Whenever you would otherwise say "tests pass" or "looks good"

## The Law

**A completion claim is only valid if it is backed by fresh command output showing zero failures, zero lint errors, and exit code 0 — obtained in this exact response.**

## Anti-Rationalization Guards

These are invalid reasons to skip verification:

- "The tests were passing earlier" → Not valid. Run them fresh. Code changes since then may have broken something.
- "I can see the code is correct" → Not valid. Code review is not a substitute for running tests.
- "I just ran tests 5 minutes ago" → Not valid. Run them again. The cost is low; the risk is not.
- "The test runner takes too long" → Not valid. Wait for it. Do not proceed without output.
- "There are no tests for this code" → Flag this to the user. Missing test coverage is a finding, not a pass.
- "The linter has minor warnings" → Not valid. Zero warnings is the standard. Fix them or document why they're acceptable.

---

## The 5-Step Gate

Execute these steps in order. Do not skip any step. Do not claim completion until Step 5.

### Step 1: IDENTIFY

State the exact command(s) you will run to verify completion. Read them from `CLAUDE.md` or the project's test/lint config. Example:

```
Test command: npm test
Lint command: npm run lint
```

### Step 2: RUN

Execute the commands now, in this response. Do not read cached output. Do not assume the result.

### Step 3: READ

Read the full output carefully:

- Total tests: X passed, Y failed
- Lint errors: 0 errors, Z warnings
- Exit code: 0 or non-zero

### Step 4: VERIFY

Confirm the output meets the completion standard:

- ✅ 0 test failures
- ✅ 0 lint errors
- ✅ Exit code 0

If any condition is not met, this task is **not complete**. Fix the issues and repeat from Step 2.

### Step 5: CLAIM

Only after Step 4 passes: state completion and include the evidence inline.

Example format:

```
✅ Verification passed
  Tests:  47 passed, 0 failed (npm test, exit 0)
  Lint:   0 errors, 0 warnings (npm run lint, exit 0)
```

---

## What Counts as Evidence

**Valid:**

- Actual stdout from running the test command in this response
- Actual stdout from running the lint command in this response

**Not valid:**

- "Tests passed last time I ran them"
- "I can see the implementation is correct"
- Partial output (e.g., only showing passing tests, not the summary line)
- Output from a previous conversation turn
