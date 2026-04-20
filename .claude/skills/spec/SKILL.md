---
name: spec
description: Phase 2 of the SDD workflow — reads the Define TL;DR from the issue tracker, runs a 3-specialist-agent spec generation process with per-category human approval, writes the approved spec, and updates the issue.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Spec Skill — Phase 2 of 6

You are running **Phase 2: Spec** of the Spec-Driven Development workflow.

## Fresh Context Check

This phase is designed to run in a fresh context. If you have prior conversation history in this session unrelated to this phase, ask the user to run `/clear` and then re-run `/spec <issue-number>`.

## Anti-Rationalization Guards

- "The spec is mostly done, I'll fill in details as we code" → No. Spec must be complete and approved before Phase 3 starts.
- "The category looks good enough, let's move on" → No. Each category requires an explicit "approved" from the user.
- "The spec agents covered everything, no need for a separate final approval" → No. Category approvals ≠ spec approval. The complete spec requires its own explicit sign-off.

---

## Step 1 — Load State from Issue Tracker

Ask the user for the issue number if not provided as an argument.

> **Platform note:** Commands below use `gh` (GitHub CLI). Check the **Version Control** section in `.claude/CLAUDE.md` for your project's platform and substitute accordingly (e.g. `glab issue view` for GitLab).

Run:
```bash
gh issue view <N> --json number,title,body,comments
```

From the output:
- Extract the feature name and description from the issue body
- Extract the Phase 1 TL;DR from comments — this is your understanding of what to build
- Extract the PRD path from the Links section of the issue body (if present, read the PRD file)

**Verify gate:** Check that Phase 1 is marked `[x]` in the issue's Workflow Progress checklist. If Phase 1 is not complete, stop and tell the user to complete `/define` first.

---

## Step 2 — Read Supporting Context

Using the paths from the issue and Phase 1 TL;DR, read:
- The PRD (if one exists)
- `docs/customer/domain-glossary.md`
- `docs/customer/integrations.md`
- `docs/customer/compliance.md`
- `docs/architecture/system-overview.md`

---

## Step 3 — Three-Agent Spec Generation

Run the three spec agents **sequentially** — each builds on the prior agent's output.

### Agent 1: Product Designer

Dispatch the `product-designer` agent. Pass it:
- The PRD file path (or feature description if no PRD)
- The Phase 1 TL;DR (understanding summary from the issue comment)
- Paths to `docs/customer/domain-glossary.md`, `docs/customer/integrations.md`, `docs/customer/compliance.md`

Wait for the agent to complete before proceeding.

Output: user stories, scope, non-goals, success metrics.

### Agent 2: UX Designer

Dispatch the `ux-designer` agent. Pass it:
- The PRD file path
- The Phase 1 TL;DR
- The full output from the Product Designer agent

Wait for the agent to complete before proceeding.

Output: user flows, interaction patterns, accessibility notes, edge-case UX states.

### Agent 3: Senior Developer

Dispatch the `senior-developer` agent. Pass it:
- The PRD file path
- The Phase 1 TL;DR
- The full output from both prior agents
- `docs/architecture/system-overview.md`

Wait for the agent to complete before proceeding.

Output: technical approach, data model, API design, individually itemized library/tech stack recommendations.

---

## Step 4 — Per-Category Approval

Present decisions to the user one category at a time. **Do not advance to the next category until the current one is approved.**

**Category A — Scope & User Stories**
Present the user stories, scope, and non-goals from the Product Designer (plus any UX-layer additions). Wait for approval or change requests. If changes are requested, apply them and re-present only the changed items.

**Category B — UX Approach**
Present the user flows, interaction patterns, accessibility notes, and edge-case states from the UX Designer.

**Category C — Tech Stack & Libraries**
Present each library/framework recommendation as an individually numbered line item with its rationale and alternatives. The user may approve, reject, or defer each item individually. Do not close Category C until every item is resolved.

**Category D — Data Model & API Design**
Present the schema draft and endpoint list from the Senior Developer.

**Surface any [FLAG] items** raised by the agents before finalising each category. Flags require human resolution.

---

## Step 5 — Write the Spec

After all four categories are approved:

1. Write the spec to `docs/specs/<feature-slug>.md` using the template at `docs/specs/TEMPLATE-spec.md`
2. The spec must incorporate all approved decisions verbatim — no reinterpretation
3. Present the complete spec to the user

**HARD GATE — STOP HERE.**

The spec requires a **separate explicit approval** before Phase 3 begins. If the user suggests changes, update the spec and present again.

---

## Step 6 — Post TL;DR Comment and Update Issue

After spec approval, post the TL;DR:

```bash
gh issue comment <N> --body "$(cat <<'EOF'
## Phase 2 TL;DR: Spec
**Date:** YYYY-MM-DD
**Status:** Complete ✅

### What was done
- Ran 3-agent spec generation (Product Designer → UX Designer → Senior Developer)
- Per-category approval completed (Scope, UX, Tech Stack, Data Model)
- Spec approved by user

### Key decisions
- Tech stack approved: [list approved libraries]
- Data model: [1-2 sentences on key tables/changes]
- API: [key endpoints]

### Key artifacts
- Spec: docs/specs/<feature-slug>.md

### Next step
Run `/clear`, then `/implement <N>` in a fresh session.
EOF
)"
```

Update the issue body to mark Phase 2 complete and add the spec link:

```bash
gh issue edit <N> --body "$(cat <<'EOF'
## Feature: <feature-name>

<description>

## Workflow Progress
- [x] Phase 1: Define — <date>
- [x] Phase 2: Spec — <YYYY-MM-DD>
- [ ] Phase 3: Implement
- [ ] Phase 4: Test
- [ ] Phase 5: Review
- [ ] Phase 6: Commit & PR

## Links
- PRD: <path or "none">
- Spec: docs/specs/<feature-slug>.md
- Branch: (to be added in Phase 3)
- PR: (to be added in Phase 6)
EOF
)"
```

---

## Handoff

Tell the user:

> **Phase 2: Spec — Complete ✅**
> Spec written to `docs/specs/<feature-slug>.md`
>
> Next: Run `/clear` to start a fresh session, then run:
> ```
> /implement <N>
> ```
