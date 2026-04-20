---
name: test-driven-development
description: Use when implementing any task from a spec, writing new functionality, or fixing a bug. Enforces the Red → Green → Refactor cycle. Iron law: no production code without a failing test first.
allowed-tools: Bash, Read, Write, Edit
---

# Test-Driven Development Skill

The iron law: **no production code without a failing test first.**

## When I Activate

- ✅ Starting any task from a spec's Implementation Plan
- ✅ Fixing a bug (via the `fix-bug` skill)
- ✅ Writing any new function, class, module, or component
- ✅ Whenever the user says "implement", "add", "create", or "build" something

## Anti-Rationalization Guards

If you find yourself thinking any of the following, **stop and re-read this skill**:

- "The logic is simple, I don't need a test first" → No. Simple logic has simple tests. Write the test.
- "I'll write the test after I know it works" → No. That's test-after, not TDD. The test must fail before the code exists.
- "There's no obvious way to test this" → Stop. If code is untestable, its design is wrong. Fix the design first.
- "Writing a test first would take longer" → No. It prevents regressions, documents intent, and forces clarity on what "done" means.
- "The test would just duplicate what the code does" → No. The test specifies behaviour from the caller's perspective. The code implements it. These are different concerns.
- "I'll refactor while I implement" → No. Red → Green → Refactor are separate phases. Do not mix them.

---

## The Red → Green → Refactor Cycle

Repeat this cycle for every unit of work.

### Red Phase — Write a Failing Test

1. Read the task's acceptance condition from the spec.
2. Write a test that verifies that condition — from the caller's perspective, not the implementation's.
3. Run the test. **Confirm it fails.**
4. Read the failure message. Confirm it fails for the right reason:
   - ✅ "Cannot find function X" — expected, function doesn't exist yet
   - ✅ "Expected Y, received Z" — expected, behaviour not yet correct
   - ❌ "Syntax error" — your test has a bug, fix the test first
   - ❌ "Test passed" — your test is wrong; it should not pass without the implementation

**Hard gate:** Do not write production code until the test is failing for the right reason.

### Green Phase — Make It Pass

1. Write the **minimum** production code to make the failing test pass.
2. No extra features. No defensive edge cases not covered by the current test. No "while I'm here" additions.
3. Run the test. Confirm it now passes.
4. Run the full test suite. Confirm no regressions.

**Hard gate:** If existing tests break, fix the regression before proceeding. Do not add to the passing test count by removing or weakening existing tests.

### Refactor Phase — Improve Without Changing Behaviour

1. Now (and only now) improve the code: extract functions, rename variables, remove duplication.
2. After every change, re-run the tests. They must stay green.
3. Do not add new functionality during refactor. If you think of an improvement that changes behaviour, create a new task.

---

## Test Quality Standards

A good test:
- Tests one thing (single assertion or tightly related group)
- Names the scenario clearly: `should return 404 when user is not found`
- Is independent of other tests (no shared mutable state)
- Is fast (no unnecessary I/O, sleep, or polling)
- Fails when the production code is deleted

See `testing-anti-patterns.md` in this directory for patterns to avoid.

---

## Commit After Green

After each Green phase (before or after Refactor), commit with the `git-commit-helper` skill. Small, frequent commits with descriptive messages make reviews easier and regressions easier to bisect.
