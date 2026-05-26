---
name: plan-epics
description: Stage 2 skill — reads docs/PRD.md and facilitates a sprint-planning session that breaks the product into 3–8 prioritised epics, then creates or updates parent issues in the issue tracker (one per epic, labelled `epic`). Run after /define-prd, or whenever you need to re-prioritise the roadmap.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Plan Epics Skill — Stage 2 of 3

You are running **Stage 2: Epic Planning**. Your job: turn `docs/PRD.md` into a short list of prioritised epics, and track each epic as a parent issue in the issue tracker.

## Core Principle

Epics are **chunks of user-facing value** sized so a small team can ship one in a few days to a couple of weeks. They are NOT tasks (too small) and NOT the whole product (too big). A good epic has a clear acceptance condition and sits on the critical path to a PRD goal.

The issue tracker is the single source of truth for epic state. There are no `epic-*.md` files — everything lives as labelled issues.

## Anti-Rationalization Guards

- "The PRD is vague — I'll just pick epics from instinct" → No. If the PRD has too many gaps to plan against, stop and tell the user to refine it with `/define-prd`.
- "Let's create 15 epics to cover everything" → No. Target 3–8. More than that means you're slicing too fine.
- "Dependencies are obvious, skip the ordering pass" → No. Explicit ordering is the point. Surface at least one dependency or declare the epics independent.
- "I'll create all the issues first, then ask the user to review" → No. Propose the list, get approval, THEN create issues.

---

## Step 0 — Prerequisites Check

Before anything else:

```bash
ls docs/PRD.md
```

If `docs/PRD.md` is missing or is still the untouched stub (contains `_Run /define-prd to populate_`), stop and tell the user:

> "No PRD to plan from. Run `/define-prd` first to capture the product scope, then come back to `/plan-epics`."

Also verify the issue tracker CLI is configured. Read `.claude/CLAUDE.md` §Per-project config — if the platform is still `[TODO]`, ask the user which platform to use (`gh` for GitHub, `glab` for GitLab, etc.) and remember the choice for this run.

---

## Step 1 — Read Inputs

Read (do not write):

- `docs/PRD.md` — the source material
- `docs/ARCHITECTURE.md` — technical context that may constrain sequencing
- `docs/GLOSSARY.md` — vocabulary to use in epic titles/descriptions
- Current epic issues in the tracker:
  ```bash
  gh issue list --label epic --state all --limit 50
  ```
  (or `glab issue list --label epic ...` — use the platform CLI configured in `.claude/CLAUDE.md`)

---

## Step 2 — Propose Epic Breakdown

Produce a draft list of 3–8 epics. For each:

- **Title**: imperative, user-facing (e.g. `Epic: User can log in with SSO`)
- **Goal**: one sentence — what value ships when this epic is done
- **Acceptance criteria**: 2–4 bullets, testable
- **Scope**: what's in
- **Non-goals**: what's deliberately deferred to a later epic
- **Depends on**: list of other epics (or `none`)
- **Rough size**: S / M / L (gut feel, not binding)

Cover the full PRD Scope section. Every PRD scope bullet should map to at least one epic, and every epic should trace back to at least one PRD goal or scope item. Flag anything in the PRD that doesn't fit — it may be a non-goal creep.

Then propose an **execution order**:

- Wave 1: [epics to start now, no blockers]
- Wave 2: [epics that unblock after Wave 1]
- Wave 3+: [later]

---

## Step 3 — Review with the User

Present the epic list + execution order in one message. Ask:

> "Here's the proposed breakdown. Review and tell me:
>
> - Any epics to add, merge, or drop?
> - Is the dependency ordering right?
> - Which wave should we commit to creating issues for now? (typically Wave 1 + optionally Wave 2 as 'planned but not started')"

Iterate until the user approves.

**Hard gate:** Do not create any issues until the user explicitly confirms the list.

---

## Step 4 — Reconcile with Existing Epic Issues

If epic issues already exist from a prior run, reconcile rather than duplicate:

- **Unchanged** → leave alone
- **Scope widened/narrowed** → propose editing the existing issue (show before/after)
- **Cancelled** → propose closing the existing issue with a comment explaining why
- **New** → propose creating a fresh issue

Ask the user to confirm reconcile actions before applying them.

---

## Step 5 — Create / Update Epic Issues

> **Platform note:** commands below use `gh` (GitHub CLI). Substitute `glab` etc. per `.claude/CLAUDE.md` §Per-project config.

For each new epic, create a parent issue:

```bash
gh issue create \
  --label epic \
  --title "Epic: <name>" \
  --body "$(cat <<'EOF'
## Epic: <name>

<goal sentence>

## Acceptance criteria
- [ ] <testable bullet>
- [ ] <testable bullet>

## Scope
- <in-scope bullet>
- <in-scope bullet>

## Non-goals
- <deliberately deferred bullet>

## Depends on
- <#epic-issue> — or "none"

## Child tasks
_Child feature issues will be linked here as they are created by `/define <this-epic#>`._

## Links
- PRD section: <anchor or section title from docs/PRD.md>
- Wave: 1 | 2 | 3+
EOF
)"
```

Capture the returned issue number for each epic. After all create/edit actions complete, list them:

```bash
gh issue list --label epic --state open
```

If any epics depend on others, go back and edit each dependent epic's body to replace `#TBD` with the real issue number (dependencies can only be resolved once all issues exist).

---

## Step 6 — TL;DR Summary

Print to the terminal (no issue comment — epics are their own issues):

```
## /plan-epics — TL;DR
Date: YYYY-MM-DD
PRD source: docs/PRD.md (last reconciled: <date from PRD>)

### Created
- #<N> Epic: <name> (Wave <n>, size <S/M/L>)
- ...

### Updated
- #<N> Epic: <name> — <what changed>

### Closed
- #<N> Epic: <name> — <reason>

### Unchanged
- <count> existing epics

### Wave 1 (ready to start)
- #<N>, #<N>, #<N>

### Next
Pick an epic from Wave 1 and run `/define <epic#>` to start the first feature in that epic.
```

---

## Handoff

Tell the user:

> **Epics planned ✅** > <N> epic issues created/updated in the tracker. Wave 1 is ready to start.
>
> Next: `/define <epic#>` to pick the next unstarted feature from one of the Wave 1 epics.
