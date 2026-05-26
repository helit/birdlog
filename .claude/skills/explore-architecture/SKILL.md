---
name: explore-architecture
description: Stage 1 discovery skill — scans the repo to generate or refresh docs/ARCHITECTURE.md. Use when starting a new engagement, after significant structural changes, or when ARCHITECTURE.md has drifted from reality. Proposes diffs section-by-section and asks for approval before writing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Explore Architecture Skill — Stage 1 of 3

You are running **Stage 1: Discovery — Architecture** of the AI workflow. Your single job: produce or refresh `docs/ARCHITECTURE.md` so it accurately reflects the current repo.

## Core Principle

`docs/ARCHITECTURE.md` is a **living document**. Every run of this skill is a reconciliation: what changed in the repo, what's obsolete in the doc, what's genuinely new. You never rewrite it from scratch if a version already exists — you diff and patch.

## Anti-Rationalization Guards

- "I'll just regenerate the whole file, it's faster" → No. If `docs/ARCHITECTURE.md` exists, diff-and-patch. Preserving human edits matters.
- "The repo is mostly empty, I'll skip the scan" → No. Even greenfield projects have a tech stack (language, package manager, at minimum). Always scan.
- "The user said 'looks good', let's move on" → If you proposed 3+ changes in one batch, confirm each explicitly.
- "I can infer the domain model from file names" → No. Architecture = structure + tech stack + data flow + integrations. Don't guess domain — that belongs in `docs/GLOSSARY.md` (run `/build-glossary`).

---

## Step 1 — Scan the Repo

Build a factual inventory. Do NOT write anything yet.

```bash
# Top-level layout
ls -la

# Language & package manager signals
ls package.json pyproject.toml Cargo.toml go.mod Gemfile composer.json 2>/dev/null

# Source layout
find . -type d -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*' -not -path './.next/*' -maxdepth 3

# Config files
find . -maxdepth 2 -type f \( -name '*.json' -o -name '*.yaml' -o -name '*.yml' -o -name '*.toml' -o -name 'Dockerfile' -o -name 'Makefile' \) -not -path './node_modules/*' -not -path './.git/*'
```

Read (not write) the following if present:

- `package.json` / `pyproject.toml` / equivalent — dependencies, scripts
- `README.md` — any existing system description
- `docs/ARCHITECTURE.md` — current living doc (if this isn't the first run)
- Any `Dockerfile`, `docker-compose.yml`, `*.tf`, deployment manifests
- Entry-point files (e.g. `src/main.*`, `src/index.*`, `app/main.py`)

---

## Step 2 — Classify Findings

Organise what you found into the six canonical sections. For each section, note what's new, what's unchanged, and what in the existing doc no longer matches reality.

### Target sections

1. **Tech Stack** — language(s), runtime, frameworks, package manager, build/test/lint commands
2. **System Overview** — 1–3 paragraph description of what this codebase is and how its major pieces interact
3. **Components** — top-level modules/services/packages with one-line purpose each
4. **Data Flow** — how a request/event moves through the system (bullet or mermaid)
5. **External Integrations** — APIs, databases, queues, third-party services
6. **Compliance & Security Notes** — auth model, data classification, known regulatory constraints (carry forward from prior doc or ask user)

If a section has zero findings for a greenfield project, write a one-line placeholder: `_Not yet applicable — update when [trigger]._`

---

## Step 3 — Propose Diff Per Section

If `docs/ARCHITECTURE.md` does not exist, present the full proposed content section-by-section. Ask approval per section.

If `docs/ARCHITECTURE.md` exists, for each section show:

- **Unchanged:** [brief summary]
- **Add:** [new content]
- **Remove:** [content no longer accurate + why]
- **Edit:** [before → after]

Ask per section: _"Apply this change? (yes / edit / skip)"_

Batch same-section edits together. Do not ask 20 tiny questions — 1 question per section.

---

## Step 4 — Write

After all sections are confirmed, write the updated `docs/ARCHITECTURE.md`. Structure:

```markdown
# Architecture

> Living document. Updated by `/explore-architecture` and during phase runs. Last reconciled: YYYY-MM-DD.

## Tech Stack

<content>

## System Overview

<content>

## Components

<content>

## Data Flow

<content>

## External Integrations

<content>

## Compliance & Security Notes

<content>
```

---

## Step 5 — TL;DR Summary

Print a short terminal summary so the human has an audit trail:

```
## /explore-architecture — TL;DR
Date: YYYY-MM-DD
Sections added: [list]
Sections updated: [list]
Sections removed: [list]
No changes: [list]

Next (if greenfield): /define-prd to capture product scope, then /build-glossary.
Next (if refreshing): run again after the next major structural change.
```

---

## Handoff

Tell the user:

> **Architecture doc reconciled ✅** > `docs/ARCHITECTURE.md` now reflects the current repo.
>
> Next steps:
>
> - First-time setup: run `/define-prd` then `/build-glossary`.
> - Returning user: continue with your in-flight epic (`/define <epic#>`) or plan new ones (`/plan-epics`).
