# Deploy to Production

Manual deploy of the `main` branch to the TrueNAS host. Run after any
merge to `main` that should ship.

## The command

```bash
ssh henrik@192.168.0.10
cd /var/www/birdlog
./scripts/deploy.sh
```

## What it does

1. Refuses to run if the branch isn't `main` or the working tree is dirty.
2. `git fetch` + fast-forward `main`. Exits early if there's nothing new
   to deploy (re-run with `--no-pull` to force a rebuild of current HEAD).
3. `sudo docker build -t birdlog-app .` — multi-stage build (~1–2 min cached, ~5 min cold).
4. `sudo docker compose up -d --force-recreate app` — recreates only the
   app container. The DB container is left alone, so its data is never
   at risk during a deploy.
5. Prisma migrations apply automatically on container start (Dockerfile `CMD`).
6. Tails the last 30 lines of the app log so you can confirm boot.

Total runtime: ~2 min warm, ~6 min cold.

## Prerequisites (one-time host setup)

- `git pull` works without conflicts (working tree is clean).
- Root-level `.env` contains `POSTGRES_DATA=/mnt/Data/AppData/Birdlog/postgres-data`.
- `packages/server/.env` contains `JWT_SECRET`, `OPENAI_API_KEY`, `ARTDATABANKEN_API_KEY`.
- `henrik` has `sudo` for `docker` (TrueNAS SCALE — not in the docker group).

## One-off post-deploy steps

For most deploys, the deploy script alone is enough — migrations apply
themselves. Some changes need a follow-up step:

- **New seed data or data backfills** — run inside the container:
  ```bash
  sudo docker compose exec app npm run <backfill-script> --workspace=packages/server
  ```
- **First-time setup of a new env var** — add it to `packages/server/.env`
  on the host, then re-run `./scripts/deploy.sh --no-pull` so the
  container picks it up.

Feature-specific rollouts live in their own runbook (e.g.
[`fagelbok-production-rollout.md`](./fagelbok-production-rollout.md))
when they need more than the default deploy.

## If something goes wrong

- **Build fails** — fix locally first, push, then re-deploy. The host
  shouldn't be your debugging environment.
- **Container crashes on boot** — `sudo docker compose logs --tail=200 app`
  to see the failure. Most common: a missing env var or a migration that
  needs human input (Prisma will refuse to auto-apply destructive
  changes — those need `migrate dev` locally first).
- **Migration applied but schema drift detected** — `sudo docker compose exec app npx prisma migrate status --schema=packages/server/prisma/schema.prisma`
  to see what Prisma thinks the state is.
- **Rolling back** — re-deploy a prior commit with
  `git checkout <sha> && ./scripts/deploy.sh --no-pull`. Note: this only
  rolls back code, not migrations. If a migration is the problem, you
  need a separate down-migration; Prisma doesn't generate those
  automatically.
