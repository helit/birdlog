# BirdLog Glossary

Terms and concepts used in this project. Reference this when encountering unfamiliar domain language.

## Domain
- **Life list** — the set of unique species a user has ever observed
- **Sighting** — a single bird observation (species, location, date, notes)
- **Rarity context** — how common/uncommon a species is in a given area+time, calculated from Artdatabanken data
- **Rarity levels** — very_common, common, uncommon, rare, not_observed (called "Unikt fynd" in UI)
- **Report count** — number of unique observation reports (not individual birds); a flock of 50 = 1 report
- **Artdatabanken** — Swedish biodiversity data authority; provides species observation API
- **Artportalen** — public-facing portal for Artdatabanken data (used for validation)

## App Concepts
- **Identify page** — landing page (`/`); shows nearby birds + action buttons for photo/guided ID
- **Hero card** — the prominent card at top of IdentifyPage showing rarest nearby bird
- **Guided ID** — 4-step wizard (size → colors → habitat → notes) that sends description to GPT-4o
- **Photo ID** — camera capture → GPT-4o vision analysis → species candidates
- **Bird info page** — general species page (`/bird/:slug`); shows Wikipedia info + live rarity
- **Species enrichment** — server-side pipeline: AI result → Wikipedia image fetch → DB upsert
- **Image proxy** — Express endpoint that proxies Wikimedia image URLs (CORS + caching)

## Phases
- **Phase 7b** — current: hardening & quality pass (error handling, validation, a11y, code quality, testing, production)
- **Phase 7c** — paused: migration data, seasonal info, nearby hotspots
- **Phase 8** — bird dictionary / discover feature
- **Phase 9** — PWA & offline (deferred)
