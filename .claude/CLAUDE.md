# BIRDLOG — Claude Instructions

## Project

Mobile-first Swedish birdwatching field companion. Helps birders identify nearby birds, log sightings, and understand species rarity and migration context. All user-facing text is in Swedish. Uses geolocation and the Artdatabanken species observation API to compute real-time rarity context.

**Uses Spec-Driven Development (SDD).** Every feature starts with an approved spec. No code without a spec.

---

## Key Files

- `docs/architecture/system-overview.md` — read before structural changes
- `docs/specs/` — one approved spec per feature
- `docs/customer/` — domain knowledge, glossary, compliance
- `docs/guides/ai-workflow.md` — team workflow playbook
- `GLOSSARY.md` — domain terms (canonical; appended by `/pitch` only)

---

## Tech Stack

**Language:** TypeScript (strict mode, both client and server)
**Frontend:** React 18 + Vite 6 + TailwindCSS 4 + Apollo Client (GraphQL) + react-router-dom v7 + shadcn/ui components
**Backend:** Node.js + Express + Apollo Server 4 (GraphQL) + Prisma 6 ORM
**Database:** PostgreSQL (Prisma migrations in `packages/server/prisma/`)
**Test runner:** Vitest (unit/integration), Playwright (E2E)
**Build:** `npm run build`
**Test:** `npm run test --workspace=packages/client` / `npm run test --workspace=packages/server` / `npm run test:e2e`
**Lint:** `npm run lint`
**Typecheck:** `npm run typecheck`

---

## Skills

Check for a matching skill before every development action. Use the `Skill` tool.

| Command | When |
|---|---|
| `/initiate-project` | Once per engagement — scaffold + configure |
| `/define` | New feature — Phase 1 |
| `/spec <N>` | Phase 2 — after `/define` |
| `/implement <N>` | Phase 3 — after `/spec` |
| `/test <N>` | Phase 4 — after `/implement` |
| `/review <N>` | Phase 5 — after `/test` |
| `/commit <N>` | Phase 6 — after `/review` |
| `fix-bug` | Any bug or unexpected behavior |
| `test-driven-development` | Writing any code |
| `verification-before-completion` | Before claiming done |
| `git-commit-helper` | Before `git commit` |

Run `/clear` between phases. State stored in the issue tracker (see Version Control section).

---

## Rules

1. Read the spec before writing code.
2. One task at a time — never a full feature in one pass.
3. Failing test before implementation (TDD).
4. Do not modify specs — flag issues for human review.
5. Do not skip review — dispatch the `code-reviewer` agent.
6. Fresh test + lint required before any "done" claim.

---

## Guards

- Skip the spec for small features → **No.**
- Write tests after (they "take too long") → **No.**
- Last test run passed, skip re-run → **No.**
- Fix bug + improve surrounding code → **No.** Fix only.
- Know root cause, skip failing test → **No.**
- Spec says X, but Y is better → **Flag it.** Don't change the spec.

---

## Code Style

- TypeScript strict — no `any`, no implicit returns, explicit types at boundaries
- Named exports only — no default exports
- Async/await over `.then()` chains
- React components in `packages/client/src/components/` — PascalCase filenames
- GraphQL resolvers in `packages/server/src/resolvers/`
- Follow existing patterns — no new abstractions without reason
- Prefer explicit over clever; functions small and single-purpose
- User-facing strings always in Swedish

---

## Git

- Branch: `feat/<spec-slug>` from `main`
- Conventional Commits — use `git-commit-helper`
- PRs link to the spec; never force-push or commit directly to `main`

## Version Control

- **Platform:** GitHub
- **Issue CLI:** `gh issue`
- **PR CLI:** `gh pr create`

---

## Do Not

- Write code without an approved spec
- Implement multiple tasks in one step
- Create files not required by the spec
- Add abstractions, error handling, or features not in the spec
- Commit secrets or `.env` files
- Add gamification, streaks, or engagement hooks (field guide, not fitness tracker)

---

## Customer Context

Solo developer building a personal Swedish birdwatching app. Domain: ornithology in Sweden. Key external dependency: Artdatabanken species observation API for rarity data. Users are Swedish birders.

- `docs/customer/domain-glossary.md` — domain terminology
- `docs/customer/integrations.md` — Artdatabanken API, OpenAI, Wikimedia
- `docs/customer/compliance.md` — GDPR considerations
- `docs/customer/brand-guidelines.md` — Swedish UI patterns, field guide philosophy
- `docs/customer/stakeholders.md` — project contacts
