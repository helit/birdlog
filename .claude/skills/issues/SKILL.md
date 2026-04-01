---
name: issues
description: Read an approved PRD and create labeled GitHub issues for the feature. Each issue is self-contained with full context for a fresh Claude to implement it.
---

Usage: /issues FEATURE_SLUG

This skill runs in a fresh context. It reads only from artifacts — no prior conversation history required.

Bootstrap sequence (run before creating any issues):
1. Read `docs/prd/FEATURE_SLUG.md` in full.
2. Read `CLAUDE.md` — understand project structure, test commands, conventions.
3. Read `GLOSSARY.md` — understand domain terms.

Decomposition rules:
- Each issue must be implementable in a single focused PR.
- Order issues so data layer comes before API layer, which comes before UI layer: schema/migration → resolvers/typeDefs → client queries/mutations → client components/pages.
- Every issue must have explicit acceptance criteria and test requirements copied from the PRD.
- Every issue must link back to the PRD.
- Every issue must include a "Files to Read Before Starting" section listing 2–4 specific source files that contain the patterns the implementer should follow.

For each issue, create it using:
```
gh issue create \
  --title "TITLE" \
  --body "BODY" \
  --label "LABEL1,LABEL2"
```

Label selection:
- Scope: `client` | `server` | `shared` | `database`
- Type: `feature` | `bug` | `testing` | `dx`
- Use one scope label + one type label per issue. Add `database` if there are schema changes.

Issue body format — use the structure from `.github/ISSUE_TEMPLATE/feature-task.md`:
- Summary (one sentence)
- PRD link
- Dependency on prior issue (if any)
- Acceptance Criteria (Given/when/then, copied from PRD for this issue's scope)
- Test Requirements (Vitest and/or Playwright, specific not vague)
- Implementation Hints (key files to modify, pattern to follow)
- Files to Read Before Starting (MUST include: docs/prd/FEATURE_SLUG.md, CLAUDE.md, GLOSSARY.md, plus 2–4 relevant source files)
- Definition of Done checklist

After all issues are created, list them with their numbers, titles, and labels.

CHECKPOINT: Tell the user — "X issues created. Review them at https://github.com/[owner]/[repo]/issues and verify the ordering makes sense before starting implementation. Pick an issue and run `/implement ISSUE_NUMBER`."

Do not begin implementation. Stop here and wait for the user.
