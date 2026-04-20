# Developer Onboarding — BirdLog

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (for local PostgreSQL)
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
- GitHub CLI (`gh auth login`)
- API keys: Artdatabanken (api-portal.artdatabanken.se), OpenAI (platform.openai.com)

## Setup

```bash
# Clone the repo
git clone https://github.com/helit/birdlog.git
cd birdlog

# Install dependencies
npm install

# Start local database
docker compose up -d

# Configure environment
cp packages/server/.env.example packages/server/.env
# Fill in: DATABASE_URL, ARTDATABANKEN_API_KEY, OPENAI_API_KEY, JWT_SECRET

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start dev servers (client + server)
npm run dev
```

Client runs at http://localhost:5173, GraphQL API at http://localhost:4000/graphql.

## First Things to Read

1. `CLAUDE.md` (root) — project overview and development workflow
2. `.claude/CLAUDE.md` — AI agent configuration and SDD workflow
3. `docs/architecture/system-overview.md` — system design
4. `docs/customer/domain-glossary.md` — birdwatching terminology
5. `GLOSSARY.md` — domain terms canonical reference

## Running Tests

```bash
npm run test --workspace=packages/client   # unit tests
npm run test --workspace=packages/server   # unit tests
npm run test:e2e                           # Playwright E2E
npm run typecheck                          # TypeScript
npm run lint                              # ESLint
```

## Deployment

Deployed to TrueNAS SCALE at `192.168.50.212` via auto-deploy cron. SSH as `henrik` (password auth). See `CLAUDE.md` for deployment details.
