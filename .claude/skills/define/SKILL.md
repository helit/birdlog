---
name: define
description: Use when starting a new feature. Phase 1 of the SDD workflow — runs a rigorous dialogue loop to reach shared, unambiguous understanding, then creates an issue tracker card as the feature's Kanban card and cross-session state store.
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# Define Skill — Phase 1 of 6

You are running **Phase 1: Define** of the Spec-Driven Development workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If you have prior conversation history in this session unrelated to this phase, ask the user to run `/clear` and then re-run `/define`.

## Anti-Rationalization Guards

- "I understand enough, let's move on" → No. Exit only when the user explicitly signals satisfaction.
- "The user said 'ok' — that's good enough" → No. Ambiguous short affirmatives require explicit confirmation. Ask: *"Are you satisfied with the current understanding and ready to move to Phase 2?"*
- "I'll note the open question and proceed" → No. Unresolved questions block the phase. Resolve them or explicitly park them with the user's agreement.

---

## Step 0 — Check Project is Initialized

Before doing anything else, verify the project has been scaffolded:

```bash
ls -la
```

Check for the presence of `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `src/`, or `app/`. If none are found, **stop immediately** and tell the user:

> "No project structure detected. Run `/initiate-project` first to choose your tech stack and scaffold the project, then come back to `/define` to start your first feature."

---

## Step 1 — Gather Context

Ask the user for:
1. The feature name or description
2. The PRD file path (optional — check `docs/prd/` if not provided)

Then read all of the following before asking any questions:
- The PRD from `docs/prd/` if one exists
- `docs/customer/domain-glossary.md` — understand the customer's terminology
- `docs/customer/integrations.md` — understand the external systems involved
- `docs/customer/compliance.md` — note any regulatory constraints
- `docs/architecture/system-overview.md` — understand the current system design

---

## Step 2 — Dialogue Loop

After completing the reads, identify all ambiguities and unknowns across: scope, constraints, integrations, success metrics, and non-goals. Then enter the dialogue loop:

- Ask questions in rounds of ≤7, grouped by topic. Provide multiple-choice options where the answer space is bounded (yes/no, enumerated choices). Reserve open-ended questions for genuinely open-ended concerns.
- After each response: process the answers, update your understanding, identify which gaps remain, and identify any new gaps surfaced by the answers.
- When following up on a prior answer, state explicitly which answer triggered the new question: *"Your answer about X surfaces a question about Y."*
- **Continue the loop until the user explicitly signals satisfaction.** Acceptable signals: "I'm satisfied", "proceed", "that covers it", "looks good", "move on", or equivalent. Do not self-terminate the loop by declaring you understand enough.

---

## Step 3 — Understanding Summary

After the loop exits, present a summary of your understanding in 5–8 bullet points covering:
- Scope (what IS being built)
- Key constraints
- Non-goals (what is explicitly excluded)
- Success metrics
- Open risks

Ask for one final confirmation: *"Does this summary accurately capture what we're building? Confirm to proceed to Phase 2."*

**Hard gate:** Do not proceed past this step until the user explicitly confirms the summary is correct.

---

## Step 4 — Create Issue

After confirmation, create the issue that will track this feature through all 6 phases.

> **Platform note:** Commands below use `gh` (GitHub CLI). Check the **Version Control** section in `.claude/CLAUDE.md` for your project's platform and substitute accordingly (e.g. `glab issue create` for GitLab).

Derive a `<feature-slug>` from the feature name (lowercase, hyphenated, e.g. `user-profile-editor`).

Run:
```bash
gh issue create \
  --title "feat: <feature-name>" \
  --body "$(cat <<'EOF'
## Feature: <feature-name>

<1-2 sentence description from the understanding summary>

## Workflow Progress
- [ ] Phase 1: Define
- [ ] Phase 2: Spec
- [ ] Phase 3: Implement
- [ ] Phase 4: Test
- [ ] Phase 5: Review
- [ ] Phase 6: Commit & PR

## Links
- PRD: <path or "none">
- Spec: (to be added in Phase 2)
- Branch: (to be added in Phase 3)
- PR: (to be added in Phase 6)
EOF
)"
```

Capture the issue number from the output (e.g. `#42`).

---

## Step 5 — Post TL;DR Comment

Post the Phase 1 TL;DR as a comment on the issue:

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 1 TL;DR: Define
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Completed rigorous dialogue loop to establish shared understanding
- [2-4 bullets summarising key things clarified]

### Key decisions
- Scope: [1-2 sentences]
- Non-goals: [key exclusions]
- Success metrics: [key metrics]
- Open risks: [any unresolved risks noted]

### Key artifacts
- PRD: <path or "none">
- Understanding summary: captured in this comment

### Next step
Run `/clear`, then `/spec <N>` in a fresh session.
EOF
)"
```

---

## Step 6 — Update Issue Checklist

Mark Phase 1 complete in the issue body:

```bash
gh issue edit <N> --body "$(cat <<'EOF'
## Feature: <feature-name>

<description>

## Workflow Progress
- [x] Phase 1: Define — <YYYY-MM-DD>
- [ ] Phase 2: Spec
- [ ] Phase 3: Implement
- [ ] Phase 4: Test
- [ ] Phase 5: Review
- [ ] Phase 6: Commit & PR

## Links
- PRD: <path or "none">
- Spec: (to be added in Phase 2)
- Branch: (to be added in Phase 3)
- PR: (to be added in Phase 6)
EOF
)"
```

---

## Handoff

Tell the user:

> **Phase 1: Define — Complete ✅**
> Issue #N created. View with your platform CLI (e.g. `gh issue view <N>` or `glab issue view <N>`).
>
> Next: Run `/clear` to start a fresh session, then run:
> ```
> /spec <N>
> ```
