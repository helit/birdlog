# BIRDLOG — Claude Project Context

Last updated: 2026-03-17
Current phase: Phase 3 — Sighting Log [IN PROGRESS]

## About

Mobile-first Swedish birdwatching web app. Portfolio project to refresh backend skills.
Repo: https://github.com/helit/birdlog

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Apollo Client 3, React Router 7, Tailwind CSS 4, shadcn/ui
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
6. AI bird identification (Claude API) — NOTE: User wants to discuss UX/design for this before implementation
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

### Step 2: Implement resolvers [DONE]
- `mySightings` query: requireAuth, findMany filtered by userId, includes species, ordered by date desc
- `createSighting` mutation: requireAuth, prisma.sighting.create with new Date(date), includes species
- `updateSighting` mutation: requireAuth, ownership check (sighting.userId !== user.id → FORBIDDEN), partial update with only defined fields, includes species
- `deleteSighting` mutation: requireAuth, ownership check, prisma.sighting.delete, returns true
- All mutations tested and verified in Apollo Sandbox

### Step 3: Client GraphQL operations [DONE]
- Added MY_SIGHTINGS query in queries.ts (fetches sightings with species, location, notes, date)
- Added CREATE_SIGHTING, UPDATE_SIGHTING, DELETE_SIGHTING mutations in mutations.ts
- UPDATE_SIGHTING supports all optional fields for partial updates (speciesId, latitude, longitude, location, notes, date)

### Step 4: Sighting form page [DONE]
- Species picker: Popover + Command (cmdk) combobox with server-side search via SEARCH_SPECIES (useLazyQuery, shouldFilter={false})
- Date input: defaults to today, user can override for past sightings
- Geolocation: auto-fetches on mount via useEffect + navigator.geolocation, "Uppdatera position" button to re-fetch
- Location name: optional text input for human-readable place name
- Notes: optional textarea
- Submit: useMutation with CREATE_SIGHTING, button disabled until required fields filled (speciesId, lat/lng, date)
- Basic mobile-first styling with Card layout, labels, and gap spacing

### Step 5: Sightings list page (view, edit, delete) [DONE]
- SightingsListPage: useQuery(MY_SIGHTINGS), loading state with Spinner, renders SightingCard per sighting
- SightingCard component: displays species name (swedish + scientific), formatted date (date-fns + sv locale), coordinates, optional location/notes
- Delete: useMutation(DELETE_SIGHTING) with refetchQueries, toast.success/error via sonner, loading spinner on button
- Edit button: navigates to /edit/:id with sighting data via route state
- Server: added Sighting field resolvers for date/createdAt → toISOString() so dates come as ISO strings instead of timestamps
- Server: mySightings orderBy uses compound sort [{ date: "desc" }, { id: "desc" }]
- Toast notifications: sonner Toaster in App.tsx (position="top-center"), toast() calls in SightingCard

### Step 6: Life list page (unique species seen) [DONE]
- Server: `LifeListEntry` type in typeDefs (species, sightingCount, firstSeenAt, lastSeenAt, months)
- Server: `myLifeList` query — uses prisma.sighting.groupBy for count/_min/_max, separate species fetch, separate sightings fetch for unique months via Set
- Server: `mySightingsBySpecies(speciesId)` query — returns sightings filtered by userId + speciesId (for future drill-down/heatmap)
- Client: MY_LIFE_LIST query in queries.ts
- Client: LifeListPage — useQuery(MY_LIFE_LIST), LoadingScreen component, renders LifeListCard per entry
- Client: LifeListCard component — species name (swedish + scientific), sighting count, last seen date (date-fns + sv locale), months formatted with date-fns MMM
- Client: LoadingScreen reusable component (centered Spinner with flexbox)

