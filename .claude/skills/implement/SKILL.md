---
name: implement
description: Phase 3 of the Stage 3 feature workflow — reads the approved Plan TL;DR from the task issue, verifies dependencies are closed, consumes the plan/review-plan guidance already captured on the issue, and drives the plan's sub-tasks with TDD (Claude implements by default; Codex is an optional alternative if configured). No docs/specs/ artefact — the plan comment on the issue is the source of truth.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Implement Skill — Phase 3 of 6 (Stage 3)

You are running **Phase 3: Implement** of the Stage 3 feature workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If you have prior conversation history in this session unrelated to this phase, ask the user to run `/clear` and then re-run `/implement <N>`.

## Scope of this phase

Every `/implement <N>` runs against a **child task issue** (created by `/define <epic#>`). The task is scoped tightly by the Plan TL;DR on that child; the parent epic exists for context (acceptance criteria, non-goals) but is not implemented directly.

## Anti-Rationalization Guards

- "The plan is clear enough, I'll make the ambiguous part work" → No. Flag plan ambiguities to the user before delegating. Do not make independent design decisions.
- "I'll mark this task complete and fix it in the next batch" → No. The supervisory checklist must pass for each sub-task before it is marked complete.
- "The implementer introduced a small extra dependency — it'll be fine" → No. Any unapproved dependency is a checklist failure. Send corrective instructions (or fix it yourself if you're implementing).
- "The test was written after the implementation but it passes" → No. TDD order matters. Test must be written first and must fail before implementation exists.
- "The dependency task is 'basically done' — I'll start anyway" → No. Dependencies must be fully closed (`state == CLOSED`).
- "I'll re-dispatch the advisor agents the plan picked — more advice is safer" → No. The plan/review-plan guidance is already approved state. Read it; do not re-derive it.

---

## Step 1 — Load State from Issue Tracker

Ask for the issue number if not provided. Call it `<N>`.

> **Platform note:** commands below use `gh`. Substitute per `.claude/CLAUDE.md` §Per-project config.

```bash
gh issue view <N> --json number,title,body,comments,state
```

**Identify the parent epic.** Scan the body for `**Part of:** #<epic#>`. If missing, stop and tell the user — this workflow expects every task issue to be linked to an epic via `/define <epic#>`.

**Load the latest Plan TL;DR.** Scan comments for the most recent `## Phase 2 TL;DR: Plan`. Extract:

- Sub-tasks (with failing tests, touched files)
- Implementation agent roster
- Risks & open questions
- Acceptance bullets from the epic

**Load the latest Review Plan TL;DR.** Scan comments for the most recent `## Phase 2b TL;DR: Review Plan`. Extract:

- Approval status
- Major advisory findings, if any
- Any Critical findings that were resolved by the final Plan TL;DR

**Verify gates:**

- Phase 2 (Plan) must be `[x]` in `## Task Workflow Progress`
- Phase 2b (Review Plan) must be `[x]` with a `## Phase 2b TL;DR: Review Plan` comment showing `Status: Approved ✅`
- If either gate fails, stop and tell the user what to complete first.

Extract from the child body:

- `**Depends on:**` — list of task issue IDs
- `**Layer:**` — data / backend / frontend / cross-cutting
- `**Branch:**` — `feat/<feature-slug>/<task-slug>`

---

## Step 1b — Dependency Check

For each issue number in `**Depends on:**`:

```bash
gh issue view <dep> --json state,title
```

All dependencies must have `state == CLOSED`. If any is open, stop with:

> _"Task `#<N>` depends on `#<dep>` (`<dep title>`), which is still open. Close `#<dep>` first (its PR must merge) before starting this task."_

---

## Step 2 — Read Supporting Context

Read:

- The parent epic body (for acceptance criteria)
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/GLOSSARY.md`
- Any files in the plan's "Touched files" list (read-only for now — you're orienting, not editing)

Read `.claude/CLAUDE.md` §Per-project config to extract `**Task PR strategy:**` — drives branch base choice in Step 2b.

---

## Step 2b — Create or Switch to the Branch

Branch name comes from the child body's `**Branch:**` field.

**Task PR strategy `trunk`:**

```bash
git checkout main && git pull
git checkout -b feat/<feature-slug>/<task-slug>  # or switch if exists
```

**Task PR strategy `feature-branch`:**

```bash
# Ensure the long-running feature branch exists
if ! git show-ref --verify --quiet refs/heads/feat/<feature-slug>; then
  git checkout main && git pull
  git checkout -b feat/<feature-slug>
  git push -u origin feat/<feature-slug>
fi
git checkout feat/<feature-slug> && git pull
git checkout -b feat/<feature-slug>/<task-slug>  # or switch if exists
```

---

## Step 3 — Build Execution Playbook from Existing Plan

Do **not** dispatch implementation advisors in this phase. Advisor input was a Phase 2 planning activity; any useful advice should already be folded into the approved Plan TL;DR, and Phase 2b advisory findings live in the Review Plan TL;DR.

Build a concise execution playbook from:

- The Plan TL;DR sub-tasks, failing tests, touched files, risks, and roster
- The Review Plan TL;DR's Major advisory findings
- The parent epic acceptance bullets
- The currently touched files read in Step 2

If this pass exposes a material plan gap (new sub-task, new risk, changed contract, or unresolved ambiguity), **stop** and tell the user:

> "The approved plan has a gap before implementation. Run `/plan <N>` again, then `/review-plan <N>`, or explicitly approve proceeding with this in-flight clarification."

---

## Step 4 — Implement Sub-tasks (per sub-task, TDD)

For each sub-task in the plan, prepare an implementation brief covering:

- The sub-task description
- The failing-test specification for that sub-task
- Touched files for that sub-task
- Plan/review-plan notes relevant to this sub-task (from Step 3)
- Paths to `docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, `docs/PRD.md`
- Explicit TDD instruction: _"Write the failing test first. Run it, confirm it fails for the right reason. Then implement the minimal code to make it pass. Do not implement the next sub-task in this pass."_
- Explicit scope constraint: _"Implement only this sub-task. Do not touch code outside the listed files. Do not introduce a dependency not approved in the plan. Flag plan ambiguity rather than making an independent design decision."_

**Brief cap:** keep the implementation brief ≤150 words, excluding pasted code snippets or file paths. If more context is needed, cite the source comment/file instead of restating it.

### Who implements?

- **Default — Claude implements directly.** Invoke the `test-driven-development` skill and work through the brief.
- **Optional — Codex implements, Claude supervises.** Only if the project has Codex wired up (`/codex:rescue`, `/codex:status`, `/codex:result`). Deliver the brief to the user:
  > "Sub-task `<n>` brief ready. Trigger Codex with:
  > `/codex:rescue [paste the brief below]`
  > Then run `/codex:status` to check progress and `/codex:result` to retrieve output when done."

Either way, Step 5's supervisory checklist must pass before a sub-task is marked `[x]`.

---

## Step 5 — Supervisory Review (per sub-task)

After each sub-task's implementation, run the checklist. If Codex is the implementer, send sub-task-numbered corrective instructions on any failure and loop until the checklist passes. If Claude implemented, run it as self-review and fix in place.

- [ ] The sub-task has a test written before implementation
- [ ] The test failed before implementation and passes after
- [ ] The implementation matches the sub-task description and the plan's acceptance bullets
- [ ] No code exists that isn't required by this sub-task
- [ ] No design decision was made that the plan leaves undefined (flag each explicitly)
- [ ] No dependency was introduced that isn't in the plan

Mark sub-tasks `[x]` only after the supervisory review passes for that sub-task.

**Hard gate:** Phase 3 does not complete until the supervisory checklist passes for every sub-task in the plan.

---

## Step 6 — Living Doc Updates (apply and commit on the feature branch)

Implementation commonly surfaces updates for the living docs:

- New component, service, library, or API endpoint → `docs/ARCHITECTURE.md`
- New domain term (from specs discussion, variable names, or advisor notes) → `docs/GLOSSARY.md`
- Anything flagged under `### Planned doc updates` in the Phase 1 or Phase 2 TL;DRs — apply those now.

Apply surgical edits only (additions/removals, no rewrites). If you made edits, commit them on the current feature branch as a dedicated commit before posting the Phase 3 TL;DR:

```bash
git add docs/ARCHITECTURE.md docs/GLOSSARY.md docs/PRD.md  # whichever changed
```

Use the `git-commit-helper` skill for the message. Format: `docs: update ARCHITECTURE/GLOSSARY for #<N>` with a 1-line body per change. Record the same list in the Phase 3 TL;DR's `### Doc updates` section (Step 7).

---

## Step 7 — Post TL;DR and Update Issue

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 3 TL;DR: Implement
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- [N] sub-tasks implemented (implementer: Claude | Codex); supervisory checklist passed per sub-task.
- Branch: `<branch-name>`

### Plan guidance used
- Advisor roster from Plan TL;DR: [list; not re-dispatched in Phase 3]
- Review Plan advisory findings applied: [N or "none"]

### Key decisions
- [Any ambiguity flagged and resolved]
- [Any scope clarifications made]

### Doc updates
- ARCHITECTURE.md: <what changed> (or "none")
- GLOSSARY.md: <what changed> (or "none")

### Next step
Run `/clear`, then `/test <N>` in a fresh session.
EOF
)"
```

Update the child body: set `- [x] Phase 3: Implement — <YYYY-MM-DD>` in `## Task Workflow Progress`, and write the branch name into Links.

---

## Handoff

> **Phase 3: Implement — Complete ✅**
> Implementation done and supervisory review passed.
>
> Next: Run `/clear`, then:
>
> ```
> /test <N>
> ```
