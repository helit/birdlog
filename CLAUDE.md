# BIRDLOG — Claude Project Context

Last updated: 2026-03-19
Current phase: Artdatabanken API integration + AI identification [IN PROGRESS]
Phase 3 quiz: COMPLETED
Phase 8 (PWA & offline): DEFERRED — will do last, if at all

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
3. Sighting log — CRUD, geolocation, life list [DONE]
4. Design & styling pass                     [DONE]
5. Artdatabanken API integration             [IN PROGRESS]
6. AI bird identification (Claude API)       [IN PROGRESS]
7. Notifications & alerts (Web Push)
8. PWA & offline basics (deferred — do last if needed)
9. Polish & portfolio prep

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
- Layout: Header outside container (full-width sticky), content in max-w-2xl centered container with px-4 pb-4 mb-14, auth routes centered with flex min-h-screen
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

### Color Theme (oklch)
- Primary: forest green `oklch(0.45 0.15 145)` — buttons, active nav, links
- Background: warm gray `oklch(0.975 0.005 80)` — page background
- Card/popover: pure white `oklch(1 0 0)` — cards pop against background
- Foreground/text: dark green-tinted `oklch(0.18 0.03 150)`
- Muted foreground: `oklch(0.50 0.04 150)` — secondary text
- All theme colors defined as CSS variables in `:root` block of index.css
- Toasts (sonner): color-coded per type using oklch (success=green h145, error=red h25, warning=amber h85, info=blue h230)

### Design Patterns
- No borders — using `shadow-sm` for cards/list items, subtle custom shadows for header/nav
- Header: sticky, full-width, white bg, lives outside the max-w container
- BottomNav: fixed, full-width, white bg
- Content container: `max-w-2xl` centered with `px-4`
- List items: compact `<button>` rows (not Card components), clickable → navigate to detail page
- Sightings list: grouped by month/year headers

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
- `packages/client/src/graphql/queries.ts` — GET_ALL_SPECIES, SEARCH_SPECIES, ME_QUERY, MY_SIGHTINGS, MY_SIGHTINGS_BY_SPECIES, MY_LIFE_LIST
- `packages/client/src/graphql/mutations.ts` — LOGIN_MUTATION, REGISTER_MUTATION, CREATE_SIGHTING, UPDATE_SIGHTING, DELETE_SIGHTING
- `packages/client/src/context/AuthContext.tsx` — AuthProvider, useAuth hook
- `packages/client/src/pages/LoginPage.tsx` — Login form (shadcn Card + Input)
- `packages/client/src/pages/RegisterPage.tsx` — Register form (shadcn Card + Input)
- `packages/client/src/pages/SightingFormPage.tsx` — Create/edit sighting form (species combobox, date, geolocation, notes, useParams for edit mode)
- `packages/client/src/pages/SightingsListPage.tsx` — Sightings list grouped by month (useQuery MY_SIGHTINGS, renders SightingCards)
- `packages/client/src/pages/SightingDetailPage.tsx` — Sighting detail view (all info, map placeholder, edit/delete actions)
- `packages/client/src/pages/LifeListDetailPage.tsx` — Life list species detail (stats, map placeholder, sightings placeholder)
- `packages/client/src/components/SightingCard.tsx` — Compact clickable sighting row (navigates to /sighting/:id)
- `packages/client/src/components/Header.tsx` — Sticky top bar with app title and logout button
- `packages/client/src/components/BottomNav.tsx` — Fixed bottom tab navigation (Observationer, Ny, Fågellista)
- `packages/client/src/components/LifeListCard.tsx` — Compact clickable life list row (navigates to /life-list/:speciesId)
- `packages/client/src/components/SightingMap.tsx` — Reusable Leaflet map component (accepts markers array, used on both detail pages)
- `packages/client/src/components/EmptyState.tsx` — Centered empty state with BirdIcon and message (reusable)
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

## Phase 4 Progress — Design & Styling Pass

