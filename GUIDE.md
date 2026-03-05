# BirdLog — Project Guide & Learning Roadmap

A mobile-first birding field guide, life list tracker, and AI-powered bird identification app.

## Why This Stack?

| Layer | Tech | Role |
|-------|------|------|
| Database | **PostgreSQL** (or SQLite for dev) | Stores birds, sightings, users |
| ORM | **Prisma** | Type-safe database access, migrations, seeding |
| API | **Apollo Server + GraphQL** | Flexible queries (fetch exactly what the mobile UI needs) |
| Schema | **Pothos** (formerly GraphQL Nexus) | Code-first, TypeScript-native GraphQL schema builder |
| Server | **Node.js + Express** | Runtime + middleware (auth, CORS) |
| AI | **Anthropic Claude API** | Bird identification from descriptions, learning assistant |
| Frontend | **React + Vite + TypeScript** | Fast mobile-first SPA |
| External Data | **eBird API** (Cornell Lab) | Real-world bird sighting data by location |

**Why GraphQL over REST for this project?** Your mobile UI will have very different data needs per screen — the life list needs just names and dates, the bird detail page needs full descriptions and habitat info, and the nearby-birds view needs location data. GraphQL lets the client request exactly what it needs per view, which is both a performance win on mobile and a great thing to demonstrate in a portfolio.

**Why Prisma?** It generates TypeScript types from your schema, so your database types flow all the way through your GraphQL resolvers to the frontend. You get end-to-end type safety with minimal boilerplate.

**Why Pothos?** It's the modern way to build GraphQL schemas in TypeScript. Instead of writing `.graphql` schema files separately, you define your schema in TypeScript with full autocomplete and type checking. It has a first-class Prisma plugin that auto-generates GraphQL types from your Prisma models.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   CLIENT                     │
│  React + Vite + TypeScript                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Life List │ │ Discover │ │ AI Identify  │ │
│  │  Page    │ │   Page   │ │    Page      │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       └─────────────┼──────────────┘         │
│              Apollo Client                    │
│              (GraphQL queries)                │
└──────────────────┬──────────────────────────┘
                   │ HTTP/GraphQL
┌──────────────────┴──────────────────────────┐
│                   SERVER                     │
│  Node.js + Express + Apollo Server           │
│  ┌──────────────────────────────────────┐   │
│  │     Pothos GraphQL Schema             │   │
│  │  ┌──────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │Bird Type │ │Sighting│ │AI Chat │ │   │
│  │  │& Queries │ │Mutations│ │Queries │ │   │
│  │  └────┬─────┘ └───┬────┘ └───┬────┘ │   │
│  └───────┼────────────┼──────────┼──────┘   │
│          │            │          │            │
│   ┌──────┴──────┐     │    ┌─────┴─────┐    │
│   │   Prisma    │     │    │ Anthropic  │    │
│   │   Client    │◄────┘    │   Claude   │    │
│   └──────┬──────┘          └─────┬─────┘    │
│          │                       │           │
│   ┌──────┴──────┐         ┌─────┴─────┐    │
│   │  Database   │         │ Claude API │    │
│   │  (SQLite/   │         │            │    │
│   │  Postgres)  │         └───────────┘    │
│   └─────────────┘                           │
│          ▲                                   │
│   ┌──────┴──────┐                           │
│   │  eBird API  │ (seed data / live queries) │
│   └─────────────┘                           │
└─────────────────────────────────────────────┘
```

---

## Day 1: Backend (The Learning-Heavy Day)

### Step 1: Project Setup (30 min)

The scaffold is already set up for you! But here's what was done and why:

- **Monorepo structure** with `server/` and `client/` directories. No monorepo tool needed for this size — just two separate `package.json` files.
- **TypeScript** configured in both with strict mode.
- **Prisma** initialized in `server/prisma/`.

Key files to understand:
- `server/prisma/schema.prisma` — Your database schema (this is where Prisma shines)
- `server/src/schema/` — Your GraphQL type definitions built with Pothos
- `server/src/index.ts` — Server entry point

### Step 2: Understand the Prisma Schema (30 min)

Open `server/prisma/schema.prisma` and study the models. Key concepts to refresh:

- **Relations**: `Sighting` belongs to both a `User` and a `Bird`. Prisma makes this declarative.
- **Enums**: `ConservationStatus` shows how Prisma handles enums.
- **@@index**: Database indexes for performance (e.g., querying sightings by location).
- **Default values**: `createdAt @default(now())` — Prisma handles this at the DB level.

**Exercise**: After reading the schema, try adding a `Tag` model (for custom user tags on sightings like "singing", "nesting", "in flight") with a many-to-many relation to `Sighting`. Run `npx prisma migrate dev --name add-tags` to see how Prisma handles migrations.

### Step 3: Seed the Database (30 min)

Run `npx prisma db seed` to populate your database with bird data. Open `server/prisma/seed.ts` to see how seeding works. The seed file includes ~30 common Nordic/European birds with real data.

**Key Prisma concepts in the seed file:**
- `prisma.bird.createMany()` — Bulk inserts
- `prisma.bird.upsert()` — Insert or update (idempotent seeding)
- Transaction handling

### Step 4: Build the GraphQL API (2-3 hours)

This is the core learning. The scaffold gives you the structure, but you should understand each piece:

**4a. Pothos Schema Builder**
Open `server/src/schema/builder.ts`. This configures Pothos with the Prisma plugin. The key insight: Pothos reads your Prisma schema and lets you expose database models as GraphQL types with minimal code.

**4b. Bird Types and Queries**
Open `server/src/schema/bird.ts`. Study how:
- `builder.prismaObject('Bird', ...)` creates a GraphQL type from your Prisma model
- `builder.queryField(...)` adds queries like `birds`, `bird(id)`, `birdsNearMe(lat, lng, radius)`
- The Prisma plugin handles N+1 queries automatically

**4c. Sighting Mutations**
Open `server/src/schema/sighting.ts`. This is where you:
- Create mutations for `logSighting` and `deleteSighting`
- Handle input validation
- Use Prisma's `include` to return related data

**4d. AI Integration**
Open `server/src/schema/ai.ts`. This adds:
- `identifyBird(description)` — Send a bird description to Claude, get back possible species
- `askAboutBird(birdId, question)` — Ask Claude questions about a specific bird

**Exercise**: Add a `searchBirds(query: String!)` query that uses Prisma's `contains` filter to search birds by name or description.

### Step 5: Test with GraphQL Playground (30 min)

Start the server and open `http://localhost:4000/graphql`. Try these queries:

