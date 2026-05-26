---
name: define-prd
description: Stage 1 discovery skill — produces or refreshes docs/PRD.md from either a user-provided source (existing PRD path, URL, or freeform description) or a Socratic greenfield interview. Use when starting a new engagement or when product scope shifts significantly.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
---

# Define PRD Skill — Stage 1 of 3

You are running **Stage 1: Discovery — PRD**. Your job: produce or refresh `docs/PRD.md` so the high-level product description, users, goals, and constraints are captured in one place.

## Core Principle

The PRD answers **what are we building and why** at the product level. It is NOT a spec (no tasks, no APIs, no data models — those belong in epic issues and per-task plans). Keep the PRD short, stable, and decision-oriented.

## Anti-Rationalization Guards

- "The user gave a one-liner, that's enough" → No. Even a one-liner deserves a short interview to surface users, goals, and non-goals.
- "I'll restructure the user's existing PRD to match our format" → No. Extract into the standard shape, preserve their language, flag gaps; don't rewrite voice.
- "The PRD covers everything, no gaps to flag" → Be skeptical. If there are no open questions, you probably didn't probe hard enough.
- "I'll add technical implementation details to make it concrete" → No. Implementation lives in epics and plans. PRD is product-level.

---

## Step 1 — Locate Source Material

Ask the user:

> "Do you have an existing PRD or product description I should start from? Options:
>
> - (a) Path to a file in this repo
> - (b) URL to a document (Notion, Google Doc, Figma, etc.)
> - (c) Freeform description in chat
> - (d) Greenfield — let's build it through Q&A"

Also check: does `docs/PRD.md` already exist? If yes, this is a refresh, not a first-run.

### If (a) path

Read the file.

### If (b) URL

Use `WebFetch` to pull the content. If access is blocked, ask the user to paste the content.

### If (c) freeform

Use the user's description as the starting point.

### If (d) greenfield

Skip to Step 2 (Socratic interview).

---

## Step 2 — Socratic Interview (Greenfield or Gap-Filling)

If greenfield, run a full interview. If you have source material, run a shorter gap-filling pass.

### Topics to cover

1. **Problem** — What specific pain/need are we addressing? Who feels it?
2. **Users** — Who are they? How many? What do they do today instead?
3. **Goal / Outcome** — What does success look like? (One sentence.)
4. **Success metrics** — How will you measure it? (1–3 metrics, concrete.)
5. **Scope** — What IS in?
6. **Non-goals** — What is explicitly NOT in? (Force at least two.)
7. **Constraints** — Time, team, tech, regulatory, budget?
8. **Stakeholders** — Who decides? Who reviews? Who uses?
9. **Integrations** — External systems to connect to?
10. **Compliance** — Regulated data? Audit requirements?

### Interview rules

- Group questions in batches of 3–5, not one at a time.
- When the user gives a source document, ASK about gaps rather than re-asking what they already wrote.
- Probe assumptions: _"You say 'internal users' — does that include contractors and service accounts?"_
- Force articulation of non-goals. If the user can't name any, the scope is probably too fuzzy.

---

## Step 3 — Draft + Confirm

Present the draft PRD in the canonical structure (see Step 4). Ask:

> "Here's the PRD draft. Review it and either approve, or tell me what to change. I'll also highlight gaps where I couldn't get a clear answer — flag which of those you want to resolve now vs. leave open."

**Hard gate:** Do not write the file until the user approves.

---

## Step 4 — Write

Write `docs/PRD.md`:

```markdown
# Product Requirements Document

> Living document. Source of truth for what we're building at the product level. Updated by `/define-prd` and during phase runs when product scope shifts. Last reconciled: YYYY-MM-DD.

## Problem

<1-3 sentences>

## Users

<1-3 bullets: who they are, rough volume, current workaround>

## Goal

<1 sentence>

## Success metrics

- <metric 1>
- <metric 2>

## Scope

<what IS in — bulleted>

## Non-goals

<what is explicitly NOT in — bulleted>

## Constraints

<time, team, tech, regulatory, budget>

## Stakeholders

| Role | Name | Decision / review / use |
| ---- | ---- | ----------------------- |

## External integrations

<systems to connect to, or "none">

## Compliance / regulatory

<regulations, data classifications, or "none">

## Open questions

<items flagged during interview — resolve before committing heavy work>
```

---

## Step 5 — TL;DR Summary

```
## /define-prd — TL;DR
Date: YYYY-MM-DD
Source: [file path | URL | freeform | greenfield]
Sections added: [list]
Sections updated: [list]
Open questions: [count] (see PRD § Open questions)

Next: run `/build-glossary` (if not done), then `/plan-epics` to break the PRD into epic issues.
```

---

## Handoff

> **PRD captured ✅** > `docs/PRD.md` written. <N> open questions flagged — address them before or during `/plan-epics`.
>
> Next:
>
> 1. `/build-glossary` (if first-time setup)
> 2. `/plan-epics` to break this PRD into epic-level work items
