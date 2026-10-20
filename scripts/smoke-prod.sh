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
# per-topic and per-author feeds, open catalogue export
check /feeds/ar/topic-54.xml 200
check /feeds/ar/author-146.xml 200
check /feeds/ar/author-99999999.xml 404
check /feeds/ar/topic-abc.xml 404
items=$(curl -s "http://127.0.0.1:$PORT/feeds/ar/author-146.xml" | grep -o '<item>' | wc -l)
[ "$items" -gt 0 ] && echo "ok   author feed has $items items" || { echo "FAIL author feed is empty"; fail=1; }
check "/api/hc/catalog?type=books&format=csv" 200
check "/api/hc/catalog?type=nope" 400
rows=$(curl -s "http://127.0.0.1:$PORT/api/hc/catalog?type=books&format=csv" | wc -l)
[ "$rows" -ge 40 ] && echo "ok   catalogue csv has $rows lines" || { echo "FAIL catalogue csv too short ($rows)"; fail=1; }
curl -s "http://127.0.0.1:$PORT/api/hc/catalog?type=magazines&format=json" | grep -q '"count":4[0-9]' && echo "ok   magazine catalogue json" || { echo "FAIL magazine catalogue json"; fail=1; }
check /favicon.ico 200
# offline support: the worker is served as JavaScript and always revalidated; the offline page is static
check /sw.js 200
check /offline.html 200
sw_headers=$(curl -s -D - -o /dev/null "http://127.0.0.1:$PORT/sw.js" | tr -d '\r')
case "$sw_headers" in *[Cc]ontent-[Tt]ype:*javascript*) echo "ok   sw.js is JavaScript";; *) echo "FAIL sw.js content-type"; fail=1;; esac
case "$sw_headers" in *[Cc]ache-[Cc]ontrol:*no-cache*) echo "ok   sw.js is always revalidated";; *) echo "FAIL sw.js cache-control"; fail=1;; esac
# defaults: Arabic regardless of Accept-Language, dark theme server-rendered (no flash, no JS needed)
lang_redirect=$(curl -s -o /dev/null -w '%{redirect_url}' -H 'Accept-Language: en-US,en;q=0.9' "http://127.0.0.1:$PORT/")
case "$lang_redirect" in */ar) echo "ok   default language ar (Accept-Language en ignored)";; *) echo "FAIL default language: $lang_redirect"; fail=1;; esac
home=$(curl -s "http://127.0.0.1:$PORT/ar")
case "$home" in *'<html lang="ar" dir="rtl" data-theme="dark"'*) echo "ok   dark theme is the server-rendered default";; *) echo "FAIL html element is not dark by default"; fail=1;; esac
case "$home" in *'id="hc-theme-color" name="theme-color" content="#0e1815"'*) echo "ok   theme-color meta is dark";; *) echo "FAIL theme-color meta"; fail=1;; esac
curl -s "http://127.0.0.1:$PORT/manifest.webmanifest" | grep -q '"theme_color":"#0e1815"' && echo "ok   manifest colors are dark" || { echo "FAIL manifest colors"; fail=1; }
body() { curl -s "http://127.0.0.1:$PORT$1"; }
clamp=$(curl -s -o /dev/null -w '%{redirect_url}' "http://127.0.0.1:$PORT/api/news?limit=1000&depth=3")
case "$clamp" in *limit=100*depth=2*) echo "ok   clamp target $clamp";; *) echo "FAIL clamp target '$clamp'"; fail=1;; esac
body /feeds/en/all.xml | grep -q '<title>Hadhramout' && echo "ok   English feed channel title" || { echo "FAIL English feed channel title"; fail=1; }
sug=$(body "/api/hc/suggest?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA&lang=")
case "$sug" in *'"href":"/ar/'*) echo "ok   typeahead falls back to ar and returns hits";; *'"href":"//'*) echo "FAIL typeahead produced a protocol-relative href"; fail=1;; *) echo "FAIL typeahead returned no hits: $sug" | cut -c1-160; fail=1;; esac
body /api/hc/health | grep -q '"users"' && { echo "FAIL health discloses user existence"; fail=1; } || echo "ok   health body"
body /ar/articles | grep -q "المرجع : مجلة" && { echo "FAIL citation boilerplate leaked into the list"; fail=1; } || echo "ok   no citation boilerplate in cards"
# the editorial quality report must run against the seeded database
qr=$(DATA_DIR="$DB_DIR" DATABASE_URL="file:$DB_DIR/payload.db" node "$ROOT/scripts/quality-report.mjs" 2>&1)
case "$qr" in *"## Articles"*"## Books and issues"*) echo "ok   quality report runs";; *) echo "FAIL quality report: $(echo "$qr" | head -3)"; fail=1;; esac
case "$qr" in *"## Skipped checks"*) echo "FAIL quality report skipped checks (schema changed?)"; fail=1;; esac
# metadata, canonical, JSON-LD, robots and sitemap on every route type (fails on errors, not warnings)
if [ "${SEO_AUDIT:-1}" = 1 ]; then
  (cd "$ROOT" && node scripts/seo-audit.mjs "http://localhost:$PORT" | tail -8) || fail=1
fi
exit $fail
