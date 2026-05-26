---
name: define
description: Phase 1 of the Stage 3 feature workflow — epic-scoped task entry. Takes an epic issue number, picks the next task to start, classifies size (small/medium/large), and creates a child task issue linked to the epic. Deep Socratic work moves to /plan (task-level) or /define-prd (product-level); /define is now a lean, fast entry point.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Define Skill — Phase 1 of 6 (Stage 3)

You are running **Phase 1: Define** of the Stage 3 feature workflow. Unlike the old workflow, Define is now epic-scoped and lightweight — its only job is to pick the next task from an epic, size it, and create the child issue. The heavy thinking moved elsewhere: product scope lives in `/define-prd`, and task-level decisions happen in `/plan`.

## Fresh Context Check

This phase is designed to run in a fresh context. If prior conversation history is unrelated, ask the user to run `/clear` and then re-run `/define <epic#>`.

## Core Principle

Fast, focused, one exchange if possible. Read the epic, propose the next task with a size guess, confirm with the user, create the child issue. No Socratic grilling here — that's `/plan`.

## Anti-Rationalization Guards

- "I should probe the task deeply before creating the issue" → No. `/plan` does the deep work. Keep `/define` to: pick task, size it, create issue.
- "The epic is vague, I'll re-interview the user on scope" → No. If the epic is too vague, tell the user to re-run `/plan-epics` to tighten it. Don't re-derive scope here.
- "Let me create the issue even though the user hasn't confirmed the task" → No. User confirms the task title and size before the issue gets created.
- "I'll mark this task as started in the epic body at the same time" → Yes, actually — but only after the child issue is created and has an ID.

---

## Step 0 — Prerequisites

Verify the epic exists and is open:

```bash
gh issue view <epic#> --json number,title,body,state,labels
```

- If `state` is CLOSED, stop and tell the user the epic is already done. Ask if they meant a different epic.
- If the issue has no `epic` label, warn the user — this may not be an epic — and ask them to confirm before proceeding.
- If `docs/PRD.md` is still a stub (contains `_Run /define-prd to populate_`), stop and tell the user to run `/define-prd` then `/plan-epics` first.

---

## Step 1 — Read the Epic and Its Existing Children

```bash
gh issue view <epic#> --json number,title,body,comments
gh issue list --search "\"Part of: #<epic#>\"" --state all --json number,title,state,body
```

Extract from the epic:

- Goal / acceptance criteria
- Scope bullets
- Existing child tasks (already created, open or closed)
- Dependencies on other epics

Note which acceptance criteria are already satisfied by closed children, and which remain.

---

## Step 2 — Propose the Next Task

Look at:

- Remaining (not-yet-satisfied) acceptance criteria on the epic
- The epic's Scope section
- Open child tasks (if any — these may need to close before a new one starts)

Propose one task in this format:

> "Based on epic `#<epic#>`, the next task I'd pick is:
> **<task title — imperative + object>**
>
> This addresses acceptance bullet: _<bullet>_.
>
> Proposed size: **small | medium | large** (based on `<reasons — which sizing criteria apply>`).
>
> Ready to create the child issue? Or pick a different task from the epic?"

### Sizing criteria (same as legacy workflow)

Count how many apply:

1. Touches auth, payments, or data security
2. Modifies database schema
3. Introduces ≥1 new external dependency
4. Changes a public API contract
5. Spans ≥3 files of net-new code
6. Has async/concurrent operations
7. UX decisions are non-trivial

- **Small** — 0 criteria. Copy tweak, flag wire-up, trivial endpoint.
- **Medium** — 1–3 criteria.
- **Large** — 4+ criteria. (Rare at the task level — if you land here, consider splitting the task and going back to propose the smaller piece.)

The user confirms or picks an alternative. One exchange.

---

## Step 3 — Confirm Task Details

Collect (briefly — this is not an interview):

- **Task title** (imperative; the one you proposed or the user's alternative)
- **Size** (confirm or override)
- **Depends on** (other task issue IDs, if any; most tasks have none)
- **Layer** (optional shorthand: `data` / `backend` / `frontend` / `cross-cutting`)

If the user wants to add a 1-line scope note to the child body, accept it — otherwise the child defers scope/details to `/plan`.

---

## Step 4 — Create Child Task Issue

Derive a `<task-slug>` from the task title (lowercase, hyphenated).
Derive a `<feature-slug>` from the epic title (strip `Epic: ` prefix, slugify).

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue create \
  --title "feat(<feature-slug>): <task-title>" \
  --body "$(cat <<'EOF'
## Task: <task title>

**Part of:** #<epic#>
**Depends on:** <#N, #M | "none">
**Layer:** data | backend | frontend | cross-cutting
**Branch:** feat/<feature-slug>/<task-slug>

## Scope note
<1-line note from user, or "deferred to /plan">

## Task Workflow Progress
- [x] Phase 1: Define — YYYY-MM-DD
- [ ] Phase 2: Plan
- [ ] Phase 2b: Review Plan
- [ ] Phase 3: Implement
- [ ] Phase 4: Test
- [ ] Phase 5: Review
- [ ] Phase 6: Commit & PR

## Links
- Epic: #<epic#>
- Plan: (to be added in Phase 2)
- Branch: (to be added in Phase 3)
- PR: (to be added in Phase 6)
EOF
)"
```

Capture the returned child issue number. Call it `<N>`.

---

## Step 5 — Post Phase 1 TL;DR on the Child

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 1 TL;DR: Define
**Date:** YYYY-MM-DD
**Size:** small | medium | large
**Status:** Complete ✅

### What was done
- Picked next task from epic #<epic#>
- Created this child task issue

### Key decisions
- Task: <task title>
- Size: <size, with rationale in 1 line>
- Layer: <layer>
- Depends on: <list or "none">

### Next step
Run `/clear`, then `/plan <N>` in a fresh session.
EOF
)"
```

---

## Step 6 — Link Child on Parent Epic

Edit the parent epic's body to reference the new child under `## Child tasks`:

```bash
gh issue edit <epic#> --body "<...existing body with child appended to ## Child tasks section as: '- [ ] #<N> — <task title>'...>"
```

Keep the list sorted by creation order.

---

## Step 7 — Living Doc Updates (never edit inline here)

`/define` runs **before the feature branch exists**, so it must not edit `docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, or `docs/PRD.md` — any commit would go straight to `main`.

If the user introduces a genuinely new domain term or architectural note while describing the task, record it in the Phase 1 TL;DR under a `### Planned doc updates` subsection. `/implement` picks up these notes and applies + commits them on the feature branch in Phase 3.

---

## Handoff

> **Phase 1: Define — Complete ✅**
> Child task issue `#<N>` created, linked to epic `#<epic#>`.
>
> Next: Run `/clear` to start a fresh session, then run:
>
> ```
> /plan <N>
> ```
