# BIRDLOG — Claude Project Context

Last updated: 2026-03-30
Current phase: Phase 7 in progress (Bird Intelligence) — Step 1 done, Step 2 done, Step 3 next
Phase 3 quiz: COMPLETED
Phase 6 quiz: COMPLETED (5/8)
Phase 7 (Notifications): SKIPPED — replaced with more valuable features
Phase 8 (PWA & offline): DEFERRED — will do last, if at all

## About

Mobile-first Swedish birdwatching web app. Portfolio project to refresh backend skills.
Repo: https://github.com/helit/birdlog

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Apollo Client 3, React Router 7, Tailwind CSS 4, shadcn/ui
- Backend: Node.js, Apollo Server 4, GraphQL, Express
- Database: PostgreSQL via Docker Compose
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
5. Artdatabanken API integration             [DONE]
6. AI bird identification (OpenAI API)       [DONE]
7. Bird intelligence (rarity, migration, seasonal context, hotspots)
8. Bird dictionary / discover
9. PWA & offline basics (deferred — do last if needed)
10. Polish & portfolio prep

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
- PostgreSQL via Docker Compose
- Apollo Server + Express setup
- Species queries (list, search, byId)

## Styling

- Tailwind CSS 4 + shadcn/ui component library
- shadcn components used: Button, Input, Label, Card, Command, Popover, Textarea, Sonner (toast), Skeleton
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
- `packages/client/src/graphql/queries.ts` — GET_ALL_SPECIES, SEARCH_SPECIES, ME_QUERY, MY_SIGHTINGS, MY_SIGHTINGS_BY_SPECIES, MY_LIFE_LIST, NEARBY_BIRDS
- `packages/client/src/graphql/mutations.ts` — LOGIN_MUTATION, REGISTER_MUTATION, CREATE_SIGHTING, UPDATE_SIGHTING, DELETE_SIGHTING
- `packages/client/src/context/AuthContext.tsx` — AuthProvider, useAuth hook
- `packages/client/src/pages/LoginPage.tsx` — Login form (shadcn Card + Input)
- `packages/client/src/pages/RegisterPage.tsx` — Register form (shadcn Card + Input)
- `packages/client/src/pages/SightingFormPage.tsx` — Create/edit sighting form (inline species search, date, geolocation, map picker, notes, useParams for edit mode)
- `packages/client/src/pages/PickLocationPage.tsx` — Full-screen map location picker (pan to position, fixed center marker)
- `packages/client/src/pages/SightingsListPage.tsx` — Sightings list grouped by month (useQuery MY_SIGHTINGS, renders SightingCards)
- `packages/client/src/pages/SightingDetailPage.tsx` — Sighting detail view (all info, map placeholder, edit/delete actions)
- `packages/client/src/pages/LifeListDetailPage.tsx` — Life list species detail (Wikipedia description, stats, map, sightings list)
- `packages/client/src/components/SightingCard.tsx` — Compact clickable sighting row (navigates to /sighting/:id)
- `packages/client/src/pages/ProfilePage.tsx` — Profile/settings page (logout, future: edit profile, change password)
- `packages/client/src/components/BottomNav.tsx` — Fixed bottom tab navigation (Identifiera, Observationer, Fågellista, Profil)
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
- Nearby birds: hero card (rare or #1 most observed) + list of 5 common birds, sorted by observation count
- Images fetched from Wikipedia API, proxied through Express, sized at 200px
- Skeleton loading for hero + list while geolocation and API resolve
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
  - `getWikimediaImage(scientificName, widthPx=200)` — Wikipedia REST API, returns sized thumbnail URL
- Image proxy: `GET /api/image-proxy?url=...` on Express server (Wikimedia URLs only, 24h cache, User-Agent header required)

#### Nearby Birds (replaces bird-of-the-day)
- GraphQL: `NearbyBird` type, `NearbyBirdsResult` type (`common: [NearbyBird!]!`, `rare: NearbyBird`), `nearbyBirds(lat, lng)` query
- Server resolver: fetches top 20 taxa from Artdatabanken, returns top 6 most observed as `common`, plus a `rare` outlier if one has <25% of median observations
- Names + images fetched in parallel via `Promise.all`
- Client: `NEARBY_BIRDS` query in queries.ts

#### IdentifyPage (landing page)
- Hero card: shows rare bird (amber theme, "Ovanlig observation") if available, otherwise #1 most observed (green theme, "Mest observerad just nu")
- List: 5 common birds below hero (when no rare bird, hero takes #1 and list shows #2–#6)
- Each item: 48px thumbnail, Swedish + scientific name, observation count
- Skeleton loading for both hero and list (shows while geolocation + API loading)
- BirdIcon (lucide) fallback for missing/broken images with onError handler
- Three action buttons: guided ID, new observation, photo ID

#### Species Image Caching
- `Species.imageUrl` field resolver on server — lazily fetches Wikipedia thumbnail on first access, caches URL in DB (Species.imageUrl column)
- Subsequent loads return cached URL instantly (no Wikipedia API call)
- Images served at 200px width (retina-friendly for 48–112px display sizes)
- Wikimedia image URL uses thumbnail endpoint (not original) for correct size control

#### Life List Improvements
- LifeListCard: added 48px image thumbnails with BirdIcon fallback and `loading="lazy"`
- LifeListPage: skeleton loading (8 placeholder cards) instead of spinner

#### Reusable Components
- `packages/client/src/components/ui/skeleton.tsx` — animate-pulse skeleton component (shadcn pattern)

### TODO
- Consider caching Artdatabanken responses to reduce API calls

## Phase 6 Progress — AI Bird Identification

### Photo Identification [DONE]
- Full pipeline working end-to-end with **OpenAI GPT-4o**
- IdentifyPage: camera button triggers hidden `<input type="file" accept="image/*">`, uses FileReader to convert to data URL, navigates to `/identify/photo` with imageData in route state
- File input reset: `e.target.value = ""` after read + on camera button click (fixes mobile re-selection bug)
- PhotoIdentifyPage (`/identify/photo`): reads imageData from `useLocation().state`, shows preview, "Byt foto" and "Identifiera" buttons
- Client sends imageData (data URL) via `fetch POST` to `/api/identify` REST endpoint
- Server: `POST /api/identify` endpoint parses data URL → extracts base64 + mediaType → calls `identifyBird()`
- AI responds with JSON array of up to 3 bird candidates (swedishName, scientificName, confidence, description in Swedish)
- `express.json({ limit: "10mb" })` on identify endpoint for large photo payloads

#### Results UI
- Top result overlays the user's photo with a gradient (`from-black/80 via-black/50 to-transparent`)
- Shows species name, scientific name, confidence badge, description, and Wikipedia reference thumbnail
- "Logga observation" button inside the overlay → navigates to `/new` with species pre-filled
- Secondary results below under "Andra möjliga arter" heading — tappable cards with thumbnails
- Empty state if no bird found, error handling for API failures

#### Species upsert on identification
- Server enriches each result: fetches Wikipedia image + upserts species into DB
- Uses `prisma.species.upsert` on `scientificName` (unique constraint added via migration `add-unique-scientific-name`)
- Every identified bird gets a DB record, so `speciesId` is always available for logging
- Identification → sighting flow: tapping a result navigates to `/new` with `state.prefill.speciesId` + `state.prefill.swedishName`
- SightingFormPage reads `prefill` from route state to pre-fill species picker

#### Species seed expansion
- Seed file (`prisma/seed.ts`) expanded from ~50 to ~250 Swedish bird species
- Uses upsert (preserves existing sightings and AI-created species)
- Covers: tits, thrushes, flycatchers, finches, sparrows, corvids, warblers, buntings, woodpeckers, raptors, falcons, owls, herons, ducks, swans, geese, gulls, terns, skuas, waders, rails, cranes, storks, pigeons, gamebirds, divers, grebes, cormorants, auks, and more

#### API provider history
- Originally built with Anthropic Claude Sonnet — blocked on API credits
- Tried Gemini 3.1 Pro (`@google/genai` SDK) — free tier has 0 quota
- **Switched to OpenAI GPT-4o** — `openai` package, `packages/server/src/services/openai.ts`
- Old providers removed: `@anthropic-ai/sdk` and `@google/genai` uninstalled, `claude.ts` and `gemini.ts` deleted

### Infrastructure changes
- Vite: `host: true` for network access (test on phone via local IP)
- All client API URLs are relative (`/graphql`, `/api/...`) — works in both dev and production
- Vite dev proxy: forwards `/graphql` and `/api` to `localhost:4000`
- CORS: `app.use("/api", cors(...))` global middleware for all /api routes (fixes preflight OPTIONS)
- CORS: dev mode allows all origins (`origin: true`), production locks to `https://birdlog.henlit.se`
- Image proxy URLs: server returns raw Wikimedia URLs, client wraps with `proxyImageUrl()` helper
- `proxyImageUrl()` utility in `packages/client/src/lib/utils.ts` — builds relative proxy URL
- Server `.env` loaded via `--env-file=.env` flag in tsx watch (no dotenv package needed)
- Viewport: `user-scalable=no, maximum-scale=1.0` to prevent pinch zoom
- Layout: `min-h-dvh` / `h-dvh` instead of `min-h-screen` / `h-screen` for mobile browser chrome
- IdentifyPage: geolocation error handler (prevents infinite skeleton loading)
- Species imageUrl DB cache: cleared localhost URLs, now caches raw Wikimedia URLs

### Styling updates (2026-03-23)
- Lists (sightings, life list) restyled to match "birds near you" pattern: grouped card with border-b separators, thumbnails, right-aligned metadata
- SightingCard: added species image thumbnails, date/location moved to right side
- LifeListCard: observation count on right side with "obs" label
- Detail pages (SightingDetailPage, LifeListDetailPage): added 80px species image thumbnails
- EmptyState: switched to shadcn Button component
- SightingFormPage: lat/lng now editable number inputs (max 4 decimals)

### Guided Identification [DONE]
- GuidedIdentifyPage (`/identify/guided`): 4-step wizard (size → colors → habitat → notes) with progress bar
- Step 0 — Size: 5 options (Mycket liten → Mycket stor) with reference birds, tapping advances
- Step 1 — Colors: multi-select color chips (9 colors), "Nästa" button to advance
- Step 2 — Habitat: 6 options with emoji icons (Skog, Trädgård/park, etc.), tapping advances
- Step 3 — Notes + Submit: optional textarea for extra details, summary chips of selections, "Identifiera" button
- Server: `POST /api/identify/guided` endpoint accepts `{ size, colors, habitat, notes?, latitude?, longitude? }`
- Server: `identifyBirdFromDescription()` in openai.ts — text-only GPT-4o prompt, returns `GuidedIdentificationResult` with `candidates` + `tip`
- Prompt engineering: AI acts as detective for casual birdwatchers — tolerates size misjudgment (±1 category), extra/missing colors, focuses on distinctive color+habitat combos
- Season (month) automatically added server-side, geolocation passed from IdentifyPage via route state
- Results: ranked card list with thumbnails, confidence badges, descriptions, "Logga observation" link per card
- Refinement tips: when no high-confidence result, AI suggests a follow-up question (e.g. "Hade fågeln en böjd näbb?") shown as amber card — tapping returns to notes step to add detail and re-submit
- Same enrichment pipeline as photo ID (Wikipedia image + species upsert)

### Photo Identification improvements (2026-03-23)
- Photo ID prompt enhanced: season/location context, field mark emphasis, name consistency check
- `identifyBird()` now accepts optional `{ month, latitude, longitude }` parameter
- IdentifyPage passes geolocation to both photo and guided ID via route state
- "Byt foto" button opens file picker directly (no navigation back to home)
- "Ny identifiering" and "Försök igen" also open file picker directly
- File input `accept` changed from `image/*` to `image/jpeg,image/png,image/webp,image/gif` — iOS auto-converts HEIC to JPEG

### Bug fixes & improvements (2026-03-24)
- Species picker: replaced Popover+Command (cmdk) with inline Input + dropdown list — fixes iOS keyboard not opening on tap
- Map location picker: new PickLocationPage (`/pick-location`) — full-screen map with fixed center marker (pan to position), "Bekräfta position" button
  - Custom green SVG marker overlay with z-[1000] to stay above Leaflet tiles
  - Form state preserved via route state round-trip (form → map → form)
  - SightingFormPage: "Välj på karta" button alongside "Uppdatera position"
- SightingMap: replaced default Leaflet marker with custom green SVG pin (same as pick-location)
- Button sizes increased globally for better mobile tap targets (default h-8→h-10, sm h-7→h-9, lg h-9→h-11)
- Wikipedia summaries: `getWikipediaSummary()` in artdatabanken.ts — fetches from sv.wikipedia.org (fallback en), cached in Species.description via field resolver
- LifeListDetailPage: shows species description from Wikipedia below header
- Dockerfile: added `npm install tsx` to production image so `prisma db seed` works in container
- Production seed: ran seed on TrueNAS (31 → 260 species)

### Bird Info Page [DONE]
- BirdInfoPage (`/bird/:scientificName`) — general-purpose species info page
- Shows: image, Swedish + scientific name, Wikipedia description, family
- "Spara som observation" button → navigates to `/new` with species pre-filled
- URL uses slugified scientific name (lowercase, hyphens): `/bird/alauda-arvensis`
- Slug helpers: `toSpeciesSlug()` / `fromSpeciesSlug()` in `utils.ts`
- Server: `speciesByScientificName` query — case-insensitive lookup, upserts if species not in DB (using vernacularName from nearby birds)
- Nearby birds (hero + list) on IdentifyPage are now tappable → navigate to BirdInfoPage
- Future: will become the basis for a "discover birds" / dictionary feature with search

## UX Audit & Navigation Fixes (2026-03-24)

### Navigation fixes
- SightingDetailPage: back button now uses `navigate(-1)` instead of hardcoded `/`
- SightingDetailPage: delete navigates to `/sightings` instead of `/`
- PhotoIdentifyPage: added back arrow button (was missing)
- SightingFormPage: added back arrow button (was missing)
- IdentifyPage: geolocation error now shows "Kunde inte hämta din position" instead of misleading "Inga fåglar hittades"
- Identification flow: after logging sighting from prefill, navigates back to `/` (identify page) instead of `/sightings`

### Header → Profile page
- Removed sticky Header component (deleted `Header.tsx`)
- Created ProfilePage (`/profile`) — user info, logout button, placeholder rows for edit profile / change password
- BottomNav: 4 tabs now — Identifiera, Observationer, Fågellista, Profil
- BirdLog branding (bird icon + name) added to LoginPage and RegisterPage

### Layout
- IdentifyPage: action buttons (wizard, plus, camera) vertically centered using `min-h` + `mt-auto`
- Content container: `pt-4` top padding (replaces header margin)

## Phase 7 — Bird Intelligence

### Design philosophy
The app is a field guide, not a fitness tracker. No streaks, no gamification, no engagement hooks.
Focus on helping the user understand birds and their environment — rarity, migration, seasonal context, local activity.
Merged the old Phase 7 (Statistics), Phase 8 (Bird dictionary), and Phase 9 (Weather & season) into one phase
since they all serve the same goal: contextual bird knowledge.

### Step 1: Rarity context [DONE]
- Species rarity calculated from Artdatabanken observation data (TaxonAggregation endpoint)
- `getAreaDistribution(lat, lng, { date?, thorough? })` fetches top 200 species for area, resolves names, caches 2h per grid cell (~22km)
- `calculateSpeciesRarity()` ranks species by observation count into levels: very_common (top 10%), common (top 35%), uncommon (top 70%), rare (bottom 30%), not_observed
- **Tense-aware descriptions**: `calculateSpeciesRarity()` accepts `{ tense, month }` options — past tense for stored sightings ("Observerades regelbundet i området i mars"), present tense for live data ("Observeras regelbundet i området just nu")
- **"Unikt fynd"**: `not_observed` level renamed from "Ej observerad" to "Unikt fynd" with violet color — highlights when user spotted a bird no one else reported in the area that month
- In-flight request deduplication prevents duplicate API calls
- **Sightings**: rarity computed and stored in DB at creation time (snapshot, based on sighting date/location) — 6 new columns on Sighting model (rarityLevel, rarityLabel, rarityDescription, rarityRank, rarityObservations, rarityTotalSpecies)
- **BirdInfoPage**: live rarity via RarityBadge component (uses browser geolocation, queries API, present tense)
- **SightingDetailPage**: reads stored rarity from sighting data (instant, no API call, past tense)
- Pre-warm: nearbyBirds resolver triggers distribution cache in background (3s delay to avoid rate limits)
- Backfill script: `packages/server/scripts/backfill-rarity.ts` — uses thorough mode (individual API fallbacks with delays) and sighting's own date, supports `--retry` flag for failed entries
- **Excluded species**: `EXCLUDED_SPECIES` set in artdatabanken.ts filters out domesticated species (e.g. Columba livia / tamduva) from all results
- Color-coded display: emerald (very common), sky (common), amber (uncommon), rose (rare), violet (unikt fynd)
- GraphQL: `SpeciesRarity` type, `speciesRarity` query, rarity fields on `Sighting` type

### Nearby birds redesign (2026-03-24) [DONE]
- **Layout**: hero card (rarest bird) + two sections: "Vanligast nära dig" (top 3) + "Ovanliga nära dig" (3 uncommon)
- **GraphQL**: `NearbyBirdsResult` now has `hero: NearbyBird`, `common: [NearbyBird!]!`, `uncommon: [NearbyBird!]!` (hero is nullable)
- **Accurate report counts**: observation counts now reflect actual observation reports (number of sighting events), not individual bird counts
  - `getAllReportCounts()` in artdatabanken.ts — paginates through `Observations/Search` endpoint counting reports per taxon
  - `getAreaDistribution()` uses report counts (replaces TaxonAggregation's individual bird counts)
  - Validated against Artportalen — counts match when search areas align
- **Credibility filter**: uncommon birds require at least 3 reports (MIN_REPORTS = 3) to appear in the list
- **Hero card**: always amber-themed ("Ovanligast nära dig"), shows the least-reported credible bird
- **Reusable BirdList component** extracted in IdentifyPage (used for both common and uncommon sections)
- **Skeleton loading**: 3 items per section (was 5)

### Observation count methodology
- TaxonAggregation `observationCount` = individual birds seen (e.g. flock of 50 = 50)
- Observations/Search record count = unique observation reports (e.g. flock of 50 = 1 report)
- All user-facing counts now use report counts for accuracy
- TaxonAggregation still used for species discovery (which species exist in area) and approximate ranking

### Caching strategy
- **Nearby birds**: 24h per ~22km grid cell — result cached in resolvers.ts (`nearbyBirdsCache`)
- **Area distribution** (rarity): 2h per grid cell + month — cached in artdatabanken.ts (`distributionCache`), includes report counts
- **Taxon name mapping** (taxonId → scientificName): permanent in-memory — `taxonNameCache` in artdatabanken.ts, populated from all sources (nearbyBirds, bulk Search, individual lookups), improves coverage over time
- **Species imageUrl/description**: cached in DB (Species table) — fetched lazily from Wikipedia on first access
- Location-based caches automatically refresh when user moves to a new area (~22km grid)

### Step 2: Basic profile stats [DONE]
- GraphQL: `UserStats` type, `myStats` query — totalSightings, uniqueSpecies, memberSince
- Resolver: three Prisma queries in parallel via `Promise.all` (sighting.count, sighting.groupBy for unique species, user.findUnique for createdAt)
- ProfilePage: 3 stat boxes in a row (observations count, unique species count, member since formatted as "MMM yyyy")
- Client: `MY_STATS` query in queries.ts

### Step 3: Migration & seasonal info [TODO]
- Enrich species with resident/migrant status and typical arrival/departure periods
- Show context like "Summer visitor, typically arrives in May" — note if sighting is early/late
- Research needed: best data source for Swedish bird migration patterns

### Step 4: Nearby hotspots [TODO]
- "What's happening near me" — areas with high recent observation activity
- Community data from Artdatabanken, not user's own data
- New UI, new queries — most complex step

## Key Files (new)

### Server
- `packages/server/src/services/artdatabanken.ts` — Artdatabanken + Wikimedia API service (getTopBirdTaxa, getTaxonName, getWikimediaImage, getWikipediaSummary, getAreaDistribution, getAllReportCounts, calculateSpeciesRarity)
- `packages/server/scripts/backfill-rarity.ts` — One-off script to backfill rarity data on existing sightings
- `packages/server/src/services/openai.ts` — OpenAI GPT-4o bird identification (identifyBird, identifyBirdFromDescription, BirdIdentification, GuidedIdentificationResult)
- `packages/server/src/index.ts` — Express server with Apollo GraphQL + REST endpoints (`/api/image-proxy`, `/api/identify`, `/api/identify/guided` with species upsert)
- `packages/server/prisma/seed.ts` — ~250 Swedish bird species seed (upsert-based, safe to re-run)

### Client
- `packages/client/src/pages/IdentifyPage.tsx` — Landing page with nearby birds (hero card + common/uncommon sections + BirdList component) + action buttons + hidden file input for photo capture
- `packages/client/src/pages/BirdInfoPage.tsx` — Species info page (image, description, family, live rarity badge, "Spara som observation" button)
- `packages/client/src/components/RarityBadge.tsx` — Live rarity badge component (queries API, color-coded, used on BirdInfoPage)
- `packages/client/src/pages/PhotoIdentifyPage.tsx` — Photo identification page (photo overlay with top result, secondary results, in-page file picker for new photo)
- `packages/client/src/pages/GuidedIdentifyPage.tsx` — Guided identification wizard (4-step: size, colors, habitat, notes → AI results with refinement tips)
- `packages/client/src/pages/ProfilePage.tsx` — Profile/settings page (logout, future: edit profile, change password)
- `packages/client/src/components/BottomNav.tsx` — 4 tabs: Identifiera, Observationer, Fågellista, Profil
- `packages/client/src/components/ui/skeleton.tsx` — Skeleton loading component
- `packages/client/src/utils/types.ts` — Shared TypeScript interfaces (Species, Sighting, MyLifeList)
- `packages/client/src/lib/utils.ts` — cn() utility, proxyImageUrl(), toSpeciesSlug(), fromSpeciesSlug()

### Bug fix: nearbyBirds blank page (2026-03-30)
- `hero` field in `NearbyBirdsResult` changed from non-nullable to nullable — returning `null` for a `NearbyBird!` field caused GraphQL to nuke the entire response, resulting in a blank IdentifyPage
- `nearbyBirds` resolver wrapped in try/catch — on API failure, returns stale cache if available, otherwise empty fallback `{ hero: null, common: [], uncommon: [] }`

## Deployment

### Deploy skill
- `/deploy` custom skill at `.claude/skills/deploy/SKILL.md` — guides through manual deploy steps
- SSH key auth not set up (TrueNAS home directory restrictions) — uses password-based SSH
- TrueNAS user: `henrik`, IP: `192.168.50.212`, project path: `/var/www/birdlog`

### Production — TrueNAS SCALE (self-hosted)
- Live at: `https://birdlog.henlit.se`
- Host: TrueNAS SCALE ElectricEel-24.10.2.2 with static IP
- Docker Compose: `docker-compose.prod.yml` with `--env-file .env.prod`
- Single container (`birdlog-app`) serves both API and client build via Express
- PostgreSQL container (`birdlog-db`) — plain Postgres 15 (PostGIS removed, not needed)
- SSL: wildcard certificate for `*.henlit.se` via Nginx Proxy Manager
- Reverse proxy: Nginx Proxy Manager → `birdlog-app:4000`
- Auto-deploy: cron job on TrueNAS checks for new commits every 5 minutes, pulls and rebuilds

### Docker setup
- `Dockerfile` — multi-stage build (deps → build client → build server → slim production image)
- `docker-compose.prod.yml` — Postgres + app, secrets via env vars (`DB_PASSWORD`, `JWT_SECRET`, `OPENAI_API_KEY`, `ARTDATABANKEN_API_KEY`)
- `.env.prod` — production secrets (not in git)
- `.env.prod.example` — template for production secrets
- `.dockerignore` — excludes node_modules, dist, .git, .env
- Production Express serves Vite build output as static files + catch-all for SPA routing
- CMD runs `prisma migrate deploy` before starting server (auto-applies new migrations)
- Seed command: `docker exec -it birdlog-app npx prisma db seed --schema=packages/server/prisma/schema.prisma`

### Dev vs Production differences
- Dev: Vite dev server on :5173 proxies `/graphql` and `/api` to Express on :4000
- Production: Express serves everything on :4000 (static files + API + GraphQL)
- Dev: `docker-compose.yml` with local Postgres, `npm run dev`
- Production: `docker-compose.prod.yml` with env vars, Docker build

## Future TODO

- Set up GraphQL Code Generator to auto-generate TypeScript types from the schema (no intellisense/autocomplete on GQL responses currently)
