---
name: deploy
description: Deploy the application to production on TrueNAS
disable-model-invocation: true
---

Deploy birdlog to production. Steps:

1. Commit and push any pending changes to `main` (ask the user first if there are uncommitted changes)
2. Tell the user to run the following on TrueNAS (SSH uses password auth, so Claude cannot run it directly):

```bash
ssh henrik@192.168.50.212
cd /var/www/birdlog && git pull && sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

3. Once the user confirms the build is done, ask them to verify:

```bash
sudo docker ps --filter name=birdlog-app --format '{{.Status}}'
```

4. Report the result.

Note: The production server is TrueNAS at `192.168.50.212`, user `henrik`. The app runs at `https://birdlog.henlit.se`. SSH key auth is not set up — password is required.
