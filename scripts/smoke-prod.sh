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

# regression checks for fixed defects (see docs/planning/PROGRESS.md)
check /api/graphql 404                                   # GraphQL is disabled
check "/api/news?limit=1000&depth=3" 307                  # REST page size/depth are clamped by redirect
check /ar/articles/99999999999999999999 404              # implausible id is a 404, not a 500
check /ar/articles/2147483648 404
check "/ar/articles?page=9999" 404                       # page beyond the last one does not exist
check /ar/articles/0 404
check /feeds/zz/all.xml 404
check /favicon.ico 200
body() { curl -s "http://127.0.0.1:$PORT$1"; }
clamp=$(curl -s -o /dev/null -w '%{redirect_url}' "http://127.0.0.1:$PORT/api/news?limit=1000&depth=3")
case "$clamp" in *limit=100*depth=2*) echo "ok   clamp target $clamp";; *) echo "FAIL clamp target '$clamp'"; fail=1;; esac
body /feeds/en/all.xml | grep -q '<title>Hadhramout' && echo "ok   English feed channel title" || { echo "FAIL English feed channel title"; fail=1; }
body /api/hc/health | grep -q '"users"' && { echo "FAIL health discloses user existence"; fail=1; } || echo "ok   health body"
body /ar/articles | grep -q "المرجع : مجلة" && { echo "FAIL citation boilerplate leaked into the list"; fail=1; } || echo "ok   no citation boilerplate in cards"
# metadata, canonical, JSON-LD, robots and sitemap on every route type (fails on errors, not warnings)
if [ "${SEO_AUDIT:-1}" = 1 ]; then
  (cd "$ROOT" && node scripts/seo-audit.mjs "http://localhost:$PORT" | tail -8) || fail=1
fi
exit $fail
