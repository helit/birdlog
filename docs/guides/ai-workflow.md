# AI Workflow Guide

Team playbook for AI-assisted development. Read when starting a new engagement or onboarding.

---

## The 3 Stages

```
Stage 1 — Discover          Stage 2 — Plan Epics       Stage 3 — Build Features
─────────────────────       ─────────────────────       ────────────────────────
/explore-architecture       /plan-epics                 /define <epic#>
/build-glossary             (issue-tracker epics)       /plan <N>
/define-prd                                             /review-plan <N>
                                                        /implement <N>
docs/ARCHITECTURE.md                                    /test <N>
docs/GLOSSARY.md                                        /review <N>
docs/PRD.md                                             /revise <N>       (if needed)
                                                        /commit <N>
```

Each Stage 3 phase runs in its own fresh context window — use `/clear` between phases. The issue tracker is the cross-session state store; every phase reads prior TL;DRs from it and posts its own when done.

---

## Stage 1 — Discovery

Three skills produce the three living documents under `docs/`. Each can be re-run independently whenever its source material drifts.

### `/explore-architecture` → `docs/ARCHITECTURE.md`

Scans the repo tree and identifies tech stack, components, data flow, and integrations. If the doc already exists, diffs and patches section-by-section with per-section approval. First-run: propose full content.

### `/build-glossary` → `docs/GLOSSARY.md`

Scans code + `PRD.md` + `ARCHITECTURE.md` for project-specific terminology. Produces an alphabetised reference. Generic engineering terms never belong here — only domain-specific language.

### `/define-prd` → `docs/PRD.md`

Takes either an existing PRD (file path / URL / freeform) or runs a Socratic greenfield interview. Structures into: Problem, Users, Goal, Success metrics, Scope, Non-goals, Constraints, Stakeholders, Integrations, Compliance, Open questions.

**Living-doc model:** these three files are updated automatically during Stage 3 (see below). Every phase that edits a living doc lists the change in its TL;DR under `### Doc updates`.

---

## Stage 2 — Epic Planning

### `/plan-epics`

Reads `docs/PRD.md` and facilitates a sprint-planning session. Proposes 3–8 epics, each with goal, acceptance criteria, scope, non-goals, dependencies, and rough size. Assigns each epic to a **wave** (1, 2, 3+) so execution order is explicit.

**Epics live in the issue tracker**, not as markdown files. Each epic is a parent issue labelled `epic` with a `## Child tasks` section that later `/define <epic#>` runs populate.

---

## Stage 3 — Feature Workflow (per task in an epic)

Every task in an epic runs through the same seven phases. `/clear` between every phase.

```
/define <epic#>   Phase 1: Define      → pick next task, size, create child issue #N
                                         ↓ /clear
/plan <N>         Phase 2: Plan        → Red-Green-Refactor plan on the issue
                                         ↓ /clear
/review-plan <N>  Phase 2b: Review     → plan-reviewer agent → approve or loop back to /plan
                                         ↓ /clear
/implement <N>    Phase 3: Implement   → approved plan guidance + TDD (Claude default; Codex optional)
                                         ↓ /clear
/test <N>         Phase 4: Test        → full test suite + linter must pass
                                         ↓ /clear
/review <N>       Phase 5: Review      → 1–3 reviewers (complexity-gated); Critical blocks
                                         ↓ if Critical findings
/revise <N>       Phase 5b: Revise     → TDD fix + re-test + re-review (max 2 iterations)
                                         clean → /commit   |   budget exhausted → escalate
                                         ↓ /clear
/commit <N>       Phase 6: Commit      → PR → human merges
```

---

## Sizing: Small / Medium / Large

Classified during `/define` and honoured by `/plan` for interview depth + test coverage.

**Sizing criteria** (count how many apply):

1. Touches auth, payments, or data security
2. Modifies database schema
3. Introduces ≥1 new external dependency
4. Changes a public API contract
5. Spans ≥3 files of net-new code
6. Has async/concurrent operations
7. UX decisions are non-trivial

| Size       | Criteria | `/plan` depth                                                      |
| ---------- | -------- | ------------------------------------------------------------------ |
| **Small**  | 0        | 2–3 sub-tasks, minimal risks section, no advisor dispatch          |
| **Medium** | 1–3      | Up to 5 compact sub-tasks; advisors dispatch only behind the gate   |
| **Large**  | 4+       | Rare at task level — usually a signal to split into multiple tasks |

