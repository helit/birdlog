# BIRDLOG

Mobile-first Swedish birdwatching web app. All user-facing text in Swedish.

## Design Philosophy

Field guide, not a fitness tracker. No streaks, no gamification, no engagement hooks.
Focus on helping the user understand birds — rarity, migration, seasonal context.

## Testing

- Client: `npm run test --workspace=packages/client`
- Server: `npm run test --workspace=packages/server`
- E2E: `npm run test:e2e`
- TDD order: write failing test → implement → confirm passing.

## Development Workflow

3-stage AI workflow: **Discover → Plan Epics → Build Features**. Per-task loop:

```
/define <epic#> → /plan <N> → /review-plan <N> → /implement <N>
                → /test <N> → /review <N> → /revise <N> (if needed) → /commit <N>
```

`/clear` between every phase — cross-phase state lives on the task issue, not in chat. Full playbook: [`docs/guides/ai-workflow.md`](docs/guides/ai-workflow.md). Per-project config + session rules: [`.claude/CLAUDE.md`](.claude/CLAUDE.md). Agent rules: [`AGENTS.md`](AGENTS.md).

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — tech stack, components, data flow (canonical, living doc)
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — domain terms (canonical, living doc)
- [`docs/PRD.md`](docs/PRD.md) — product requirements (living doc; run `/define-prd` to populate)
- [`docs/customer/`](docs/customer/) — domain knowledge, integrations, compliance, brand
- [`docs/runbooks/`](docs/runbooks/) — operational runbooks (deploy, feature rollouts)
- [`docs/architecture/`](docs/architecture/) — data-model, ADRs (supplementary to `ARCHITECTURE.md`)
- [`docs/specs/`](docs/specs/), [`docs/prd/`](docs/prd/) — historical artefacts from the pre-3-stage workflow (kept for reference)

## Deployment (TrueNAS SCALE)

- Host: TrueNAS SCALE at `192.168.0.10`, user `henrik`
- Path: `/var/www/birdlog`
- SSH: password-based (no key auth — TrueNAS home dir restrictions)
- Manual deploy: SSH to host, `cd /var/www/birdlog && ./scripts/deploy.sh` — full runbook at [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md)
- SSL: wildcard cert via Nginx Proxy Manager
