---
name: deploy
description: Deploy birdlog to production on TrueNAS
disable-model-invocation: true
---

Deploy birdlog to production. Full runbook: `docs/runbooks/deploy.md`.

Steps:

1. If there are uncommitted local changes, ask the user how to proceed (commit, stash, or abort). Never auto-stash work the user hasn't seen.
2. Tell the user to run the following on TrueNAS (SSH uses password auth, so you cannot run it directly):

```bash
ssh henrik@192.168.0.10
cd /var/www/birdlog
./scripts/deploy.sh
```

3. The deploy script will: fast-forward `main`, rebuild the app image (~5 min), recreate the `birdlog-app` container, tail the app logs. Migrations apply automatically on container start.
4. Once the user confirms the deploy finished, ask them to verify with a quick smoke test (open the live URL, check the affected feature).
5. If the change requires a one-off post-deploy step (data backfill, env var update), prompt the user to run that via `sudo docker compose exec app ...`.

Context: production runs on TrueNAS at `192.168.0.10`, user `henrik`, path `/var/www/birdlog`. The app is served at `https://birdlog.henlit.se` behind Nginx Proxy Manager. SSH key auth is not set up — password is required, so Claude cannot SSH directly.

For troubleshooting (build failures, container crashes on boot, schema drift, rollback), see the runbook.
