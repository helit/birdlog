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

`/define` → `/spec N` → `/implement N` → `/test N` → `/review N` → `/commit N` → merge

Each phase runs fresh. Manual checkpoint between every phase. See `docs/guides/ai-workflow.md` and `.claude/CLAUDE.md` for full details.

## Docs

- `docs/prd/` — PRDs for past features; new features use `docs/specs/` (see SDD workflow)
- `docs/specs/` — one approved spec per feature (`TEMPLATE-spec.md`)
- `GLOSSARY.md` — domain terms (canonical)

## Deployment (TrueNAS SCALE)

- Host: TrueNAS SCALE, static IP `192.168.0.10`, user `henrik`
- Path: `/var/www/birdlog`
- SSH: password-based (no key auth — TrueNAS home dir restrictions)
- Auto-deploy: cron checks for new commits every 5 min
- SSL: wildcard cert via Nginx Proxy Manager
