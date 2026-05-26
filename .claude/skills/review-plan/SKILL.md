---
name: review-plan
description: Phase 2b of the Stage 3 feature workflow — dispatches the plan-reviewer agent on the latest Plan TL;DR for a task issue, synthesises findings, and either hands off to /implement or loops back to /plan if Critical findings surface. Lightweight single-agent review — no complexity gate.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Review Plan Skill — Phase 2b of 6 (Stage 3)

You are running **Phase 2b: Review Plan** of the Stage 3 feature workflow. This step catches bad plans before code is written. It's the symmetrical front-end to `/review` (which catches bad implementations before merge).

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/review-plan <N>`.

## Core Principle

One reviewer (`plan-reviewer`) is enough — plan reviews are cheap relative to code reviews, and the gate is binary (ship-to-implement, or loop back). No complexity gate. Keep it fast.

## Token Budget Caps

- Reviewer brief: ≤150 words, excluding the Plan TL;DR and short quoted architecture/PRD excerpts.
- Reviewer report: ≤200 words total.
- Per-finding rationale: ≤50 words.
- If the cap is tight, list all Critical findings first and collapse Major/Minor findings to counts plus the highest-signal examples.

## Anti-Rationalization Guards

- "The plan looks fine, I'll skip the agent" → No. Always dispatch. Even obvious plans benefit from a blind pass.
- "A Critical finding is minor in practice, I'll downgrade it" → No. The reviewer's severity stands. If you disagree, the right path is a discussion with the user, not silent downgrade.
- "I'll fix the plan inline while I review it" → No. `/review-plan` surfaces; `/plan` fixes.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments,state
```

**Locate the latest Plan TL;DR.** Scan comments for the most recent one whose header matches `## Phase 2 TL;DR: Plan`. If none exists, stop and tell the user to run `/plan <N>` first.

**Verify gate:** Phase 2 (Plan) must be marked `[x]` in this child's `## Task Workflow Progress`. If not, stop.

---

## Step 2 — Read Supporting Context

Read:

- The Plan TL;DR comment (full text)
- The parent epic's body (`gh issue view <epic-id> --json body`) — for acceptance context
- `docs/PRD.md` and `docs/ARCHITECTURE.md`

---

## Step 3 — Dispatch Plan Reviewer

Dispatch the `plan-reviewer` agent. Provide it:

- The full Plan TL;DR content
- The parent epic's body
- Relevant sections of `docs/ARCHITECTURE.md` (Tech Stack, Components)
- Acceptance criteria from the epic

Instruct it: _"Review this plan using the rubric in your role file. Categorise each finding as Critical, Major, or Minor. Output the standard finding format."_

Brief and output constraints:

- Written brief ≤150 words, plus the Plan TL;DR and short context excerpts.
- Reviewer report ≤200 words total.
- Each finding rationale ≤50 words.

---

## Step 4 — Decide Outcome and Post TL;DR

Pick exactly one of 4a or 4b based on the reviewer's findings.

### 4a — Critical = 0 (plan approved)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 2b TL;DR: Review Plan
**Date:** YYYY-MM-DD
**Status:** Approved ✅

### Findings summary
- Critical: 0
- Major: [N] (advisory — proceed unless user objects)
- Minor: [N] (noted)

### Major findings (advisory)
- [per-finding if any, with Suggested fix; rationale ≤50 words]

### Next step
Run `/clear`, then `/implement <N>` in a fresh session.
EOF
)"
```

Update the task issue body: mark `- [x] Phase 2b: Review Plan — <YYYY-MM-DD>` in the `## Task Workflow Progress` checklist.

### 4b — Critical ≥ 1 (loop back to /plan)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 2b TL;DR: Review Plan
**Date:** YYYY-MM-DD
**Status:** Findings remain ⚠️ — loop back to /plan

### Findings summary
- Critical: [N]
- Major: [N]
- Minor: [N]

### Unresolved Critical findings
- **[Critical] <plan section>** — <description>.
  Rationale: <≤50 words>.
  Suggested fix: <…>.
- [repeat for each Critical]

### Next step
Run `/clear`, then `/plan <N>` again with these findings in mind. The Plan TL;DR should be revised before re-running `/review-plan`.
EOF
)"
```

Do NOT mark Phase 2b as `[x]` — it has run but not succeeded. Leave the checkbox unchecked so the human sees the loop state.

---

## Step 5 — Iteration Note

If `/plan` is being re-run, it overwrites or supersedes the previous Plan TL;DR. `/review-plan` runs again fresh on the updated Plan TL;DR. There is no hard iteration cap on plan reviews — catching a bad plan here is much cheaper than catching it in `/review` post-implementation. That said, three loops on a single plan is a signal to escalate to a human (call it out in the TL;DR if it happens).

---

## Handoff

Pick the message matching your outcome.

**4a (Approved):**

> **Phase 2b: Review Plan — Approved ✅**
> No Critical findings. Ready for implementation.
>
> Next: Run `/clear`, then:
>
> ```
> /implement <N>
> ```

**4b (Loop back):**

> **Phase 2b: Review Plan — Findings remain ⚠️** > `<K>` Critical plan finding(s). Do NOT proceed to `/implement` yet.
>
> Next: Run `/clear`, then:
>
> ```
> /plan <N>
> ```
>
> Revise the plan per the findings, then re-run `/review-plan <N>`.
