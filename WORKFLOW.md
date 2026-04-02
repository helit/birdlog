# Development Workflow

How features and bugs go from idea to merged PR using Claude.

## The Four Phases

```
/pitch  →  /issues SLUG  →  /implement N  →  /review PR_N  →  merge
```

Every phase boundary is a **manual checkpoint** — nothing auto-progresses. Each phase runs in a **fresh Claude context**. Artifacts (files, GitHub issues) carry context between phases, not conversation history.

---

## Phase 1: Pitch (`/pitch`)

Describe what you want — a feature, a bug, an enhancement, anything. Claude:

1. Classifies the request (feature / bug / enhancement / refactor / dx)
2. Explores the codebase silently to answer what it can without asking you
3. Interviews you top-down: problem framing → scope → architecture → details → edge cases
4. Runs a final challenge round on things that are easy to miss (Swedish strings, mobile edge cases, empty states, TDD readiness)
5. Writes the PRD to `docs/prd/FEATURE_SLUG.md` and updates `GLOSSARY.md`

Templates:
- `docs/prd/_template_feature.md` — for features, enhancements, refactors, dx
- `docs/prd/_template_bug.md` — for bugs

**Checkpoint:** Review `docs/prd/FEATURE_SLUG.md` and `GLOSSARY.md`, then run `/issues FEATURE_SLUG`.

---

## Phase 2: Create Issues (`/issues SLUG`)

Reads the PRD and creates labeled GitHub issues — one per implementable unit, ordered data layer first (schema → resolvers → client). Each issue contains:
- Acceptance criteria from the PRD
- Test requirements (Vitest and/or Playwright)
- A "Files to Read Before Starting" section — the key to context isolation

**Labels:** one scope (`client`/`server`/`shared`/`database`) + one type (`feature`/`bug`/`testing`/`dx`)

**Checkpoint:** Review issue list and ordering, then pick an issue and run `/implement N`.

---

## Phase 3: Implement (`/implement N`)

Reads the issue, linked PRD, `CLAUDE.md`, `GLOSSARY.md`, and the listed source files — then implements with TDD:

1. Write failing tests first
2. Confirm they fail
3. Implement
4. Confirm tests pass
5. Typecheck + lint
6. Open PR referencing the issue (`Closes #N`)

**Checkpoint:** PR review. Run `/review PR_N` when review comments arrive.

---

## Phase 4: Review (`/review PR_N`)

Reads the PR diff, all review comments, the linked issue, and PRD. Addresses each comment — code changes, inline replies, or flags conflicts with the PRD for you to decide. Pushes changes and replies to threads.

**Checkpoint:** You merge. Merge = done.

---

## How Context Isolation Works

A fresh Claude in Phase 3 has zero conversation history. It gets all needed context from this chain (read in order):

```
GitHub Issue → docs/prd/FEATURE_SLUG.md → CLAUDE.md → GLOSSARY.md → listed source files
```

The "Files to Read Before Starting" section in each issue is the critical piece — it names 2–4 specific source files containing the patterns to follow for that issue.

---

## Artifact Map

| What | Where | Written by |
|---|---|---|
| Project conventions | `CLAUDE.md` | You |
| Domain vocabulary | `GLOSSARY.md` | `/pitch` skill |
| Feature requirements | `docs/prd/FEATURE_SLUG.md` | `/pitch` skill |
| Single-issue scope | GitHub issue body | `/issues` skill |

---

## Portability

This workflow is designed to be generic. After testing on 2–3 Birdlog features, extract as a template repo:

- Skills reference `CLAUDE.md` for all project-specific details (stack, test commands, patterns)
- No hardcoded paths or tech stack assumptions in skill files
- New project = copy skills + fill in `CLAUDE.md` + create labels

---

## E2E Testing (Playwright)

- Config: `packages/client/playwright.config.ts`
- Auth setup: `packages/client/e2e/auth.setup.ts`
- Credentials: `E2E_EMAIL` / `E2E_PASSWORD` env vars (defaults: `test@birdlog.test` / `test-password`)
- Test user is seeded via `npm run db:seed`
- Run: `npm run test:e2e`