If a task lands "Large" during `/define`, propose splitting it before creating the child issue. Let the human decide.

---

## Plan Reviewer Agent (Phase 2b)

`/review-plan` dispatches a single `plan-reviewer` agent on the Plan TL;DR. The agent checks:

- **Feasibility** — can this be built with the stack and codebase as they are?
- **Test strategy** — is there a failing test per sub-task, and are the tests asserting behaviour?
- **Architecture fit** — does the plan respect `docs/ARCHITECTURE.md`?
- **Agent roster sanity** — were the right implementation specialists picked?
- **Risk surface** — anything missing (rollback story, feature flag, telemetry)?

If Critical findings surface, `/review-plan` loops back to `/plan`. No iteration cap (catching a bad plan here is much cheaper than catching a bad implementation in Phase 5), but three loops on a single plan is a signal to escalate.

---

## Token Budget Rules

- Advisor/reviewer brief: ≤150 words, excluding required artifacts such as the plan, diff, or short doc excerpts.
- Advisor/reviewer report: ≤200 words total.
- Per-finding rationale: ≤50 words.

If the cap is tight, agents list Critical/blocking findings first and collapse advisory findings to counts plus the highest-signal examples.

---

## Implementation Advisors (Plan-Time)

`/plan` picks 1–3 advisors from `.claude/agents/implementation/` based on task shape, but advisor dispatch is default-off. Advisors run only when `/plan` is rerun after `/review-plan` returned ≥1 Critical, or when the planner flags an explicit external-knowledge gap.

| Advisor               | Picked when                                                     |
| --------------------- | --------------------------------------------------------------- |
| `team-lead`           | Task spans multiple layers, or shared infrastructure is touched |
| `researcher`          | New library, protocol, or integration                           |
| `frontend-specialist` | Task adds or modifies UI                                        |
| `backend-specialist`  | Task adds or modifies server endpoints                          |
| `data-engineer`       | Task modifies schema or query patterns                          |

The roster is recorded in the Plan TL;DR. `/implement` does **not** dispatch these advisors again; it reads the approved plan and review-plan notes as the source of truth.

Plan TL;DRs use the compact template: sub-task name, failing-test-name, touched-files. Risk bullets are ≤30 words.

---

## Review Roster (Phase 5) — Complexity-Gated

`/review` dispatches 1–3 agents based on the same six criteria as sizing.

| Trigger                  | Roster impact                                                                 |
| ------------------------ | ----------------------------------------------------------------------------- |
| Always                   | `tech-lead`                                                                   |
| Security-sensitive YES   | add `security-reviewer`                                                       |
| Product lens triggered   | add `product-reviewer` when not security-sensitive                            |
| 4+ + security + product  | run all three reviewers                                                       |

The product lens is triggered by 2+ criteria, a public API contract change, or 4+ criteria. A high criteria count alone no longer dispatches the security reviewer; the unselected third lens stays advisory-mode-only.

Findings are categorised **Critical / Major / Minor**:

- **Critical** — blocks `/commit`. Routes through `/revise` (Phase 5b).
- **Major** — advisory, can defer with rationale.
- **Minor** — polish.

---

## Fix Loop (Phase 5b)

`/revise` fixes Critical findings TDD-style, re-runs Phase 4 verification, then re-reviews the updated diff with `tech-lead` plus the original non-tech Critical finder only. It posts a `Phase 5b TL;DR: Revise (Iteration N)` comment.

- **Budget:** 2 iterations max. If Criticals remain after iteration 2, `/revise` posts an Escalation TL;DR and halts. A human must re-scope, resolve manually, or explicitly accept a finding via `/plan` revision.
- **Only Critical blocks.** Majors are deferrable with rationale; Minors are noted.
- **Audit trail:** each iteration is a separate TL;DR. The Phase 5 checklist row is annotated, e.g. `- [x] Phase 5: Review — 2026-04-22 (+ 1 revise pass)`.

---

## Cross-Session State: Issue Tracker

The task issue is both the Kanban card and the context store:

