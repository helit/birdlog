# Development Workflow

How features go from idea to merged PR using Claude.

## The Five Phases

```
/plan  →  /prd SLUG  →  /issues SLUG  →  /implement N  →  /review PR_N  →  merge
```

Every phase boundary is a **manual checkpoint** — nothing auto-progresses. Each phase runs in a **fresh Claude context**. Artifacts (files, GitHub issues) carry context between phases, not conversation history.

---

## Phase 1: Plan (`/plan`)

Use the built-in `/plan` mode. Describe the feature. Claude evaluates it through four lenses:

- **UX** — What does the user actually do? Happy path? Confusing states?
- **Technical** — Feasibility, edge cases, what breaks?
- **Data/API** — Schema changes? New resolvers? External API calls?
- **Design/UI** — Mobile-first? Fits existing visual language? Swedish strings?

Output: a PRD draft in the conversation.

**Checkpoint:** You approve the draft, then run `/prd SLUG`.

---

## Phase 2: Write PRD (`/prd SLUG`)

Writes the approved PRD to `docs/prd/FEATURE_SLUG.md` using the template at `docs/prd/_template.md`. Also appends any new domain terms to `GLOSSARY.md`.

**Checkpoint:** Review `docs/prd/FEATURE_SLUG.md` and `GLOSSARY.md`, then run `/issues SLUG`.

---

## Phase 3: Create Issues (`/issues SLUG`)

Reads the PRD and creates labeled GitHub issues — one per implementable unit, ordered data layer first (schema → resolvers → client). Each issue contains:
- Acceptance criteria from the PRD
- Test requirements (Vitest and/or Playwright)
- A "Files to Read Before Starting" section — the key to context isolation

**Labels:** one scope (`client`/`server`/`shared`/`database`) + one type (`feature`/`bug`/`testing`/`dx`)

**Checkpoint:** Review issue list and ordering, then pick an issue and run `/implement N`.

---

## Phase 4: Implement (`/implement N`)

Reads the issue, linked PRD, `CLAUDE.md`, `GLOSSARY.md`, and the listed source files — then implements with TDD:

1. Write failing tests first
2. Confirm they fail
3. Implement
4. Confirm tests pass
5. Typecheck + lint
6. Open PR referencing the issue (`Closes #N`)

**Checkpoint:** PR review. Run `/review PR_N` when review comments arrive.

---

## Phase 5: Review (`/review PR_N`)

Reads the PR diff, all review comments, the linked issue, and PRD. Addresses each comment — code changes, inline replies, or flags conflicts with the PRD for you to decide. Pushes changes and replies to threads.

**Checkpoint:** You merge. Merge = done.

---

## How Context Isolation Works

A fresh Claude in Phase 4 has zero conversation history. It gets all needed context from this chain (read in order):

```
GitHub Issue → docs/prd/FEATURE_SLUG.md → CLAUDE.md → GLOSSARY.md → listed source files
```

The "Files to Read Before Starting" section in each issue is the critical piece — it names 2–4 specific source files containing the patterns to follow for that issue.

---

## Artifact Map

| What | Where | Written by |
|---|---|---|
| Project conventions | `CLAUDE.md` | You |
| Domain vocabulary | `GLOSSARY.md` | `/prd` skill |
| Feature requirements | `docs/prd/FEATURE_SLUG.md` | `/prd` skill |
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
