---
name: review
description: Phase 5 of the Stage 3 feature workflow — reads implementation state from the task issue, runs a complexity gate to decide the review agent roster (1–3 of tech-lead, security-reviewer, product-reviewer), synthesises findings, posts a TL;DR comment, and updates the issue.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Review Skill — Phase 5 of 6 (Stage 3)

You are running **Phase 5: Review** of the Stage 3 feature workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/review <N>`.

## Anti-Rationalization Guards

- "The tests pass so the implementation must be fine" → No. Testing and review are independent gates.
- "This is a small task — the complexity gate is overkill" → No. Run the six-criteria assessment. Let the criteria decide.
- "There are Critical findings but they're minor" → No. Critical means must fix before Phase 6. Do NOT fix inline here — post the TL;DR and hand off to `/revise <N>`.
- "A Critical fix is trivial, let me apply it while I'm here" → No. `/review` surfaces; `/revise` fixes. The split produces a clean audit trail and enforces the 2-iteration budget.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments
```

- Extract the parent epic ID from `**Part of:** #<epic#>`
- Extract branch name from `**Branch:**` in the body
- Read the latest Plan TL;DR (for acceptance bullets and touched files)
- Read the Phase 4 TL;DR (test results)
- Load the parent epic body for epic-level acceptance criteria

**Verify gate:** Phase 4 must be `[x]` in `## Task Workflow Progress`. If not, stop and tell the user to complete `/test <N>` first.

---

## Step 2 — Read Supporting Context

Read:

- Relevant sections of `docs/ARCHITECTURE.md`
- The git diff for the branch:
  - Task PR strategy `trunk`: `git diff main...feat/<feature-slug>/<task-slug>`
  - Task PR strategy `feature-branch`: `git diff feat/<feature-slug>...feat/<feature-slug>/<task-slug>`
    (Read `.claude/CLAUDE.md` §Per-project config for strategy.)

Do **not** read `docs/PRD.md` or `docs/GLOSSARY.md` by default in this phase. Reviewers work from the diff, Plan TL;DR, parent epic, Phase 4 TL;DR, and ARCHITECTURE. Only pull a specific PRD/GLOSSARY excerpt if the Plan TL;DR explicitly points to it and a finding cannot be judged without that excerpt.

## Token Budget Caps

- Reviewer brief: ≤150 words, excluding required pasted artifacts such as the diff, Plan TL;DR, or quoted architecture excerpt.
- Reviewer report: ≤200 words total.
- Per-finding rationale: ≤50 words.
- If the cap is tight, include all Critical findings first and collapse Major/Minor findings to counts plus the highest-signal examples.

---

## Step 3 — Complexity Assessment

Evaluate the implementation against these six criteria. **Produce the assessment explicitly before routing — do not make the decision silently.**

```
Complexity Assessment:
- Touches auth, payments, or data security:     YES / NO     (security-sensitive)
- Modifies database schema:                     YES / NO     (security-sensitive)
- Introduces 3+ new external dependencies:      YES / NO
- Changes public API contracts:                 YES / NO
- Spans 5+ files:                               YES / NO
- Has async/concurrent operations:              YES / NO
Result: [N] criteria met → review roster below
```

### Reviewer routing

- Always dispatch `tech-lead`.
- Dispatch `security-reviewer` **only** when at least one security-sensitive criterion is YES (auth/payments/data security, or database schema).
- Treat the product lens as triggered when 2+ criteria are met, public API contracts changed, or 4+ criteria are met.
- Dispatch `product-reviewer` when the product lens is triggered and either:
  - no security-sensitive criterion is YES, OR
  - the all-three rule below is met.
- Dispatch all three reviewers only when all are true:
  - 4+ criteria are met, AND
  - a security-sensitive criterion is YES, AND
  - the product lens is triggered.

For 4+ criteria, do **not** add `security-reviewer` solely because the total count is high. If security and product lenses both seem useful but the all-three rule is not met, keep the unselected lens in advisory mode: do a one-line self-check during synthesis, but do not dispatch another agent.

Print the chosen roster with the routing rationale before dispatching.

---

## Step 4 — Dispatch Reviewer(s)

Dispatch the chosen agents **in parallel** (single message, multiple tool calls — even if just one agent, for consistency).

Each agent receives:

