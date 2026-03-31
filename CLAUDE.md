# BIRDLOG

Mobile-first Swedish birdwatching web app. All user-facing text in Swedish.
Live at: https://birdlog.henlit.se

## Design Philosophy
Field guide, not a fitness tracker. No streaks, no gamification, no engagement hooks.
Focus on helping the user understand birds — rarity, migration, seasonal context.

## Deployment (TrueNAS SCALE)
- Host: TrueNAS SCALE, static IP `192.168.50.212`, user `henrik`
- Path: `/var/www/birdlog`
- SSH: password-based (no key auth — TrueNAS home dir restrictions)
- Auto-deploy: cron checks for new commits every 5 min
- SSL: wildcard cert via Nginx Proxy Manager
