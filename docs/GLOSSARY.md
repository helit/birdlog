# Glossary

> Living document. Project-specific terminology only — generic engineering terms do not belong here. Updated by `/build-glossary` and during phase runs when new domain terms land. Last reconciled: 2026-05-27.

## Domain

- **Life list** — the set of unique species a user has ever observed.
- **Sighting** — a single bird observation (species, location, date, notes).
- **Rarity context** — how common/uncommon a species is in a given area+time, calculated from Artdatabanken data.
- **Rarity levels** — `very_common`, `common`, `uncommon`, `rare`, `not_observed` (called "Unikt fynd" in UI).
- **Report count** — number of unique observation reports (not individual birds); a flock of 50 = 1 report.
- **Rolling window** — the 30-day backward time window used to query Artdatabanken and to key the area distribution cache; advances daily as the window moves.
- **Artdatabanken** — Swedish biodiversity data authority; provides species observation API. _See also: SOS._
- **Artportalen** — public-facing portal for Artdatabanken data (used for validation).
- **Taxon aggregation** — Artdatabanken SOS endpoint (`/Observations/TaxonAggregation`) returning per-taxon observation counts for an area+window; primary input to rarity calculation.
- **Area distribution cache** — Postgres table (`AreaDistributionCache`) keyed by area + rolling window that stores the Artdatabanken taxon aggregation rollup; avoids re-hitting SOS on every rarity lookup.

## App Concepts

- **Identify page** — landing page (`/`); shows nearby birds + action buttons for photo/guided ID.
- **Hero card** — the prominent card at top of IdentifyPage showing rarest nearby bird.
- **Nearby bird** — a single candidate species surfaced on the Identify page with rarity context; GraphQL type `NearbyBird` grouped into `hero` / `common` / `uncommon` buckets in `NearbyBirdsResult`.
- **Guided ID** — 4-step wizard (size → colors → habitat → notes) that sends description to GPT-4o.
- **Photo ID** — camera capture → GPT-4o vision analysis → species candidates.
- **Bird info page** — general species page (`/bird/:slug`); shows Wikipedia info + live rarity.
- **Species enrichment** — server-side pipeline: AI result → Wikipedia image fetch → DB upsert.
- **Image proxy** — Express endpoint that proxies Wikimedia image URLs (CORS + caching).
- **Fågelbok (Guidebook)** — in-app bird dictionary feature at `/guidebook`; searchable, with Order → Family → Species drill-down of the seeded Swedish bird universe.
- **Order (Ordning)** — taxonomic rank above family (e.g. Passeriformes / Tättingar); added to `Species` in the Fågelbok feature.
- **Family (Familj)** — taxonomic rank above species (e.g. Paridae / Mesar); `Species.family` holds the Swedish name, `Species.familyScientific` the Latin name.
- **Taxonomy backfill** — one-time script (`npm run backfill:taxonomy`) that enriches existing seeded species with order + scientific family/order via Artdatabanken, with a static JSON fallback.

## Social (planned)

> Not yet implemented — terms reserved from `docs/PRD.md` for the planned read-only social layer.

- **Friend request** — a one-directional invite from one user to another; becomes a friendship only when the recipient accepts.
- **Mutual friendship** — the consented, bidirectional link created when a friend request is accepted; the precondition for any sighting data being shared between two users. _See also: Shared sighting._
- **Shared sighting** — a sighting (including coordinates) made visible to a mutually-accepted friend; read-only, with no reactions, notifications, or ranking. _See also: Mutual friendship, Sighting._

## UI Patterns

- **Sort key** — an identifier string for a sighting sort order (e.g. `date-desc`, `species-asc`) (Swedish UI: "Sortering").
- **Bottom sheet** — a modal panel that slides up from the bottom of the screen, used for contextual option selection.
- **Flat list** — a sightings list rendered without section/month headers, used for non-date sort orders.

## Acronyms

- **SOS** — Species Observation System; Artdatabanken's observation API surface (`TaxonAggregation`, `Observations/Search`, etc.).

## Historical Phases (pre-SDD)

> Retained for context. Project workflow is now [`docs/guides/ai-workflow.md`](guides/ai-workflow.md). Old per-feature PRDs are archived under [`docs/prd/`](prd/).

- **Phase 7b** — hardening & quality pass (error handling, validation, a11y, code quality, testing, production).
- **Phase 7c** — paused: migration data, seasonal info, nearby hotspots.
- **Phase 8** — Fågelbok (guidebook): bird dictionary with taxonomic browse and search. **Shipped 2026-05-25.**
- **Phase 9** — PWA & offline (deferred).
