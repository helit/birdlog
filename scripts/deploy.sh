#!/usr/bin/env bash
#
# Manual deploy for Birdlog on the TrueNAS host.
#
# Usage (from /var/www/birdlog on the host):
#   ./scripts/deploy.sh           # deploys current `main`
#   ./scripts/deploy.sh --no-pull # skips git pull (re-deploys current HEAD)
#
# Migrations apply automatically when the new container starts
# (see Dockerfile CMD). One-off jobs like `backfill:taxonomy`
# stay manual — run them via `sudo docker compose exec ...` after
# this script finishes (see docs/runbooks/).
#
# Requires sudo for docker — the `henrik` user is not in the docker group
# on TrueNAS SCALE.
# Requires POSTGRES_DATA in the host's root .env (bind-mount path).

set -euo pipefail

REPO_DIR="/var/www/birdlog"
APP_IMAGE="birdlog-app"
APP_SERVICE="app"
BRANCH="main"

SKIP_PULL=0
for arg in "$@"; do
  case "$arg" in
    --no-pull) SKIP_PULL=1 ;;
    -h|--help)
      sed -n '2,14p' "$0"
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

if [[ -n "$(git status --porcelain)" ]]; then
  echo "refusing to deploy: working tree is dirty. Resolve before deploying:" >&2
  git status --short >&2
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

echo "==> building $APP_IMAGE image"
sudo docker build -t "$APP_IMAGE" .

echo "==> recreating $APP_SERVICE container (db left alone)"
sudo docker compose up -d --force-recreate "$APP_SERVICE"

echo "==> waiting for app container to settle (10s)"
sleep 10
sudo docker compose ps

echo "==> tail of app logs (last 30 lines)"
sudo docker compose logs --tail=30 "$APP_SERVICE"

echo
echo "==> deployed $(git rev-parse --short HEAD) ($(git log -1 --format='%s'))"
