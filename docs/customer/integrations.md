# Integrations — BirdLog

## External APIs

| System | Purpose | Auth method | Docs |
|--------|---------|-------------|------|
| Artdatabanken SOS API | Species observation data for rarity context (nearby birds, observation counts) | API key (`Ocp-Apim-Subscription-Key` header), obtained from api-portal.artdatabanken.se | api-portal.artdatabanken.se |
| OpenAI API | GPT-4o for photo ID (vision) and guided ID (text completion) | Bearer token (`OPENAI_API_KEY` env var) | platform.openai.com/docs |
| Wikimedia REST API | Species images fetched during species enrichment pipeline | No auth required | api.wikimedia.org |

## Internal Systems

| System | Purpose | How we connect |
|--------|---------|----------------|
| Image proxy (`/api/image-proxy`) | Proxies Wikimedia image URLs to the client | Server-side Express route; adds `Cache-Control` headers |
| PostgreSQL (local/Docker) | Persistent storage for users, species, sightings | Prisma ORM via `DATABASE_URL` env var |

---

## Integration Constraints

- **Artdatabanken rate limits:** Unknown; the server caches responses (rolling-window cache + force-refresh cache-bust) to avoid hammering the API. See `packages/server/src/services/`.
- **OpenAI latency:** GPT-4o vision calls can take 5–15 s; the UI shows a loading state. Do not add timeouts shorter than 30 s.
- **Wikimedia:** Images are fetched server-side at species-enrichment time, not per-request. URL stored in `Species.imageUrl`; served via image proxy.
- **No SLA on Artdatabanken:** The API is a public research service. The app must degrade gracefully when it is unavailable (show cached data or empty state with Swedish error message).
