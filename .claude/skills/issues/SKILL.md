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

**Size: match the feature, not a formula.**
If the feature is small (one screen, one user action, one data change), create one issue. Do not split small features into separate layer issues. A feature with 3 acceptance criteria is probably one issue. A feature with 12 acceptance criteria across multiple screens probably needs 3–4 issues.

**Each issue must be a testable vertical slice.**
A vertical slice means: enough of the stack is implemented that the behavior can be verified — by a test, by a PR reviewer, or both. Ask yourself: "Could a reviewer open this PR and confirm it does something real?" If not, the issue is too thin — combine it with the issue that gives it meaning.

Bad decomposition: "Create `FilterSheet.tsx` component (no wiring)" → untestable, no observable behavior.
Good decomposition: "User can filter sightings by species" → includes the component, the wiring, the state, and the tests.

**Infrastructure issues are OK when independently testable.**
A DB migration issue is fine if it has its own test coverage (e.g., migration runs cleanly, schema constraints hold). A standalone "create file with no behavior" issue is not.

**Ordering: dependency-driven, not layer-driven.**
Order issues so each one can be implemented without depending on an unfinished issue. If a schema change is required before the API, that comes first. But do not create a separate issue just to add a UI component if that component is only meaningful when wired into the feature.

**Reusable utilities are the exception.**
A new shared utility (e.g., a sort function, a generic bottom sheet component) may warrant its own issue if it has independent unit tests and will be reused. Do not create separate issues for components that exist only for this feature.

Every issue must have:
- Explicit acceptance criteria copied from the PRD for this issue's scope
- Specific test requirements (name the test file and what it asserts — never "add unit tests")
- A link back to the PRD
- A "Files to Read Before Starting" section listing 2–4 specific source files with the patterns to follow

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