### Step 7: Navigation/routing (react-router) [DONE]
- Installed react-router-dom v7, BrowserRouter wraps app in main.tsx (BrowserRouter → ApolloProvider → AuthProvider → App)
- App.tsx: conditional routing — unauthenticated users see /login and /register (with catch-all redirect to /login), authenticated users see /, /new, /edit/:id, /life-list (with catch-all redirect to /)
- Auth pages (LoginPage, RegisterPage): removed callback props (onSwitchToRegister/onSwitchToLogin), replaced with `<Link>` navigation between /login and /register
- BottomNav component: fixed bottom tab bar with 3 tabs (Observationer, Ny, Fågellista), uses useLocation() + isActive() for active tab highlighting (text-primary vs text-muted-foreground), cn() utility for class merging
- Header component: top bar with "BirdLog" title and logout button (LogOut icon from lucide-react), useAuth() for logout
- SightingFormPage: supports both create and edit modes via useParams() (id) and useLocation() state (sighting data), pre-fills form fields in edit mode, skips geolocation fetch in edit mode, calls UPDATE_SIGHTING or CREATE_SIGHTING based on presence of id, useNavigate() redirects to / after success
- SightingCard: edit button wired up with navigate(`/edit/${id}`, { state: { sighting } }) passing sighting data via route state
- Layout: authenticated routes wrapped in max-w-md centered container with mb-14 for bottom nav clearance, auth routes centered with flex min-h-screen
- Toaster (sonner) rendered once in App.tsx outside route blocks, position="top-center"
- Cleaned up App.tsx: removed old species list code, useState toggles, commented-out returns

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
- shadcn components used: Button, Input, Label, Card, Command, Popover, Textarea, Sonner (toast)
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
- `packages/client/src/main.tsx` — Apollo Client setup + React root (BrowserRouter + authLink + httpLink)
- `packages/client/src/App.tsx` — Main app component (conditional routing: auth vs authenticated routes)
- `packages/client/src/graphql/queries.ts` — GET_ALL_SPECIES, SEARCH_SPECIES, ME_QUERY, MY_SIGHTINGS, MY_LIFE_LIST
- `packages/client/src/graphql/mutations.ts` — LOGIN_MUTATION, REGISTER_MUTATION, CREATE_SIGHTING, UPDATE_SIGHTING, DELETE_SIGHTING
- `packages/client/src/context/AuthContext.tsx` — AuthProvider, useAuth hook
- `packages/client/src/pages/LoginPage.tsx` — Login form (shadcn Card + Input)
- `packages/client/src/pages/RegisterPage.tsx` — Register form (shadcn Card + Input)
- `packages/client/src/pages/SightingFormPage.tsx` — Create/edit sighting form (species combobox, date, geolocation, notes, useParams for edit mode)
- `packages/client/src/pages/SightingsListPage.tsx` — Sightings list (useQuery MY_SIGHTINGS, renders SightingCards)
- `packages/client/src/components/SightingCard.tsx` — Sighting card (delete with toast, edit via navigate with route state, date-fns formatting)
- `packages/client/src/components/Header.tsx` — Top bar with app title and logout button
- `packages/client/src/components/BottomNav.tsx` — Bottom tab navigation (Observationer, Ny, Fågellista) with active tab highlighting
- `packages/client/src/components/LifeListCard.tsx` — Life list card (species name, sighting count, last seen, months)
- `packages/client/src/components/LoadingScreen.tsx` — Centered spinner loading screen (reusable)
- `packages/client/src/pages/LifeListPage.tsx` — Life list page (useQuery MY_LIFE_LIST, renders LifeListCards)
- `packages/client/src/components/ui/` — shadcn UI components (button, input, label, card, command, popover, textarea, sonner)
- `packages/client/src/lib/utils.ts` — cn() utility for Tailwind class merging

## Notes for AI Assistant

- The user is coding this themselves for learning — guide, don't write code for them
- Explain concepts when asked, especially GraphQL/Prisma/auth topics
- The user prefers detailed explanations on backend concepts (weaker area)
- ES module imports need .js extensions even for .ts files
- @types/express was downgraded to v4 to fix Apollo Server type conflict
- There is one test user registered in the DB (can be cleared with prisma migrate reset)

## Future TODO

- Set up GraphQL Code Generator to auto-generate TypeScript types from the schema (no intellisense/autocomplete on GQL responses currently)
