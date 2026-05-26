# Architecture — BirdLog

> Living document. Updated by `/explore-architecture` and during phase runs. Last reconciled: 2026-05-26.

## Tech Stack

| Layer | Technology |
|---|---|
| Language / Runtime | TypeScript 5.6 + Node.js 20 |
| Frontend | React 18 + Vite 6 + TailwindCSS 4 + Apollo Client 3 |
| Routing | react-router-dom v7 |
| UI Components | shadcn/ui + Base UI |
| Maps | Leaflet 1.9 + react-leaflet 4 |
| Backend | Express 4 + Apollo Server 4 (GraphQL) |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |
| Server hardening | helmet, compression, morgan, express-rate-limit |
| AI SDK | openai (Node SDK) for photo + guided identification |
| ORM / Database | Prisma 6 + PostgreSQL 15 |
| Unit / Integration Tests | Vitest |
| E2E Tests | Playwright |
| Linter | ESLint 9 + typescript-eslint |
| Formatter | Prettier 3 |

## System Overview

BirdLog is a TypeScript monorepo with a React SPA frontend and a Node.js GraphQL backend, backed by PostgreSQL.

```
packages/
  client/   React 18 + Vite + Apollo Client (GraphQL) + TailwindCSS 4
  server/   Express + Apollo Server 4 (GraphQL) + Prisma ORM → PostgreSQL
  shared/   Cross-package types and helpers
```

## Components

### Client (`packages/client/src/`)

- `pages/` — route-level components (IdentifyPage, SightingsPage, BirdInfoPage, Fågelbok, etc.)
- `components/` — shared UI (BottomNav, RarityBadge, SightingCard, SightingMap, `ui/` shadcn primitives, etc.)
- `graphql/` — Apollo Client setup, queries, mutations
- `context/` — React contexts (AuthContext)
- `lib/` — utility helpers (rarity colours, sort helpers, guidebook search state)
- `utils/` — shared TypeScript types

### Server (`packages/server/src/`)

- `schema/` — GraphQL `typeDefs` and `resolvers`
- `services/` — business logic (rarity calculation, species enrichment, Artdatabanken integration, OpenAI identification)
- `middleware/` — auth (JWT context loader)
- `backfill/` — one-off backfill helpers (taxonomy-core)
- `data/` — static data (Swedish taxonomy fallbacks, etc.)
- `utils/` — pure helpers (normalize, slug, error classification)

### Database (`packages/server/prisma/`)

- `schema.prisma` — Prisma schema (User, Species, Sighting, AreaDistributionCache)
- `migrations/` — Prisma migration history
- `backfill-taxonomy.ts` — one-off backfill for the Fågelbok taxonomy columns
- See also: [`docs/architecture/data-model.md`](architecture/data-model.md) for entity-level detail.

## Data Flow

```
Browser → React SPA → Apollo Client (GraphQL) → Express/Apollo Server → Prisma → PostgreSQL
                                                         ↓
                                              Artdatabanken API (rarity)
                                              OpenAI API (photo/guided ID)
                                              Wikimedia API (species images)
```

## External Integrations

| System                | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| Artdatabanken SOS API | Species observation data for rarity context      |
| OpenAI GPT-4o         | Photo ID (vision) and guided ID (text)           |
| Wikimedia API         | Species images (proxied through server for CORS) |

See [`docs/customer/integrations.md`](customer/integrations.md) for API keys, rate limits, and contract details.

## Design Principles

- **Mobile-first** — all UI designed for portrait phone
- **Offline-tolerant** — graceful degradation when API is unavailable
- **Swedish-first** — all user-facing text in Swedish
- **Field guide philosophy** — no gamification, no streaks, no engagement hooks
- **Rarity context from real observation data** — not static lists

## Compliance & Security Notes

- GDPR considerations documented in [`docs/customer/compliance.md`](customer/compliance.md)
- JWT-based authentication; user passwords stored as bcrypt hashes
- `helmet` sets security headers in production (CSP enabled in prod, disabled in dev so Vite HMR works)
- General `/api` + `/graphql` rate limit: 100 req/min/IP; stricter `/api/identify` limit: 10 req/min/IP (caps OpenAI cost)
- Server-side image proxy avoids exposing Wikimedia URLs directly to the client (CORS + caching)
- Server fails fast on missing required env vars (`JWT_SECRET`, `OPENAI_API_KEY`, `ARTDATABANKEN_API_KEY`)
- Server reads secrets from `packages/server/.env`; never commit `.env*` files (gitignored)

## Deployment

- **Host:** TrueNAS SCALE at `192.168.0.10`, path `/var/www/birdlog`
- **SSL:** wildcard cert via Nginx Proxy Manager
- **Manual deploy:** `ssh henrik@192.168.0.10`, then `cd /var/www/birdlog && ./scripts/deploy.sh`
- **Full runbook:** [`docs/runbooks/deploy.md`](runbooks/deploy.md)

Migrations apply on container start (Dockerfile CMD). One-off jobs (backfills, etc.) run manually via `sudo docker compose exec app ...`.

## Architecture Decision Records

ADRs live in [`docs/architecture/adr/`](architecture/adr/).
