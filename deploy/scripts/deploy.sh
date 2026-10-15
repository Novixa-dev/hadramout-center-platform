#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh <image:tag>   — backs up, switches the app to the image, health-checks, rolls back on failure.
set -euo pipefail
cd "$(dirname "$0")/.."

NEW_IMAGE="${1:?image:tag required}"
docker image inspect "$NEW_IMAGE" >/dev/null 2>&1 || { echo "image $NEW_IMAGE is not loaded on this server"; exit 1; }
touch .env
PREV_IMAGE="$(grep -E '^APP_IMAGE=' .env | cut -d= -f2- || true)"

set_image() {
  if grep -q '^APP_IMAGE=' .env; then sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$1|" .env; else echo "APP_IMAGE=$1" >> .env; fi
}

if docker compose ps -q app 2>/dev/null | grep -q .; then
  echo "→ backup before deploy"
  ./scripts/backup.sh pre-deploy || echo "(backup skipped)"
fi

echo "→ starting $NEW_IMAGE"
set_image "$NEW_IMAGE"
docker compose up -d --remove-orphans app

echo "→ waiting for health"
for i in $(seq 1 40); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then
    echo "✓ healthy ($NEW_IMAGE)"
    # keep the 3 newest app images for rollback, drop the rest
    docker images hadramout-center-platform --format '{{.Repository}}:{{.Tag}}' | grep -v ':latest$' | tail -n +4 | xargs -r docker rmi >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 3
done

echo "✗ unhealthy — rolling back to ${PREV_IMAGE:-<none>}"
docker compose logs --tail 80 app || true
if [ -n "$PREV_IMAGE" ]; then set_image "$PREV_IMAGE"; docker compose up -d app; fi
exit 1
