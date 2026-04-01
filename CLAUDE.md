# BIRDLOG

Mobile-first Swedish birdwatching web app. All user-facing text in Swedish.

## Design Philosophy
Field guide, not a fitness tracker. No streaks, no gamification, no engagement hooks.
Focus on helping the user understand birds — rarity, migration, seasonal context.

## Testing
- Client: `npm run test --workspace=packages/client`
- Server: `npm run test --workspace=packages/server`
- E2E: `npm run test:e2e`
- TDD order: write failing test → implement → confirm passing

## Development Workflow
`/plan` → `/prd SLUG` → `/issues SLUG` → `/implement N` → `/review PR_N` → merge

Each phase runs fresh. Manual checkpoint between every phase. See `WORKFLOW.md` for full details.

Plan mode lenses: **UX** · **Technical** · **Data/API** · **Design/UI**
After plan discussion: run `/prd SLUG`.

## Docs
- `docs/prd/` — one PRD per feature (`_template.md` — do not delete)
- `GLOSSARY.md` — domain terms, appended by `/prd` only

## Deployment (TrueNAS SCALE)
- Host: TrueNAS SCALE, static IP `192.168.50.212`, user `henrik`
- Path: `/var/www/birdlog`
- SSH: password-based (no key auth — TrueNAS home dir restrictions)
- Auto-deploy: cron checks for new commits every 5 min
- SSL: wildcard cert via Nginx Proxy Manager
