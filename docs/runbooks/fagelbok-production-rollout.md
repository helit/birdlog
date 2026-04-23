# Fågelbok — Production Rollout

One-time steps to make the Fågelbok (#17 / PR #18) feature usable in production.
The feature is schema-additive and the app starts cleanly with empty taxonomy columns
— the guidebook page just shows "Inga ordningar har registrerats än." until the
backfill has run.

## Prerequisites

- PR #18 merged to `main` and deployed to prod (auto-deploys every 5 min via cron — see root `CLAUDE.md`)
- `ARTDATABANKEN_API_KEY` present in the server's production `.env` (same key used by the rest of the app)
- SSH access to the TrueNAS host: `henrik@192.168.0.10`, app path `/var/www/birdlog`

## Step 1 — Apply the Prisma migration

Adds three columns (`order`, `orderScientific`, `familyScientific`) and two indexes
to the `Species` table. Additive and non-destructive.

```bash
ssh henrik@192.168.0.10
cd /var/www/birdlog
npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma
```

Expected output ends with either "No pending migrations to apply." (already applied)
or "Applying migration `20260422092129_add_species_taxonomy`".

## Step 2 — Run the taxonomy backfill

Walks every Species row and fills `order` / `orderScientific` / `familyScientific` by
pulling taxonomy from Artdatabanken. Idempotent — re-runs are safe and only touch
rows where `orderScientific IS NULL` (use `--force` to re-resolve every row).

```bash
# from /var/www/birdlog on the prod host
npm run backfill:taxonomy --workspace=packages/server
```

What it does:

1. `/Observations/TaxonAggregation` — lists ~1,300 bird taxonIds observed in Sweden (one call).
2. `/Observations/Search` with `fieldSet: "All"` — chunks of 50 taxonIds, ~30 calls, builds a `scientificName → {family, order}` map. 429s and timeouts retry with exponential backoff; any id missing from a chunk response gets a single-id second pass.
3. Walks `Species` rows and writes taxonomy (case-insensitive name match; seed has mixed casing).

Runtime: ~5–10 min depending on Artdatabanken load.

## Step 3 — Verify

Expected final line from the backfill:

```
[backfill] done — resolved 259, skipped 4, 0 without Swedish order name
```

- **259/263 species resolved** (≥90 % is the spec's floor; we're at 98.5 %)
- **4 skipped** are IOC-vs-Dyntaxa naming drift — not a backfill bug:
  - `Acanthis hornemanni` (Dyntaxa has it as subspecies `Acanthis flammea hornemanni`)
  - `Corvus cornix` (Dyntaxa: `Corvus corone cornix`)
  - `Accipiter gentilis` (renamed in Dyntaxa)
  - `Charadrius dubius` (renamed in Dyntaxa)

These four show up in the guidebook once their seed `scientificName` is aligned to Dyntaxa — handle as a separate follow-up, not a rollout blocker.

Quick DB sanity check from the prod host:

```bash
npx prisma studio --schema=packages/server/prisma/schema.prisma
```

or via `psql` / the app's Prisma Client:

```sql
SELECT COUNT(*)                            AS total,
       COUNT("orderScientific")            AS with_order,
       COUNT(DISTINCT "orderScientific")   AS distinct_orders
FROM "Species";
-- expected: total=263, with_order=259, distinct_orders=20
```

## Step 4 — Smoke test

Open the deployed app, tap the Fågelbok tab, confirm:

- 20 orders render in the list (alphabetical, Swedish names).
- Drill into an order → family → species and the species row links to `/bird/:scientificName`.
- Search `tal` → matches `Talgoxe` (Great Tit); accent variants work.

## If something goes wrong

- **`HTTP 429` during backfill** — retries automatically up to 5 times with exponential backoff. If it still fails, wait 10 min and re-run; the backfill picks up only unfilled rows.
- **Network timeouts on a specific taxonId** — the single-id fallback pass is fault-tolerant per id; the run reports skipped ids and keeps going.
- **`HTTP 401`** — `ARTDATABANKEN_API_KEY` is missing or invalid in prod `.env`.
- **Backfill completes but guidebook is still empty** — check `Species.orderScientific` directly in the DB; if every row is `NULL`, the backfill never wrote. Re-run with `--force` and watch the log for errors.
