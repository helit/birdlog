# BIRDLOG — Claude Project Context

Last updated: 2026-03-12
Current phase: Phase 3 — Sighting Log [IN PROGRESS]

## About

Mobile-first Swedish birdwatching web app. Portfolio project to refresh backend skills.
Repo: https://github.com/helit/birdlog

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Apollo Client 3, Tailwind CSS 4, shadcn/ui
- Backend: Node.js, Apollo Server 4, GraphQL, Express
- Database: PostgreSQL + PostGIS via Docker Compose
- ORM: Prisma
- Auth: bcrypt + jsonwebtoken (JWT)
- Monorepo: npm workspaces (packages/client, packages/server, packages/shared)
- ES modules throughout ("type": "module" — imports use .js extension)
- Dev server: tsx watch

## How to Run

```
docker compose up -d
npm run dev              # runs both client + server from root
```
- Server: http://localhost:4000/graphql (Apollo Sandbox)
- Client: http://localhost:5173

## Project Phases

1. Scaffolding & database                    [DONE]
2. Authentication                            [DONE]
3. Sighting log — CRUD, geolocation, life list [IN PROGRESS]
4. PWA & offline basics
5. Artdatabanken API integration
6. AI bird identification (Claude API)
7. Notifications & alerts (Web Push)
8. Polish & portfolio prep

## Phase Gate Rule

Before moving from one phase to the next, give the user a mini quiz (5–8 questions)
covering the key concepts from the completed phase. Mix question types: multiple choice,
short answer, and "what would happen if…" scenarios. The user must demonstrate understanding
before proceeding. This reinforces learning and ensures concepts stick.

## Phase 3 Progress — Sighting Log

### Step 1: Extend GraphQL typeDefs [DONE]
- Added to Query: `mySightings: [Sighting!]!`
- Added mutations: `createSighting`, `updateSighting` (partial update), `deleteSighting`
- `createSighting` args: speciesId, latitude, longitude, location?, notes?, date
- `updateSighting` args: id (required), all others optional for partial updates
- `deleteSighting` returns `Boolean!`

### Step 2: Implement resolvers [IN PROGRESS]
- `mySightings` query: done — requireAuth, findMany filtered by userId, includes species
- `createSighting` mutation: done — requireAuth, prisma.sighting.create with new Date(date), includes species
- `updateSighting` mutation: TODO — needs ownership check (sighting.userId === user.id)
- `deleteSighting` mutation: TODO — needs ownership check

### Step 3: Client GraphQL operations
### Step 4: Sighting form page (species picker, date, geolocation, notes)
### Step 5: Sightings list page (view, edit, delete)
### Step 6: Life list page (unique species seen)
### Step 7: Navigation/routing (react-router)

## Completed Phases

### Phase 2 — Authentication
- Server: JWT auth middleware (auth.ts), register/login mutations, me query
- Client: Apollo auth link, AuthProvider context, Login/Register pages
- Auth gating in App.tsx, localStorage token persistence

### Phase 1 — Scaffolding & Database
- Prisma schema: User, Species, Sighting models
- PostgreSQL + PostGIS via Docker Compose
- Apollo Server + Express setup
- Species queries (list, search, byId)

## Styling

- Tailwind CSS 4 + shadcn/ui component library
- shadcn components used: Button, Input, Label, Card
- Path alias: @/* → ./src/* (vite.config.ts + tsconfig.json)
- shadcn config: packages/client/components.json

## Key Files

### Server
- `packages/server/src/middleware/auth.ts` — JWT auth middleware (AuthUser, GraphQLContext, generateToken, getContextUser, requireAuth)
- `packages/server/src/schema/typeDefs.ts` — GraphQL schema
- `packages/server/src/schema/resolvers.ts` — Query + Mutation resolvers
- `packages/server/src/index.ts` — Express + Apollo Server setup
- `packages/server/prisma/schema.prisma` — User, Species, Sighting models

### Client
- `packages/client/src/main.tsx` — Apollo Client setup + React root (authLink + httpLink)
- `packages/client/src/App.tsx` — Main app component (auth gating + species list)
- `packages/client/src/graphql/queries.ts` — GET_ALL_SPECIES, SEARCH_SPECIES, ME_QUERY
- `packages/client/src/graphql/mutations.ts` — LOGIN_MUTATION, REGISTER_MUTATION
- `packages/client/src/context/AuthContext.tsx` — AuthProvider, useAuth hook
- `packages/client/src/pages/LoginPage.tsx` — Login form (shadcn Card + Input)
- `packages/client/src/pages/RegisterPage.tsx` — Register form (shadcn Card + Input)
- `packages/client/src/components/ui/` — shadcn UI components (button, input, label, card)
- `packages/client/src/lib/utils.ts` — cn() utility for Tailwind class merging

## Notes for AI Assistant

- The user is coding this themselves for learning — guide, don't write code for them
- Explain concepts when asked, especially GraphQL/Prisma/auth topics
- The user prefers detailed explanations on backend concepts (weaker area)
- ES module imports need .js extensions even for .ts files
- @types/express was downgraded to v4 to fix Apollo Server type conflict
- There is one test user registered in the DB (can be cleared with prisma migrate reset)