### Done
- Color theme: green primary (oklch hue 145), warm gray background, white cards
- Toast notifications: color-coded per type (success/error/warning/info) matching theme oklch values
- Typography: theme classes applied (text-primary for links, text-muted-foreground for secondary text)
- Borders → shadows: replaced all 1px borders with shadow-sm across cards, list items, detail pages
- Card component updated (ring-1 → shadow-sm)
- Compact list cards: SightingCard and LifeListCard are now slim clickable button rows
- Sightings grouped by month/year headers in SightingsListPage
- Detail pages: SightingDetailPage (/sighting/:id) and LifeListDetailPage (/life-list/:speciesId) with info cards, edit/delete
- Layout: Header sticky full-width outside container, BottomNav fixed full-width, both white bg with subtle shadows
- Container widened to max-w-2xl with w-full for responsiveness
- Empty state component (EmptyState.tsx): centered BirdIcon + message when no sightings/life list entries
- Layout fix: removed min-h-screen from content div, using pb-20 for BottomNav clearance (no scroll on empty pages)
- BottomNav: active tab has primary color indicator bar (full width), subtle bg-primary/10 background, equal-width tabs via flex-1
- Bug fix: SightingFormPage form reset — added key="new"/key="edit" on routes so React remounts between create and edit
- Bug fix: stale list after mutations — all mutations (create, update, delete) now use `{ query: ... }` refetchQueries syntax + awaitRefetchQueries + async/await for navigation after refetch completes

- Leaflet maps: SightingMap reusable component (react-leaflet v4, OpenStreetMap tiles, custom icon fix for Vite)
- SightingDetailPage: single-marker map showing sighting location
- LifeListDetailPage: multi-marker map showing all sighting locations for species
- LifeListDetailPage: fetches and displays individual sightings per species (MY_SIGHTINGS_BY_SPECIES query, date/location/notes per sighting)

### Landing / Identify page [DONE]
- IdentifyPage is now the home screen (`/`), sightings list moved to `/sightings`
- BottomNav updated: Identifiera (/) | Observationer (/sightings) | Fågellista (/life-list)
- Bird-of-the-day: random species from top 10 most observed near user's location this month
- Image fetched from Wikipedia API by scientific name, proxied through Express to avoid CORS
- Three round action buttons: guided ID, new observation, photo ID
- Placeholder routes for `/identify/guided` and `/identify/photo`

## Phase 5 Progress — Artdatabanken API Integration

### Done
- Artdatabanken API subscription active (Species Observations - multiple data resources)
- API key stored in `packages/server/.env` as `ARTDATABANKEN_API_KEY`
- Base URL: `https://api.artdatabanken.se/species-observation-system/v1/`
- Auth: `Ocp-Apim-Subscription-Key` header
- Birds taxon ID: `4000104` with `includeUnderlyingTaxa: true`
- Service module: `packages/server/src/services/artdatabanken.ts`
  - `getTopBirdTaxa(lat, lng)` — POST TaxonAggregation, filters by birds + current month + 15km radius
  - `getTaxonName(taxonId)` — POST Observations/Search to get scientificName + vernacularName
  - `getWikimediaImage(scientificName)` — Wikipedia REST API, returns 800px-wide image URL
- GraphQL: `BirdOfTheDay` type + `birdOfTheDay(latitude, longitude)` query
- Image proxy: `GET /api/image-proxy?url=...` on Express server (Wikimedia URLs only, 24h cache, User-Agent header required)
- Client: `BIRD_OF_THE_DAY` query in queries.ts, used in IdentifyPage with geolocation + `skip: !latitude`

### TODO
- Bird-of-the-day should be deterministic per day (currently random on every page load)
- Consider caching Artdatabanken responses to reduce API calls

## Phase 6 Progress — AI Bird Identification

### Planned
- Photo identification: upload/snap photo → Claude API identifies the bird
- Guided identification: step-by-step wizard (size, color, behavior → species suggestions)
- Both paths accessible from IdentifyPage action buttons

### TODO
- Build photo identification page (`/identify/photo`)
- Build guided identification page (`/identify/guided`)
- Integrate Claude API on server side

## Key Files (new)

### Server
- `packages/server/src/services/artdatabanken.ts` — Artdatabanken + Wikimedia API service
- `packages/server/src/index.ts` — Now includes image proxy endpoint (`/api/image-proxy`)

### Client
- `packages/client/src/pages/IdentifyPage.tsx` — Landing page with bird-of-the-day + action buttons
- `packages/client/src/components/BottomNav.tsx` — Updated: Identifiera, Observationer, Fågellista

## Future TODO

- Set up GraphQL Code Generator to auto-generate TypeScript types from the schema (no intellisense/autocomplete on GQL responses currently)
