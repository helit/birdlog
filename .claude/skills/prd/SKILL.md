---
name: prd
description: Write the approved PRD to disk and update GLOSSARY.md with new terms from the feature.
---

Usage: /prd FEATURE_SLUG

This skill runs after a /plan session has produced an approved PRD draft. It writes the PRD to disk and updates the glossary.

Steps:

1. Read `docs/prd/_template.md` to understand the required structure.
2. Read `GLOSSARY.md` to see what terms already exist.
3. Ask the user to confirm the feature slug (lowercase, hyphens only, no spaces — e.g., "date-range-filter").
4. Using the PRD draft from the current conversation, write the complete PRD to `docs/prd/FEATURE_SLUG.md` following the template structure exactly. Fill in all sections. If a section has nothing to say, write "None."
5. Identify all new terms from the PRD's "Glossary Updates" table that are not already in GLOSSARY.md.
6. Append each new term to the most relevant section of GLOSSARY.md using the format: `- **term** — one-sentence definition (Swedish UI label in parentheses if it differs from the English name)`
7. If no existing section fits a new term, add a new `##` heading.
8. Report: which file was written, and which terms were added to the glossary.

CHECKPOINT: Tell the user — "PRD written to docs/prd/FEATURE_SLUG.md. Glossary updated with [N] new terms. Review both files, then run `/issues FEATURE_SLUG` to create GitHub issues."

Do not proceed to create issues. Stop here and wait for the user.
