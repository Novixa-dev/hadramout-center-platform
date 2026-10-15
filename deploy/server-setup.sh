#!/usr/bin/env bash
# ==============================================================================
# One-time (idempotent) server setup for hadramout-center.novixa.dev.
#
# Run on the VPS as root from a copy of the deploy/ directory:
#   bash deploy/server-setup.sh
#
# 1. Creates /opt/hadramout-center and the Docker network hadramout-center-edge.
# 2. (The app itself is started by the deploy workflow via docker compose.)
# 3. Joins mailcow's nginx to that network (live + persisted in the override).
# 4. Installs the mailcow site block, validated with `nginx -t` and rolled back
#    if the test fails.
# ==============================================================================
set -euo pipefail

SITE=hadramout-center
APP_DIR=/opt/hadramout-center
NETWORK=hadramout-center-edge
MAILCOW_DIR=/opt/mailcow-dockerized
NGINX_CONF_DIR="$MAILCOW_DIR/data/conf/nginx"
OVERRIDE="$MAILCOW_DIR/docker-compose.override.yml"
CERT_SOURCE_DIR="$NGINX_CONF_DIR/pizza-house"   # holds the *.novixa.dev origin cert
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

MAILCOW_NGINX=$(docker ps --filter label=com.docker.compose.service=nginx-mailcow --format '{{.Names}}' | head -n1)
[ -n "$MAILCOW_NGINX" ] || { echo "mailcow nginx container not found" >&2; exit 1; }

echo "==> App directory and edge network"
mkdir -p "$APP_DIR/scripts" "$APP_DIR/backups"
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"
[ -f "$APP_DIR/.env" ] || echo "NOTE: create $APP_DIR/.env from deploy/.env.production.example before the first deploy"
echo "==> Join mailcow nginx to $NETWORK"
if ! docker inspect -f '{{json .NetworkSettings.Networks}}' "$MAILCOW_NGINX" | grep -q "\"$NETWORK\""; then
  docker network connect "$NETWORK" "$MAILCOW_NGINX"
fi
if ! grep -q "$NETWORK" "$OVERRIDE"; then
  cp "$OVERRIDE" "$OVERRIDE.bak.$(date +%Y%m%d%H%M%S)"
  sed -i "/^      pizza-house-edge: {}$/a\\      $NETWORK: {}" "$OVERRIDE"
  printf '  %s:\n    external: true\n' "$NETWORK" >> "$OVERRIDE"
  grep -q "^      $NETWORK: {}$" "$OVERRIDE" || { echo "could not add $NETWORK to $OVERRIDE" >&2; exit 1; }
fi

echo "==> Origin certificate"
if [ ! -f "$NGINX_CONF_DIR/$SITE/origin.pem" ]; then
  install -d -m 755 "$NGINX_CONF_DIR/$SITE"
  install -m 644 "$CERT_SOURCE_DIR/origin.pem" "$NGINX_CONF_DIR/$SITE/origin.pem"
  install -m 600 "$CERT_SOURCE_DIR/origin.key" "$NGINX_CONF_DIR/$SITE/origin.key"
fi

echo "==> Mailcow site block"
TARGET="$NGINX_CONF_DIR/$SITE.conf"
BACKUP=""
if [ -f "$TARGET" ]; then BACKUP="$TARGET.bak"; cp "$TARGET" "$BACKUP"; fi
install -m 644 "$SRC_DIR/nginx/$SITE.conf" "$TARGET"
if ! docker exec "$MAILCOW_NGINX" nginx -t; then
  echo "nginx -t failed — restoring previous site block" >&2
  if [ -n "$BACKUP" ]; then mv "$BACKUP" "$TARGET"; else rm -f "$TARGET"; fi
  exit 1
fi
docker exec "$MAILCOW_NGINX" nginx -s reload
rm -f "$BACKUP"

echo "==> Done: https://hadramout-center.novixa.dev"
