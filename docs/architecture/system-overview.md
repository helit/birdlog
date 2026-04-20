# System Overview — BirdLog

## Tech Stack

| Layer | Technology |
|---|---|
| Language / Runtime | TypeScript 5.6 + Node.js |
| Frontend | React 18 + Vite 6 + TailwindCSS 4 + Apollo Client 3 |
| Routing | react-router-dom v7 |
| UI Components | shadcn/ui + Base UI |
| Backend | Express 4 + Apollo Server 4 (GraphQL) |
| ORM / Database | Prisma 6 + PostgreSQL |
| Unit / Integration Tests | Vitest |
| E2E Tests | Playwright |
| Linter | ESLint 9 + typescript-eslint |
| Formatter | Prettier 3 |

## Architecture

BirdLog is a TypeScript monorepo with a React SPA frontend and a Node.js GraphQL backend, backed by PostgreSQL.

```
packages/
  client/   React 18 + Vite + Apollo Client (GraphQL) + TailwindCSS 4
  server/   Express + Apollo Server 4 (GraphQL) + Prisma ORM → PostgreSQL
```

## Request Flow

```
Browser → React SPA → Apollo Client (GraphQL) → Express/Apollo Server → Prisma → PostgreSQL
                                                         ↓
                                              Artdatabanken API (rarity)
                                              OpenAI API (photo/guided ID)
                                              Wikimedia API (species images)
```

## Key Components

### Client (`packages/client/src/`)

- `pages/` — route-level components (IdentifyPage, SightingsPage, BirdInfoPage, etc.)
- `components/` — shared UI (Button, BottomSheet, HeroCard, etc.)
- `graphql/` — Apollo Client setup, queries, mutations
- `hooks/` — custom React hooks

### Server (`packages/server/src/`)

- `schema.ts` — GraphQL schema definition
- `resolvers/` — query and mutation resolvers
- `services/` — business logic (rarity calculation, species enrichment, caching)
- `middleware/` — auth, rate limiting, CORS, compression

### Database (`packages/server/prisma/`)

- `schema.prisma` — Prisma schema (User, Species, Sighting)
- `migrations/` — Prisma migration history

## External Integrations

| System                | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| Artdatabanken SOS API | Species observation data for rarity context      |
| OpenAI GPT-4o         | Photo ID (vision) and guided ID (text)           |
| Wikimedia API         | Species images (proxied through server for CORS) |

## Design Principles

- Mobile-first: all UI designed for portrait phone
- Offline-tolerant: graceful degradation when API is unavailable
- Swedish-first: all user-facing text in Swedish
- Field guide philosophy: no gamification, no streaks, no engagement hooks
- Rarity context from real observation data, not static lists

## Deployment

- Host: TrueNAS SCALE at `192.168.0.10`
- Path: `/var/www/birdlog`
- SSL: wildcard cert via Nginx Proxy Manager
- Auto-deploy: cron polling for new commits every 5 min
