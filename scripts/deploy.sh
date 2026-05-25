#!/usr/bin/env bash
#
# Manual deploy for Birdlog on the TrueNAS host.
#
# Usage (from /var/www/birdlog on the host):
#   ./scripts/deploy.sh           # deploys current `main`
#   ./scripts/deploy.sh --no-pull # skips git pull (useful for re-deploying current HEAD)
#
# Migrations apply automatically when the new container starts
# (see Dockerfile CMD). One-off jobs like `backfill:taxonomy`
# stay manual — run them via `docker compose exec app ...`
# after this script finishes (see docs/runbooks/).

set -euo pipefail

REPO_DIR="/var/www/birdlog"
COMPOSE_FILE="docker-compose.prod.yml"
APP_SERVICE="app"
BRANCH="main"

SKIP_PULL=0
for arg in "$@"; do
  case "$arg" in
    --no-pull) SKIP_PULL=1 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

cd "$REPO_DIR"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "$BRANCH" ]]; then
  echo "refusing to deploy: on branch '$current_branch', expected '$BRANCH'" >&2
  exit 1
fi

before_sha=$(git rev-parse --short HEAD)

if [[ "$SKIP_PULL" -eq 0 ]]; then
  echo "==> fetching origin"
  git fetch --prune origin

  echo "==> fast-forwarding $BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

after_sha=$(git rev-parse --short HEAD)

if [[ "$before_sha" == "$after_sha" && "$SKIP_PULL" -eq 0 ]]; then
  echo "==> already at $after_sha — nothing to deploy"
  echo "    (re-run with --no-pull to force a rebuild)"
  exit 0
fi

echo "==> deploying $before_sha -> $after_sha"
git --no-pager log --oneline "$before_sha..$after_sha" || true

echo "==> building $APP_SERVICE image"
docker compose -f "$COMPOSE_FILE" build "$APP_SERVICE"

echo "==> recreating containers"
docker compose -f "$COMPOSE_FILE" up -d

echo "==> waiting for app container to settle (10s)"
sleep 10
docker compose -f "$COMPOSE_FILE" ps

echo "==> tail of app logs (last 30 lines)"
docker compose -f "$COMPOSE_FILE" logs --tail=30 "$APP_SERVICE"

echo
echo "==> deployed $(git rev-parse --short HEAD) ($(git log -1 --format='%s'))"
