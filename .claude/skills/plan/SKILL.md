---
name: plan
description: Phase 2 of the Stage 3 feature workflow — reads a child task issue (plus parent epic, PRD, ARCHITECTURE), produces a lightweight implementation plan, picks the implementation-agent roster dynamically based on task shape, dispatches advisors only behind the Tier 2 gate, and writes the plan as a TL;DR comment on the issue. Replaces the old /spec phase. No docs/specs/ artefact.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Plan Skill — Phase 2 of 6 (Stage 3)

You are running **Phase 2: Plan** of the Stage 3 feature workflow. This skill replaces the old `/spec` — it produces a lightweight, per-task implementation plan that lives on the issue, not a heavy document.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/plan <N>`.

## Core Principle

A good plan is **short, Red-Green-Refactor-sized, and concretely actionable**. It lists ≤5 sub-tasks, one failing test name per sub-task, touched files, the implementation-agent roster, and open risks. It is NOT a spec document — no data models, no API contract tables, no multi-page designs. If something needs that much design work, the task is too big and should be split.

## Token Budget Caps

- Advisor brief: ≤150 words, excluding the draft plan itself and short quoted file paths.
- Advisor report: ≤200 words total.
- Per-risk or per-finding rationale: ≤50 words.
- If the cap is tight, advisors must list blockers first and collapse nice-to-have advice.

## Anti-Rationalization Guards

- "The plan is going to be long, I'll just split it into more sections" → No. If it's long, it's too big a task. Go back to `/define` and split.
- "I'll pick all 5 implementation agents to be safe" → No. Pick a narrow roster and dispatch it only if the advisor gate opens. Over-dispatch dilutes signal.
- "The coder will figure out the test shape" → No. Plan the failing test for each sub-task. That's the Red in Red-Green-Refactor.
- "I can write the plan without reading the parent epic" → No. Acceptance criteria live on the epic — you can't plan for them blind.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided. Call it `<N>`.

> **Platform note:** commands below use `gh` (GitHub CLI). Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments,state
```

**Identify the parent epic.** Scan the issue body for `**Part of:** #<epic-id>`. Every Stage 3 task issue must be part of an epic.

- If missing → stop and tell the user: _"Task issue `<N>` has no `**Part of:**` pointer to an epic. This workflow expects tasks to be scoped to an epic. Either add the pointer manually or re-run `/define <epic#>` to create a fresh child."_

Load the parent epic:

```bash
gh issue view <epic-id> --json number,title,body
```

**Verify gate:** Phase 1 (Define) must be marked `[x]` in this child's `## Task Workflow Progress` checklist. If not, stop and tell the user to run `/define <epic#>` or complete Phase 1 first.

**Count plan round and prior review-plan state.**

- Count existing comments whose header matches `## Phase 2 TL;DR: Plan`. The plan being drafted is `plan_round = prior_plan_comments + 1`.
- Locate the latest `## Phase 2b TL;DR: Review Plan`, if any. Extract the `Critical:` count from `### Findings summary`; if absent, treat as 0. Also extract unresolved Critical plan findings when present.
- `review_plan_loop = YES` only when `plan_round >= 2` and the latest Review Plan TL;DR has `Critical >= 1`.

---

## Step 2 — Read Supporting Context

Read:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/GLOSSARY.md`
- The Phase 1 TL;DR comment on the task issue (for size classification and scope)
- The parent epic's body (for acceptance criteria context)

---

## Step 3 — Classify Task Shape

Determine which of these characteristics the task has. You'll use this to pick the implementation-agent roster and size the plan.

```
Task Shape:
- Touches UI / user-facing components: YES / NO
- Touches server endpoints / service calls: YES / NO
- Touches database schema or query patterns: YES / NO
- Introduces a new library, protocol, or external integration: YES / NO
- Spans multiple layers (UI + API + data): YES / NO
- External-knowledge gap: YES / NO
```

Set `External-knowledge gap: YES` only when the plan cannot be completed from repo files, issue context, and living docs. Name the exact unknown and likely source. Do not flag generic uncertainty.

### Pick the implementation-agent roster

Rules:

- Always include `team-lead` for multi-layer tasks.
- Include `frontend-specialist` if UI = YES.
- Include `backend-specialist` if endpoints = YES.
- Include `data-engineer` if schema/query = YES.
- Include `researcher` if new lib/protocol/integration = YES or External-knowledge gap = YES.
- Cap at 3 implementation agents. If more are indicated, keep `team-lead` + the two most relevant specialists and note the omitted ones in the plan's "Open risks" section.

The roster list goes into the plan as the record of which advisor lenses are relevant. `/implement` reads this record but does not dispatch advisors again.

---

## Step 4 — Draft the Plan

Draft the plan in memory. Keep every section tight. Use the template below:

```markdown
## Plan: <task title>

