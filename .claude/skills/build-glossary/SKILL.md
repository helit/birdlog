---
name: build-glossary
description: Stage 1 discovery skill — scans code + PRD + ARCHITECTURE to extract domain terms and produce or refresh docs/GLOSSARY.md. Use when starting a new engagement, when new domain terms land in the PRD, or when the glossary drifts from code reality.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Build Glossary Skill — Stage 1 of 3

You are running **Stage 1: Discovery — Glossary**. Your job: produce or refresh `docs/GLOSSARY.md` with project-specific terminology so anyone (human or agent) joining mid-flight has a fast reference.

## Core Principle

A good glossary captures **project-specific** terms — domain nouns, acronyms, internal names — NOT generic programming terminology. If the term would be understandable to any senior engineer reading the code cold, it doesn't belong here.

## Anti-Rationalization Guards

- "I'll add React, TypeScript, JSON to the glossary" → No. Generic tech terms don't belong. Only project-specific vocabulary.
- "This class name looks like a domain term, I'll add it" → Only if it encodes a concept not obvious from the name alone. Ask the user before adding ambiguous candidates.
- "The existing glossary looks fine, I'll skip" → No. Run the scan anyway; the diff may be empty, which is a valid outcome worth reporting.
- "I'll rewrite the definitions to be more concise" → No. Preserve user-authored definitions. Only edit when the definition is factually wrong.

---

## Step 1 — Gather Sources

Read (do not write):

- `docs/PRD.md` if it exists — domain terms live here
- `docs/ARCHITECTURE.md` if it exists — component/service names worth defining
- Existing `docs/GLOSSARY.md` if it exists — baseline to diff against

Scan code for candidate terms:

```bash
# Uncommon nouns and project names in the source
rg -oh '\b[A-Z][a-zA-Z]{3,}\b' --type-not json | sort -u | head -200

# Acronyms (2-5 uppercase letters)
rg -oh '\b[A-Z]{2,5}\b' --glob '!*.json' --glob '!*.lock' | sort -u | head -100
```

Look for terms that appear in:

- Module/class/type names that encode a domain concept (e.g. `LedgerEntry`, `OnboardingFunnel`)
- Constants, enums, feature flag names
- Test names and fixture files

---

## Step 2 — Build Candidate List

Produce a three-bucket candidate list:

1. **Already in glossary, still accurate** — no action
2. **Already in glossary, no longer used in code** — propose removal
3. **New candidates** — not yet defined, appear multiple times in code or docs

For each new candidate, propose:

- The term
- A provisional definition (from context)
- Evidence (file paths where it's used)
- **Confidence**: High (definition is obvious from context) / Low (need user input)

---

## Step 3 — Batched Interview

Present the candidate list to the user in one batch. Structure:

```
## Glossary candidates

### Proposed additions
1. **<TERM>** — <provisional definition>. Seen in: <file:line>, <file:line>. Confidence: High/Low.
   [High confidence: "Confirm or correct"]
   [Low confidence: "What does this mean in your domain?"]
2. ...

### Proposed removals (no longer in code)
- <TERM> — last seen: <git context>. Remove? (yes/no/keep-historical)

### Unchanged
- <count> terms unchanged.
```

Collect all user responses, then move on. Do not ask one question at a time.

---

## Step 4 — Write

Write `docs/GLOSSARY.md` as an alphabetised term → definition reference:

```markdown
# Glossary

> Living document. Updated by `/build-glossary` and during phase runs when new domain terms land. Last reconciled: YYYY-MM-DD.

## A

**<Term>** — <definition in 1–3 sentences>. _See also: <Other Term>._

## B

...
```

Rules:

- Alphabetical by term
- Group under single-letter headings (## A, ## B, ...)
- Each definition 1–3 sentences, no longer
- Cross-references with `_See also: <Term>_` when relevant
- Acronyms get their expansion in bold: **PRD** — Product Requirements Document. <definition>.

---

## Step 5 — TL;DR Summary

Print:

```
## /build-glossary — TL;DR
Date: YYYY-MM-DD
Added: [list of terms]
Edited: [list]
Removed: [list]
Unchanged: <count>

Next: run `/plan-epics` to start epic-level planning, or continue your in-flight work.
```

---

## Handoff

> **Glossary reconciled ✅** > `docs/GLOSSARY.md` now has <N> terms.
>
> Phase skills will add new terms automatically during `/implement` and `/review`. Re-run this skill when you want a full re-scan (typically after a major feature ships).
