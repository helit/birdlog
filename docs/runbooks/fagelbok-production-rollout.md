# Fågelbok — Production Rollout

Steps to ship the Fågelbok (#17) feature to production. The migration is
schema-additive and the app boots cleanly with empty taxonomy columns —
the guidebook page just shows "Inga ordningar har registrerats än."
until the backfill has run.

> **Note (2026-05-25):** this runbook was rewritten after the real rollout.
> The original version assumed `docker-compose.prod.yml`, no `sudo`, and a
> backfill npm script that worked inside Docker. None of that matched the
> actual host, which surfaced three repo bugs (`scripts/deploy.sh`, the
> `backfill:taxonomy` npm script, and the `docker-compose.yml` bind-mount
> handling). All three are fixed in the follow-up PR that lands this update.

## Prerequisites

- Code merged to `main` and pulled onto the host: `henrik@192.168.0.10:/var/www/birdlog`
- Host `.env` (at repo root) contains `POSTGRES_DATA=/mnt/Data/AppData/Birdlog/postgres-data`
- `packages/server/.env` contains `JWT_SECRET`, `OPENAI_API_KEY`, `ARTDATABANKEN_API_KEY`
- `henrik` has `sudo` for `docker` (TrueNAS SCALE — not in the docker group)

## Step 1 — Deploy the code

The deploy script rebuilds the app image and recreates the app container.
Migrations apply on container start (Dockerfile `CMD`).

```bash
ssh henrik@192.168.0.10
cd /var/www/birdlog
./scripts/deploy.sh
```

Watch the tail for `Applying migration ... add_species_taxonomy` and
`BirdLog server running at http://localhost:4000/graphql`.

## Step 2 — Run the taxonomy backfill

Fills `order` / `orderScientific` / `familyScientific` on every `Species`
row by pulling taxonomy from Artdatabanken. Idempotent — re-runs touch
only rows where `orderScientific IS NULL`. Pass `--force` to re-resolve
every row.

```bash
sudo docker compose exec app npm run backfill:taxonomy --workspace=packages/server
```

What it does:

1. `POST /Observations/TaxonAggregation` (Aves + underlying taxa) — lists
   ~1,300 bird taxonIds observed in Sweden in one call.
2. `POST /Observations/Search` with `fieldSet: "All"` — chunks of 50
   taxonIds (~30 calls), builds a `scientificName → {family, order}` map.
   429s and timeouts retry with exponential backoff; any id missing from
   a chunk response gets a single-id second pass.
3. Walks `Species` rows and writes taxonomy (case-insensitive name match).

Runtime: ~5–10 min depending on Artdatabanken load.

## Step 3 — Verify

Expected final line:

```
[backfill] done — resolved 258, skipped 4, 0 without Swedish order name
```

- **258/262 species resolved** in prod (98.5 %, well above the spec's 90 % floor).
- **4 skipped** — IOC-vs-Dyntaxa naming drift, not a backfill bug:
  - `Acanthis hornemanni` (Dyntaxa: subspecies `Acanthis flammea hornemanni`)
  - `Corvus cornix` (Dyntaxa: `Corvus corone cornix`)
  - `Accipiter gentilis` (renamed in Dyntaxa)
  - `Charadrius dubius` (renamed in Dyntaxa)

Surface these by aligning their seed `scientificName` to Dyntaxa in a
follow-up — not a rollout blocker.

DB sanity check:

```bash
sudo docker compose exec db psql -U birdlog -d birdlog -c \
  'SELECT COUNT(*) AS total, COUNT("orderScientific") AS with_order, COUNT(DISTINCT "orderScientific") AS distinct_orders FROM "Species";'
```

Expected on prod: `total=262, with_order=258, distinct_orders=20`.

## Step 4 — Smoke test

Open the deployed app, tap the Fågelbok tab, confirm:

- 20 orders render in the list (alphabetical, Swedish names).
- Drill into an order → family → species and the species row links to
  `/bird/:scientificName`.
- Search `tal` → matches `Talgoxe`; accent variants work.

## If something goes wrong

- **`HTTP 429` during backfill** — retries automatically up to 5 times
  with exponential backoff. If it still fails, wait 10 min and re-run;
  the backfill picks up only unfilled rows.
- **Network timeouts on a specific taxonId** — the single-id fallback
  pass is fault-tolerant per id; the run reports skipped ids and keeps
  going.
- **`HTTP 401`** — `ARTDATABANKEN_API_KEY` is missing or invalid in
  `packages/server/.env`.
- **Backfill completes but guidebook is still empty** — check
  `Species.orderScientific` directly in the DB; if every row is `NULL`,
  the backfill never wrote. Re-run with `--force` and watch the log for
  errors.
- **`env file ... packages/server/.env not found`** during `compose up`
  — the secrets file isn't on the host. Extract from the running app
  container's env (see follow-up PR description) or restore from a
  backup before re-running the deploy.
