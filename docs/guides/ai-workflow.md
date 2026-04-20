# AI Workflow Guide

Team playbook for AI-assisted development. Read when starting a new engagement or onboarding.

---

## The 6-Phase Workflow

Each phase runs in its own fresh context window. The issue tracker is the cross-session state — every phase reads prior TL;DRs from it and posts its own when done.

```
/define          Phase 1: Define     → dialogue loop → issue #N created
                                       ↓ /clear
/spec <N>        Phase 2: Spec       → 3-agent team → per-category approval → spec approved
                                       ↓ /clear
/implement <N>   Phase 3: Implement  → Codex implements → Claude supervisory review
                                       ↓ /clear
/test <N>        Phase 4: Test       → full test suite + linter must pass
                                       ↓ /clear
/review <N>      Phase 5: Review     → complexity gate → 1 or 3 review agents
                                       ↓ /clear
/commit <N>      Phase 6: Commit     → final verification → PR created → human merges
```

One issue per feature. Run `/clear` between every phase.

---

## Cross-Session State: Issue Tracker

The issue is both the Kanban card and the context store:

- **Body:** Phase checklist — each phase marks its checkbox when done
- **Comments:** TL;DR from each phase — the next phase reads this to reconstruct context
- **Links section:** PRD path, spec path, branch, PR URL — filled in as work progresses

Check status with your platform CLI (e.g. `gh issue view <N>` for GitHub, `glab issue view <N>` for GitLab).

The issue closes automatically when the PR merges (via `Closes #N` in the PR body).

---

## Starting a New Customer Engagement

1. Fork this repo and give it a project-specific name.
2. Fill in **customer docs** (`docs/customer/`):
   - `domain-glossary.md` — customer terminology. Do this first; it affects everything.
   - `integrations.md` — external APIs, legacy systems, data sources.
   - `compliance.md` — GDPR, regulations, security requirements.
   - `brand-guidelines.md` — naming conventions, UX patterns, code style.
   - `stakeholders.md` — who's who, decision makers, escalation contacts.
3. Customize `.claude/CLAUDE.md` — fill in project name and tech stack.
4. Fill in `docs/architecture/system-overview.md` with the actual system design.
5. Create the first PRD in `docs/prd/` using `TEMPLATE-prd.md`.
6. Run `/initiate-project` (if starting from scratch), then `/define`.

---

## Daily Feature Loop

```
1. Pick feature from backlog
2. Write/refine its PRD in docs/prd/
3. /define → dialogue loop → issue #N
4. /clear → /spec <N> → approve spec
5. /clear → /implement <N> → Codex implements
6. /clear → /test <N> → tests pass
7. /clear → /review <N> → findings resolved
8. /clear → /commit <N> → PR created, human merges
```

---

## Bug Fix Workflow

```
1. Describe the bug to Claude Code
2. /fix-bug
3. Confirm the failing test reproduces the bug
4. Review the fix
5. Merge
```

---

## Codex in Phase 3

Codex (OpenAI/GPT-4o) implements; Claude supervises.

```
1. /implement <N> generates the delegation payload
2. Trigger Codex: /codex:rescue [payload]
3. Check status: /codex:status
4. Retrieve output: /codex:result
5. Claude runs supervisory checklist — iterates until it passes
6. Tasks marked complete in spec only after supervisory sign-off
```

---

## Maintaining the Boilerplate

- **Prune CLAUDE.md regularly.** If AI already does something correctly without instruction, delete that rule.
- **Update customer docs** when domain or requirements evolve.
- **Archive specs** after features ship — useful for debugging and onboarding.
