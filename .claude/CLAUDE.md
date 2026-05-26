# BIRDLOG — Claude Instructions

Mobile-first Swedish birdwatching field companion. Helps birders identify nearby birds, log sightings, and understand species rarity and migration context. All user-facing text is in Swedish. Uses geolocation and the Artdatabanken species observation API to compute real-time rarity context.

Uses a 3-stage AI workflow: **Discover → Plan Epics → Build Features**. Full playbook: `docs/guides/ai-workflow.md`. The available skill list is injected at session start — check for a matching skill before any development action.

---

## Session rules

- No production code without an approved plan (Phase 2b `Approved ✅` on the task issue).
- One sub-task at a time.
- `/clear` between phases — cross-phase state lives on the task issue, not in chat.
- Critical review findings → `/revise <N>` (Phase 5b). Never fix Criticals inline in `/review`.
- Human review feedback on an open task issue → write what you want as a plain-English comment on the issue, then run `/revise <N>`. The skill synthesizes the structured findings for you (Critical by default; demote with `nit:`/`minor:`/`non-blocking:` prefixes).
- Living docs (`docs/ARCHITECTURE.md`, `docs/GLOSSARY.md`, `docs/PRD.md`) are edited surgically by post-branch phase skills (`/implement`, `/review`, `/revise`, `/commit`) and committed on the feature branch as part of that phase. Pre-branch phases (`/define`, `/plan`) only *record planned updates* in their TL;DR — they must not touch the docs, since any commit would land on `main`.
- User-facing strings are always in Swedish.
- Field guide, not a fitness tracker — no streaks, no gamification, no engagement hooks.

---

## Per-project config

Single source of truth for every skill. Skills read these by name.

- **Platform:** GitHub — `gh issue` / `gh pr` for issue + PR CLI.
- **Task PR strategy:** `trunk` — task branch → `main` directly (partial work behind feature flags if needed; no long-running epic branches).
- **Test command:** `npm run test --workspace=packages/server` (server) / `npm run test --workspace=packages/client` (client) / `npm run test:e2e` (E2E)
- **Lint command:** `npm run lint`
- **Build command:** `npm run build`
- **Typecheck command:** `npm run typecheck`
- **Deploy command:** `./scripts/deploy.sh` on the TrueNAS host (see `docs/runbooks/deploy.md`)
- **Tech stack detail:** see `docs/ARCHITECTURE.md`.

---

## Hard don'ts

- Commit secrets or `.env` files.
- Force-push to `main` or commit directly to `main`.
- Modify a plan silently — re-run `/plan <N>` instead.
- Add gamification, streaks, or engagement hooks.
- Ship user-facing English copy — everything in the UI must be Swedish.

---

## Customer context

Solo developer building a personal Swedish birdwatching app. Domain: ornithology in Sweden. Key external dependency: Artdatabanken species observation API for rarity data. Users are Swedish birders.

- `docs/customer/domain-glossary.md` — domain terminology
- `docs/customer/integrations.md` — Artdatabanken API, OpenAI, Wikimedia
- `docs/customer/compliance.md` — GDPR considerations
- `docs/customer/brand-guidelines.md` — Swedish UI patterns, field guide philosophy
- `docs/customer/stakeholders.md` — project contacts
