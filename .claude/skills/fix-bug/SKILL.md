---
name: fix-bug
description: Use when a bug needs to be diagnosed and fixed, when the user reports unexpected behavior, error messages, or incorrect output, or when the user runs /fix-bug. Follows systematic debugging — root cause analysis first, failing test second, minimal fix third, verification last.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Fix Bug Skill

Reproduce, diagnose, fix, and verify a bug using a systematic, evidence-first approach.

## When I Activate

- ✅ User runs `/fix-bug`
- ✅ User reports a bug, error, or unexpected behavior
- ✅ User pastes a stack trace or error message
- ✅ User says something "isn't working" or "broke"

## Anti-Rationalization Guards

If you find yourself thinking any of the following, **stop and re-read this skill**:

- "I can see the bug from the description, let me just fix it" → No. Perform root cause analysis. What you think is the bug may be a symptom.
- "The fix is obvious, I don't need a failing test" → No. Write the failing test first. If the fix is obvious, the test will be quick to write.
- "I'll fix this and clean up the surrounding code while I'm here" → No. Fix only. Separate PR for any improvements.
- "I've tried three things and nothing worked, let me try something else" → Stop. If three hypotheses fail, the problem is likely architectural. Escalate to the user before trying more.
- "The tests are already passing, so the bug must be fixed" → No. Invoke `verification-before-completion`. Run the specific failing test fresh, then the full suite.

---

## Phase 1: Root Cause Investigation

**Goal:** Understand exactly why the bug occurs before touching any code.

1. Ask the user to describe the bug:
   - What is the expected behaviour?
   - What is the actual behaviour?
   - How can it be reproduced (exact steps, input, environment)?
   - Is there an error message or stack trace?
2. Read the relevant source files to understand the current implementation. Follow the call chain from the entry point to the failure.
3. Form a hypothesis about the root cause. Be specific: "Line X does Y when it should do Z because of condition W."
4. State your diagnosis explicitly before writing any code. Ask the user to confirm your understanding is correct if the bug is complex.

**Hard gate:** Do not write any code until you can state the root cause clearly and specifically.

---

## Phase 2: Pattern Analysis

**Goal:** Determine whether this bug is isolated or a symptom of a deeper issue.

1. Check whether the same pattern exists elsewhere in the codebase. Use `Grep` to search for similar logic.
2. Consider: Is this a one-off mistake, or is the same mistake made in multiple places?
3. If the bug is systemic, note all affected locations but fix only the one reported. Flag the others to the user.

---

## Phase 3: Hypothesis & Testing

**Goal:** Prove the bug is where you think it is, with a test that fails.

Invoke the `test-driven-development` skill.

1. Write a test that **reproduces the bug** — it must fail on the current code.
2. Run the test and confirm it fails **for the right reason** (the right assertion, the right error message).
3. If the test passes when it should fail, your hypothesis is wrong — return to Phase 1.
4. Do not fix the bug yet.

**Why:** The failing test proves you've understood the bug. It also prevents regression when the fix is applied.

---

## Phase 4: Implementation

**Goal:** Apply the minimal fix that resolves the root cause.

1. Implement the fix that makes the failing test pass.
2. Do not refactor surrounding code unless the refactor is necessary to make the fix possible.
3. Do not add features, improve error messages, or make "while I'm in here" changes.
4. Run the failing test — confirm it now passes.
5. Invoke the `verification-before-completion` skill:
   - Run the full test suite
   - Run the linter
   - Confirm no regressions
6. Commit with a conventional commit message using the `git-commit-helper` skill:
   - Format: `fix(<scope>): <short description>`
   - Body: describe the root cause and how the fix addresses it
   - Footer: `Fixes #<issue>` if applicable
