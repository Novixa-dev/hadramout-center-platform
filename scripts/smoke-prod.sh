#!/usr/bin/env bash
# Starts the built standalone server (as Docker does) against an existing seeded DB and checks key routes.
# Usage: DB_DIR=./.smoke/data ./scripts/smoke-prod.sh   (after `npm run build`)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SMOKE="${SMOKE_DIR:-${TMPDIR:-/tmp}/hc-smoke}"; APP="$SMOKE/app"; DB_DIR="${DB_DIR:-$SMOKE/data}"; PORT="${PORT:-3100}"
# run in place (copying breaks the symlinks in .next/node_modules on Windows); static assets are build artifacts
APP="$ROOT/.next/standalone"; mkdir -p "$SMOKE"
rm -rf "$APP/.next/static" "$APP/public" && cp -r "$ROOT/.next/static" "$APP/.next/static" && cp -r "$ROOT/public" "$APP/public"
cd "$APP"
NODE_ENV=production PAYLOAD_SECRET="${PAYLOAD_SECRET:-0123456789abcdef0123456789abcdef0123}" DATABASE_URL="file:$DB_DIR/payload.db" DATA_DIR="$DB_DIR" \
  MEDIA_DIR="$DB_DIR/media" SITE_URL="http://localhost:$PORT" TRANSLATION_PROVIDER=none PORT=$PORT HOSTNAME=127.0.0.1 node server.js > "$SMOKE/server.log" 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null' EXIT
for i in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/api/hc/health" && break; sleep 1; done
fail=0
check() { code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$1"); [ "$code" = "$2" ] && echo "ok   $1 $code" || { echo "FAIL $1 $code (want $2)"; fail=1; }; }
check /api/hc/health 200; check /ar 200; check /en 200; check /ar/articles 200; check /ar/articles/909 200; check "/ar/search?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA" 200
check /ar/authors 200; check /ar/timeline 200; check /ar/about 200; check /ar/contact 200; check /ar/saved 200; check /sitemap.xml 200; check /robots.txt 200
check /feeds/ar/all.xml 200; check /articles/9597 301; check /admin 200; check /ar/nope 404; check /nope 307; check /de 200
exit $fail