```graphql
# Get all birds
query {
  birds {
    id
    commonName
    scientificName
    habitat
  }
}

# Get birds near a location (Gothenburg)
query {
  birdsNearMe(latitude: 57.7089, longitude: 11.9746, radiusKm: 50) {
    commonName
    description
  }
}

# Log a sighting
mutation {
  logSighting(input: {
    birdId: "some-bird-id"
    latitude: 57.7089
    longitude: 11.9746
    notes: "Spotted near the harbor"
  }) {
    id
    bird {
      commonName
    }
    date
  }
}

# Ask AI to identify a bird
query {
  identifyBird(description: "Small bird with a red breast, seen in my garden in Sweden") {
    possibleSpecies
    confidence
    details
  }
}
```

---

## Day 2: Frontend + Polish

### Step 6: React Frontend Setup (30 min)

The scaffold includes a Vite + React + TypeScript setup with Apollo Client configured. Key files:

- `client/src/lib/apollo.ts` — Apollo Client setup pointing to your GraphQL server
- `client/src/App.tsx` — Routing setup
- `client/src/pages/` — Page components

### Step 7: Build the Core Pages (3-4 hours)

**7a. Bird List / Discovery Page**
- Uses the `birds` query
- Search/filter functionality
- Tap a bird to see details
- Mobile-first card layout

**7b. Bird Detail Page**
- Full species info from the `bird(id)` query
- "Log Sighting" button that calls the `logSighting` mutation
- "Ask AI" section — type a question about the bird
- Beautiful mobile layout with hero image area

**7c. Life List Page**
- Your personal sightings from `mySightings` query
- Sort by date, filter by location
- Progress stats (X species seen out of Y in your area)

**7d. AI Identification Page**
- Text input: "Describe the bird you saw"
- Calls `identifyBird` query
- Shows results with confidence levels and links to bird detail pages

### Step 8: Location Features (1 hour)

- Use the browser's Geolocation API
- Pass coordinates to `birdsNearMe` query
- Show a "new for you" badge on birds you haven't logged yet

### Step 9: Polish & Deploy (1 hour)

- Add a service worker for offline support (PWA)
- Deploy backend to Railway/Render
- Deploy frontend to Vercel/Netlify
- Add environment variables for API keys

---

## Key Backend Concepts You'll Refresh

1. **Prisma**: Schema design, migrations, relations, seeding, type-safe queries
2. **GraphQL**: Schema design, queries, mutations, resolvers, input types
3. **Apollo Server**: Server setup, context, middleware, playground
4. **Pothos**: Code-first schema building, Prisma integration
5. **AI Integration**: Anthropic API, prompt engineering, structured responses
6. **External APIs**: REST API consumption (eBird), data transformation
7. **Auth patterns**: JWT or session-based auth (optional stretch goal)
8. **Geospatial queries**: Location-based filtering with coordinates

---

## Stretch Goals (If You Have More Time)

- **Push notifications** via Web Push API when a rare bird is spotted near you
- **Photo upload** with image storage (S3/Cloudinary)
- **Social features** — share sightings, follow other birders
- **AI image identification** — upload a photo, Claude describes it, matches to species
- **Offline mode** — full PWA with service worker caching
- **Testing** — Vitest for unit tests, integration tests for GraphQL resolvers

---

## Useful Resources

- [Prisma Docs](https://www.prisma.io/docs) — Especially the "Concepts" section
- [Pothos GraphQL](https://pothos-graphql.dev/) — Schema builder docs
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) — Server setup
- [Apollo Client](https://www.apollographql.com/docs/react/) — React integration
- [eBird API](https://documenter.getpostman.com/view/664302/S1ENwy59) — Bird observation data
- [Anthropic API](https://docs.anthropic.com/) — Claude integration
