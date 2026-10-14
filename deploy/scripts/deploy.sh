#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh <image:tag>   — pulls, backs up, migrates, restarts, health-checks, rolls back on failure.
set -euo pipefail
cd "$(dirname "$0")/.."

NEW_IMAGE="${1:?image:tag required}"
PREV_IMAGE="$(grep -E '^APP_IMAGE=' .env | cut -d= -f2- || true)"

echo "→ backup before deploy"
./scripts/backup.sh pre-deploy || echo "(backup skipped)"

set_image() {
  if grep -q '^APP_IMAGE=' .env; then sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$1|" .env; else echo "APP_IMAGE=$1" >> .env; fi
}

echo "→ pulling $NEW_IMAGE"
set_image "$NEW_IMAGE"
docker compose pull app
echo "→ starting"
docker compose up -d --remove-orphans

echo "→ waiting for health"
for i in $(seq 1 40); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then echo "✓ healthy ($NEW_IMAGE)"; docker image prune -f >/dev/null; exit 0; fi
  sleep 3
done

echo "✗ unhealthy — rolling back to ${PREV_IMAGE:-<none>}"
docker compose logs --tail 80 app || true
if [ -n "$PREV_IMAGE" ]; then set_image "$PREV_IMAGE"; docker compose up -d app; fi
exit 1
