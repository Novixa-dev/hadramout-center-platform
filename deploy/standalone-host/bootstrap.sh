#!/usr/bin/env bash
# One-time, idempotent preparation of a standalone host (no mailcow). Run as root from a copy of the deploy/ directory:
#   sudo bash deploy/standalone-host/bootstrap.sh
# Creates the app directory, the Docker network shared by the app and Caddy, and /opt/caddy with the proxy files.
set -euo pipefail

APP_DIR=/opt/hadramout-center
CADDY_DIR=/opt/caddy
NETWORK=hadramout-center-edge
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

command -v docker >/dev/null || { echo "docker is not installed" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "the docker compose plugin is not installed" >&2; exit 1; }

install -d -m 755 "$APP_DIR" "$APP_DIR/scripts" "$APP_DIR/backups" "$APP_DIR/server" "$CADDY_DIR"
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null
install -m 644 "$SRC_DIR/Caddyfile" "$CADDY_DIR/Caddyfile"
install -m 644 "$SRC_DIR/docker-compose.caddy.yml" "$CADDY_DIR/docker-compose.caddy.yml"

cat <<EOF
Ready.
  1. Create $APP_DIR/.env from deploy/.env.production.example (copy PAYLOAD_SECRET from the old server; keep SITE_ENV=staging until launch).
  2. Restore the data volume, then deploy from GitHub Actions (see docs/05-deploy/03-move-to-new-host-and-domain.md, phase B).
  3. Start the proxy:  cd $CADDY_DIR && SITE_HOST=<domain> ACME_EMAIL=<email> docker compose -f docker-compose.caddy.yml up -d
  4. Nightly backups:  15 3 * * * $APP_DIR/scripts/backup.sh daily   (and copy the archives off this server)
EOF