- **Body:** Task Workflow Progress checklist — each phase marks its checkbox when done.
- **Comments:** TL;DR from each phase — subsequent phases read prior TL;DRs to reconstruct context.
- **Links:** parent epic, plan comment, branch, PR — filled in as work progresses.

Check status with your platform CLI (e.g. `gh issue view <N>` for GitHub, `glab issue view <N>` for GitLab). The issue closes automatically when the PR merges (via `Closes #<N>`).

---

## Living Docs: Implicit Updates

`docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, and `docs/PRD.md` are updated **implicitly** by Stage 3 phase skills and committed on the feature branch as part of the phase that edited them.

Who edits and commits:

- `/implement` — new component, dependency, API endpoint → ARCHITECTURE; new domain term → GLOSSARY. Also picks up anything under `### Planned doc updates` from the Phase 1/2 TL;DRs.
- `/review` — security/compliance note surfaced → ARCHITECTURE.
- `/revise` — any doc change caused by a fix.
- `/commit` — final reconciliation; prune anything the PR removed.

Who **does not** edit docs inline:

- `/define` and `/plan` run before the feature branch exists. They only record `### Planned doc updates` in their TL;DR for `/implement` to apply and commit.

Every doc edit is listed in the phase TL;DR under `### Doc updates` so the human can audit what changed and why. If docs drift (stale entries pile up), re-run `/explore-architecture` or `/build-glossary` to do a full re-scan.

---

## Starting a New Engagement

1. Fork this repo and rename.
2. Fill in `.claude/CLAUDE.md`:
   - Project name, description
   - Tech Stack section (or leave TODO — Stage 1 fills it)
   - Version Control section (platform, CLI, Task PR strategy)
3. Run Stage 1 in this order:
   - `/explore-architecture` (even on empty/greenfield, creates the stub)
   - `/define-prd`
   - `/build-glossary`
4. Run `/plan-epics` to create epic issues.
5. Pick a Wave 1 epic and run `/define <epic#>` to start the first feature.

---

## Daily Feature Loop

```
1. Pick a task from a Wave 1 epic
2. /define <epic#>            → classify size, create child issue #N
3. /clear → /plan <N>          → lightweight implementation plan on the issue
4. /clear → /review-plan <N>   → plan-reviewer approval (or loop to /plan)
5. /clear → /implement <N>     → approved plan guidance + TDD (Claude default; Codex optional)
6. /clear → /test <N>          → tests + linter clean
7. /clear → /review <N>        → 1–3 reviewers
7b. If Critical: /clear → /revise <N>   (max 2 iterations)
8. /clear → /commit <N>        → PR; human merges
```

When all tasks in an epic are merged:

- **trunk** strategy: close the epic issue manually once shipping is verified.
- **feature-branch** strategy: merge the rollup PR → epic closes automatically.

---

## Bug Fix Workflow

```
1. Describe the bug to Claude Code
2. /fix-bug
3. Confirm the failing test reproduces the bug
4. Review the fix
5. Merge
```

`/fix-bug` runs off-cycle — it doesn't need a plan or an epic. Root cause analysis → failing test → minimal fix → verify → commit.

---

## Phase 3 Implementer (Claude default; Codex optional)

By default, Claude implements sub-tasks directly via the `test-driven-development` skill and runs the supervisory checklist in `implement/SKILL.md` Step 5 as self-review.

If the project has Codex (OpenAI/GPT-4o) wired up — meaning `/codex:rescue`, `/codex:status`, `/codex:result` commands are available — `/implement` can hand off instead:

```
1. /implement <N> reads the approved plan/review-plan guidance and produces the implementation brief
2. Trigger Codex: /codex:rescue [brief]
3. Check status: /codex:status
4. Retrieve output: /codex:result
5. Claude runs supervisory checklist — iterates with Codex until it passes
6. Sub-tasks marked complete in the plan only after supervisory sign-off
```

Either path, the supervisory checklist is the gate — sub-tasks are not `[x]` until it passes.

---

## Maintaining the Boilerplate

- **Prune `CLAUDE.md` regularly.** If AI already does something correctly without instruction, delete that rule.
- **Re-run Stage 1 skills** when ARCHITECTURE/GLOSSARY/PRD drift from reality.
- **Watch the audit trail.** `### Doc updates` sections in phase TL;DRs are the fastest way to spot stale entries.