- The git diff (scoped per Step 2)
- The latest Plan TL;DR content
- The parent epic body (for acceptance context)
- The Phase 4 TL;DR (test results)
- Relevant sections of `docs/ARCHITECTURE.md`
- Instruction: _"Review using your role rubric. Categorise findings as Critical / Major / Minor in the standard format. Report ≤200 words total; each rationale ≤50 words. Do not read PRD/GLOSSARY unless the orchestrator included a specific excerpt."_

### Severity definitions (same for all reviewers)

- **Critical** — blocks the PR. Behaviour bug, security issue, plan non-compliance, regression, broken test, architectural violation.
- **Major** — should fix unless strong reason to defer; deferrals need rationale.
- **Minor** — advisory. Style, polish.

Do **not** fix any Critical findings inline. Your job here: complete itemised findings + TL;DR.

---

## Step 5 — Synthesise (if multiple agents)

If more than one reviewer ran, synthesise findings into a single tiered list. When reviewers conflict, resolve explicitly and explain the resolution.

Remove duplicates (if `tech-lead` and `security-reviewer` both flag the same line, attribute to the more specific reviewer and mention both saw it).

Preserve source reviewer for every Critical finding in the TL;DR. Use `[tech-lead]`, `[security-reviewer]`, or `[product-reviewer]` immediately after the severity tag so `/revise` can re-review with the original Critical finder only.

---

## Step 6 — Post TL;DR and Update Issue

Pick 6a or 6b based on Critical count.

### 6a — Critical = 0 (clean review)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5 TL;DR: Review
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### Complexity assessment
- [N] criteria met → <roster>
- Reviewers dispatched: [list]

### Findings summary
- Critical: 0
- Major:    [N found, N fixed/deferred]
- Minor:    [N noted]

### Major findings (advisory)
- **[Major][<reviewer>] <path>:<line>** — <description>. Rationale: <≤50 words>. Suggested fix: <…>.

### Doc updates
- ARCHITECTURE.md: <what changed> (or "none")
- GLOSSARY.md: <what changed> (or "none")

### Next step
Run `/clear`, then `/commit <N>` in a fresh session.
EOF
)"
```

### 6b — Critical ≥ 1 (findings remain)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 5 TL;DR: Review
**Date:** YYYY-MM-DD
**Status:** Findings remain ⚠️

### Complexity assessment
- [N] criteria met → <roster>
- Reviewers dispatched: [list]

### Findings summary
- Critical: [N found, 0 fixed]
- Major:    [N found]
- Minor:    [N noted]

### Unresolved findings
- **[Critical][<reviewer>] <path>:<line>** — <description>. Rationale: <≤50 words>. Suggested fix: <…>.
- [repeat for each Critical]
- **[Major][<reviewer>] <path>:<line>** — <description>. Defer rationale (if any): <≤50 words>.
- **[Minor][<reviewer>] ...** (optional — omit if many)

### Next step
Run `/clear`, then `/revise <N>` to enter the fix loop (Phase 5b). Do not run `/commit` — it will refuse while Criticals remain.
EOF
)"
```

> **Important:** the Unresolved findings section must list every Critical with enough detail (source reviewer, path, description, rationale, suggested fix) that `/revise` in a fresh session can act without re-dispatching the full reviewer roster.

Update the child body: set `- [x] Phase 5: Review — <YYYY-MM-DD>` in `## Task Workflow Progress` (regardless of findings status — the phase has RUN; the loop tracks whether more work is needed).

---

## Step 7 — Living Doc Updates (apply and commit on the feature branch)

Reviewers sometimes surface updates for `docs/ARCHITECTURE.md` §Compliance & Security Notes (e.g. a new rate-limit pattern, an auth convention worth documenting).

If you made edits, commit them on the current feature branch as a dedicated commit before posting the Phase 5 TL;DR. Use the `git-commit-helper` skill for the message — format: `docs: update ARCHITECTURE for review #<N>`. Record the same list in the `### Doc updates` section of the TL;DR above.

---

## Handoff

**6a (Clean):**

> **Phase 5: Review — Complete ✅**
> No Critical findings.
>
> Next: Run `/clear`, then:
>
> ```
> /commit <N>
> ```

**6b (Findings):**

> **Phase 5: Review — Findings remain ⚠️** > `<K>` Critical finding(s). Do NOT run `/commit` — it will refuse.
>
> Next: Run `/clear`, then:
>
> ```
> /revise <N>
> ```