### Sub-tasks (Red-Green-Refactor cadence)

1. **<imperative verb + object>**
   - Failing test: `<test name>`
   - Touched files: <path>, <path>.
2. **<…>**
   - Failing test: `<test name>`
   - Touched files: <…>.
     [≤5 sub-tasks total]

### Implementation agent roster

- `team-lead` — <why: 1 line>
- `<specialist>` — <why: 1 line>
- `<specialist>` — <why: 1 line>

### Risks & open questions

- <≤30 words>
- <≤30 words>

### Acceptance (from the epic)

- [ ] <bullet from parent epic that this task closes or advances>
- [ ] <bullet>
```

Sub-task lines are name + failing-test-name + touched-files only. No sub-task prose. If the size classification from Phase 1 was `small`, keep it minimal (skip risks if genuinely empty — write `_none_`). If `medium` or `large`, the risks section is usually non-empty. Each risk/open-question bullet must be ≤30 words.

---

## Step 5 — Advisor Dispatch Gate (default OFF)

Advisor dispatch is default OFF. Do not dispatch advisors just because the task is medium/large.

Dispatch advisors only when at least one gate is true:

- `review_plan_loop = YES` (`plan_round >= 2` and latest `/review-plan` had `Critical >= 1`)
- `External-knowledge gap = YES` from Step 3

If both gates are false, skip dispatch and record:

> `Advisor dispatch: skipped (default-off; no Critical review-plan loop or external-knowledge gap).`

If a gate is true, dispatch the smallest useful subset of the picked roster **in parallel**:

- Review-plan loop: dispatch only advisors relevant to the unresolved Critical plan findings.
- External-knowledge gap: dispatch `researcher` plus at most one domain specialist if needed.
- Cap at 2 dispatched advisors unless the user explicitly approves a wider pass.

Advisor dispatch instructions:

- Keep the written brief ≤150 words, plus the draft plan.
- Require each advisor report to be ≤200 words total.
- Require any rationale to be ≤50 words.

Fold their advice into the plan before Step 6. Typically:

- Researcher findings → update Risks & open questions
- Tech Lead sequencing → reorder sub-tasks, tighten scope
- Specialist reuse opportunities → update Touched files (swap new code for existing utilities)

If any advisor raises a blocker the plan can't resolve, **stop** and tell the user what's blocked before proceeding to Step 6.

---

## Step 6 — Confirm with the User

Post the draft plan in chat (not yet on the issue) and ask:

> "Here's the plan. Review and tell me:
>
> - Does the sub-task breakdown match your intent?
> - Are the failing tests concretely what you want asserted?
> - Anything missing in Risks?
> - Approve to post to the issue, or tell me what to change."

**Hard gate:** Do not post to the issue tracker until the user approves.

---

## Step 7 — Post Plan Comment and Update Issue

Post the approved plan as a TL;DR comment on the task issue:

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 2 TL;DR: Plan
**Date:** YYYY-MM-DD
**Size:** small | medium | large  (from Phase 1 TL;DR)
**Status:** Awaiting plan review

## Plan: <task title>

### Sub-tasks (Red-Green-Refactor cadence)
<… from Step 4 …>

### Implementation agent roster
<… from Step 3/4 …>

### Advisor dispatch
- Gate: skipped | review-plan loop | external-knowledge gap
- Dispatched: [list or "none"]

### Risks & open questions
<… from Step 4/5 …>

### Acceptance (from epic #<epic-id>)
<… from Step 4 …>

### Next step
Run `/clear`, then `/review-plan <N>` in a fresh session. If Critical findings surface, loop back to `/plan <N>`.
EOF
)"
```

Update the task issue body:

```bash
gh issue edit <N> --body "<...same body, with '- [x] Phase 2: Plan — YYYY-MM-DD' on the Task Workflow Progress checklist...>"
```

---

## Step 8 — Living Doc Updates (never edit inline here)

`/plan` runs **before the feature branch exists**, so it must not edit `docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, or `docs/PRD.md` — any commit would go straight to `main`.

If drafting the plan surfaces something that belongs in a living doc (new third-party integration, new domain term, etc.), record it in the Plan TL;DR under a `### Planned doc updates` subsection. `/implement` applies and commits those updates on the feature branch in Phase 3.

---

## Handoff

> **Phase 2: Plan — Drafted ✅**
> Plan posted to issue `<N>`.
>
> Next: Run `/clear`, then:
>
> ```
> /review-plan <N>
> ```
