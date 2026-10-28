#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh <image:tag>
# Backs up, switches the app to the image, health-checks it and rolls back on failure.
# First install: if the data volume has no database yet, it is seeded BEFORE anything live is touched, and the old
# static-site container (same name, from the previous setup) is only replaced once the new app is ready.
set -euo pipefail
cd "$(dirname "$0")/.."

NEW_IMAGE="${1:?image:tag required}"
docker image inspect "$NEW_IMAGE" >/dev/null 2>&1 || { echo "image $NEW_IMAGE is not loaded on this server"; exit 1; }

[ -f .env ] || { echo "missing $(pwd)/.env — create it from .env.production.example (see docs/05-deploy)"; exit 1; }
grep -qE '^PAYLOAD_SECRET=.{32,}' .env || { echo ".env: PAYLOAD_SECRET must be set (openssl rand -hex 32)"; exit 1; }
PREV_IMAGE="$(grep -E '^APP_IMAGE=' .env | cut -d= -f2- || true)"

set_image() {
  if grep -q '^APP_IMAGE=' .env; then sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$1|" .env; else echo "APP_IMAGE=$1" >> .env; fi
}
# compose reads APP_IMAGE from .env; set it now so every `compose run` below uses the new image
set_image "$NEW_IMAGE"

# ── first install: seed the database before switching anything ───────────────────────────────
if ! docker compose run --rm --no-deps --entrypoint sh app -c 'test -f /data/payload.db' >/dev/null 2>&1; then
  echo "→ first install: no database yet"
  docker image inspect hadramout-center-platform-tools:latest >/dev/null 2>&1 \
    || { echo "✗ tools image missing. Re-run the Deploy workflow with with_tools=true (the live site was NOT touched)."; exit 1; }
  grep -qE '^ADMIN_EMAIL=.+' .env && grep -qE '^ADMIN_PASSWORD=.{10,}' .env \
    || { echo "✗ set ADMIN_EMAIL and ADMIN_PASSWORD (10+ chars) in .env first (the live site was NOT touched)."; exit 1; }
  docker compose run --rm tools npm run db:seed
  docker compose run --rm tools npm run import:images || echo "(image mirroring incomplete — missing files are fetched lazily)"
elif docker compose ps -q app 2>/dev/null | grep -q .; then
  echo "→ backup before deploy"
  # A migration may merge/delete rows, so a deploy over an existing database must not proceed without a restorable backup.
  ./scripts/backup.sh pre-deploy || { echo "✗ pre-deploy backup failed — aborting; the live site was NOT touched."; exit 1; }
fi

# ── the mailcow nginx must already proxy to this container on :3000 (otherwise switching = 502) ──
MAILCOW_NGINX="$(docker ps --filter label=com.docker.compose.service=nginx-mailcow --format '{{.Names}}' | head -n1)"
if [ -n "$MAILCOW_NGINX" ] && ! docker exec "$MAILCOW_NGINX" grep -q 'hadramout-center-app:3000' /etc/nginx/conf.d/hadramout-center.conf 2>/dev/null; then
  echo "→ updating the nginx site block (server-setup.sh)"
  if [ "$(id -u)" = 0 ]; then SUDO=""; elif sudo -n true 2>/dev/null; then SUDO="sudo"; else
    echo "✗ nginx still points at the old container. Run once as root:  bash $(pwd)/server/server-setup.sh   (the live site was NOT touched)"; exit 1
  fi
  $SUDO bash server/server-setup.sh
fi

# ── one-time takeover of the container name used by the previous static-site setup ───────────
LEGACY="$(docker inspect -f '{{.Config.Image}}|{{index .Config.Labels "com.docker.compose.project"}}' hadramout-center-app 2>/dev/null || true)"
if [ -n "$LEGACY" ] && [ "${LEGACY#*|}" = "" ]; then
  echo "→ replacing the legacy static container (${LEGACY%%|*})"
  docker rm -f hadramout-center-app >/dev/null
fi

echo "→ starting $NEW_IMAGE"
set_image "$NEW_IMAGE"
docker compose up -d --remove-orphans app

echo "→ waiting for health"
for _ in $(seq 1 40); do
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
