# Agent Instructions

> Tool-agnostic companion to `.claude/CLAUDE.md`. Read by any AI agent (Claude Code, Codex, custom sub-agents) that participates in this workflow.
>
> **Shared rules, hard don'ts, and per-project config live in `.claude/CLAUDE.md`.** Read that first. This file covers only agent-specific concerns: the implementer role, plan-time advisors, and the dispatched roster for Phase 2b / 5.

---

## Implementer (Phase 3)

Claude is the default implementer. Codex (OpenAI/GPT-4o) is an **optional** alternative — use it only if the project has it wired up (`/codex:rescue`, `/codex:status`, `/codex:result`).

Regardless of who implements, the rules are the same:

1. Read the **Plan TL;DR** on the task issue before writing code.
2. One sub-task at a time — never the whole plan in one pass.
3. Write a failing test before implementing each sub-task (TDD).
4. Do not modify the plan silently — flag issues and let the human re-run `/plan`.
5. Do not add abstractions, error handling, or features outside the sub-task.
6. Follow existing code patterns — reuse over invent.

When Codex is the implementer, Claude supervises: runs the supervisory checklist in `.claude/skills/implement/SKILL.md` Step 5 after each sub-task and sends corrective instructions on failure. When Claude implements directly, the same checklist applies as self-review.

---

## Token Budgets

- Advisor/reviewer brief: ≤150 words, excluding required artifacts such as the plan, diff, or short doc excerpts.
- Advisor/reviewer report: ≤200 words total.
- Per-finding rationale: ≤50 words.

List Critical/blocking findings first. If the cap is tight, collapse advisory findings to counts plus the highest-signal examples.

---

## Implementation Advisor Roster (Plan-Time)

`/plan` picks 1–3 of these per task based on task shape, but dispatch is default-off. They run only when `/plan` is rerun after `/review-plan` returned ≥1 Critical, or when the planner flags an explicit external-knowledge gap. They **advise** the plan before implementation; they do not write code themselves. `/implement` reads the approved Plan TL;DR and Review Plan TL;DR — it does not re-dispatch advisors.

| Agent                 | Covers                                                        |
| --------------------- | ------------------------------------------------------------- |
| `team-lead`           | Sequencing, scope risks, cross-cutting concerns               |
| `researcher`          | Library/protocol unknowns, edge-case documentation, citations |
| `frontend-specialist` | UI patterns, accessibility, interaction states                |
| `backend-specialist`  | API shape, error paths, observability                         |
| `data-engineer`       | Schema, migrations, indexes, data integrity                   |

Each agent has a role file in `.claude/agents/implementation/<name>.md` describing its lens and output format.

---

## Review Roster (Phase 5)

`/review` dispatches 1–3 reviewers based on the complexity gate. Role files live under `.claude/agents/review/`.

| Agent               | Covers                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| `tech-lead`         | Code quality, architecture fit, performance (always dispatched)                      |
| `security-reviewer` | Vulnerabilities, data handling, auth/authz (when security-sensitive)                 |
| `product-reviewer`  | Acceptance criteria, requirements alignment, non-goal violations (when user-visible) |

Gate mapping:

- Always → `tech-lead`
- Security-sensitive criterion YES → add `security-reviewer`
- Product lens triggered (2+ criteria, public API change, or 4+ criteria) → add `product-reviewer` when not security-sensitive
- All three → only when 4+ criteria, security-sensitive, and product-lens triggers are all present

A high criteria count alone does not dispatch `security-reviewer`; unselected third-reviewer lenses stay advisory-mode-only.

In `/revise`, re-review is targeted: dispatch `tech-lead` plus the original non-tech Critical finder only. Do not re-run the full Phase 5 roster.

---

## Plan Reviewer (Phase 2b)

`/review-plan` dispatches `plan-reviewer` (`.claude/agents/planning/plan-reviewer.md`) to evaluate the plan before code is written. Single agent, no complexity gate — plan reviews are cheap and binary (approve or loop).
