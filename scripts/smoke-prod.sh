#!/usr/bin/env bash
# Starts the built standalone server (as Docker does) against an existing seeded DB and checks key routes.
# Usage: DB_DIR=./.smoke/data ./scripts/smoke-prod.sh   (after `npm run build`)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SMOKE="${SMOKE_DIR:-${TMPDIR:-/tmp}/hc-smoke}"; APP="$SMOKE/app"; DB_DIR="${DB_DIR:-$SMOKE/data}"; PORT="${PORT:-3100}"
# run in place (copying breaks the symlinks in .next/node_modules on Windows); static assets are build artifacts
APP="$ROOT/.next/standalone"; mkdir -p "$SMOKE"
rm -rf "$APP/.next/static" "$APP/public" && cp -r "$ROOT/.next/static" "$APP/.next/static" && cp -r "$ROOT/public" "$APP/public"
rm -rf "$APP/.next/server/route-cache"   # pages cached at runtime by earlier runs: they bake in the host, port and SITE_ENV they were rendered with
cd "$APP"
# start_server PORT [SITE_ENV]: the standalone server exactly as Docker runs it; prints the pid. SITE_ENV unset = staging behaviour.
start_server() {
  local port="$1" site_env="${2:-}"
  env NODE_ENV=production PAYLOAD_SECRET="${PAYLOAD_SECRET:-0123456789abcdef0123456789abcdef0123}" DATABASE_URL="file:$DB_DIR/payload.db" DATA_DIR="$DB_DIR" \
    MEDIA_DIR="$DB_DIR/media" SITE_URL="http://localhost:$port" TRANSLATION_PROVIDER=none PORT="$port" HOSTNAME=127.0.0.1 ${site_env:+SITE_ENV=$site_env} \
    node server.js > "$SMOKE/server-$port.log" 2>&1 &
  echo $!
}
wait_healthy() { for i in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:$1/api/hc/health" && return 0; sleep 1; done; return 1; }
# the main run is a production-mode server (indexable): every route/SEO check below assumes it; staging behaviour is asserted at the end
STAGING_PID=""
PID=$(start_server "$PORT" production); trap 'kill $PID $STAGING_PID 2>/dev/null' EXIT
wait_healthy "$PORT"
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
check "/api/hc/catalog?type=constructor" 400     # inherited object keys are not catalogue types
check "/api/hc/catalog?type=__proto__" 400
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
# one retry on an empty answer: the first request to a freshly built server (cold caches) once came back empty and failed a check that passes on rerun
body() { local r; r=$(curl -s "http://127.0.0.1:$PORT$1"); if [ -z "$r" ]; then sleep 2; r=$(curl -s "http://127.0.0.1:$PORT$1"); fi; printf '%s' "$r"; }
clamp=$(curl -s -o /dev/null -w '%{redirect_url}' "http://127.0.0.1:$PORT/api/news?limit=1000&depth=3")
case "$clamp" in *limit=100*depth=2*) echo "ok   clamp target $clamp";; *) echo "FAIL clamp target '$clamp'"; fail=1;; esac
# capture first: `grep -q` quits at the first match, the 34 KB feed then hits a closed pipe and `pipefail` reported a failure at random
en_feed=$(body /feeds/en/all.xml)
case "$en_feed" in *'<title>Hadhramout'*) echo "ok   English feed channel title";; *) echo "FAIL English feed channel title"; fail=1;; esac
sug=$(body "/api/hc/suggest?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA&lang=")
case "$sug" in *'"href":"/ar/'*) echo "ok   typeahead falls back to ar and returns hits";; *'"href":"//'*) echo "FAIL typeahead produced a protocol-relative href"; fail=1;; *) echo "FAIL typeahead returned no hits: $sug" | cut -c1-160; fail=1;; esac
body /api/hc/health | grep -q '"users"' && { echo "FAIL health discloses user existence"; fail=1; } || echo "ok   health body"
body /ar/articles | grep -q "المرجع : مجلة" && { echo "FAIL citation boilerplate leaked into the list"; fail=1; } || echo "ok   no citation boilerplate in cards"
# production mode is indexable and has no preview banner (also on the prerendered 404 page)
prod_headers=$(curl -s -D - -o /dev/null "http://127.0.0.1:$PORT/ar" | tr -d '\r')
case "$prod_headers" in *[Xx]-[Rr]obots-[Tt]ag:*) echo "FAIL production sends X-Robots-Tag"; fail=1;; *) echo "ok   production has no X-Robots-Tag";; esac
prod_home=$(curl -s "http://127.0.0.1:$PORT/ar")
case "$prod_home" in *'class="staging-bar"'*) echo "FAIL production shows the preview banner"; fail=1;; *) echo "ok   production has no preview banner";; esac
case "$(curl -s "http://127.0.0.1:$PORT/ar/nope")" in *'class="staging-bar"'*) echo "FAIL preview banner frozen into the 404 page"; fail=1;; *) echo "ok   404 page has no preview banner";; esac
case "$prod_home" in *'name="robots" content="index, follow'*) echo "ok   production pages are indexable";; *) echo "FAIL production meta robots"; fail=1;; esac
case "$(curl -s "http://127.0.0.1:$PORT/robots.txt")" in *"Sitemap: http://localhost:$PORT/sitemap.xml"*) echo "ok   production robots.txt advertises the sitemap";; *) echo "FAIL production robots.txt"; fail=1;; esac

# pages with unapproved wording carry a notice in the preview only
case "$(curl -s "http://127.0.0.1:$PORT/ar/about")" in *data-review-notice*) echo "FAIL production shows the draft-approval notice"; fail=1;; *) echo "ok   production has no draft-approval notice";; esac

# the cutover check (used for the move to a new host/domain) must pass against this production-mode server
cc=$(node "$ROOT/scripts/cutover-check.mjs" "http://localhost:$PORT" --expect production 2>&1); cc_status=$?
[ "$cc_status" = 0 ] && echo "ok   cutover-check: $(echo "$cc" | tail -1)" || { echo "FAIL cutover-check"; echo "$cc" | grep -E "^(FAIL|cutover)"; fail=1; }

# staging mode (SITE_ENV unset): noindex everywhere, banner, no sitemap advertised, nothing blocked by Disallow (it would hide the noindex)
STAGING_PORT=$((PORT + 1)); STAGING_PID=$(start_server "$STAGING_PORT")
if wait_healthy "$STAGING_PORT"; then
  S="http://127.0.0.1:$STAGING_PORT"
  for path in /ar /ar/articles/909 /sitemap.xml /feeds/ar/all.xml /api/hc/health /favicon.ico; do
    case "$(curl -s -D - -o /dev/null "$S$path" | tr -d '\r')" in *[Xx]-[Rr]obots-[Tt]ag:*noindex*) echo "ok   staging X-Robots-Tag on $path";; *) echo "FAIL staging X-Robots-Tag missing on $path"; fail=1;; esac
  done
  # a dynamically rendered page: the home page is cached on disk per build directory and both test servers share it
  staging_home=$(curl -s "$S/ar/articles")
  case "$staging_home" in *'name="robots" content="noindex, nofollow'*) echo "ok   staging meta robots noindex";; *) echo "FAIL staging meta robots"; fail=1;; esac
  case "$staging_home" in *'class="staging-bar"'*) echo "ok   staging shows the preview banner";; *) echo "FAIL staging banner missing"; fail=1;; esac
  for page in about privacy terms; do
    case "$(curl -s "$S/ar/$page")" in *data-review-notice*) echo "ok   staging marks /ar/$page as awaiting approval";; *) echo "FAIL staging notice missing on /ar/$page"; fail=1;; esac
  done
  staging_robots=$(curl -s "$S/robots.txt")
  case "$staging_robots" in *[Ss]itemap:*) echo "FAIL staging robots.txt advertises a sitemap"; fail=1;; *) echo "ok   staging robots.txt has no sitemap";; esac
  echo "$staging_robots" | grep -q -i -E '^disallow: */ *$' && { echo "FAIL staging robots.txt blocks everything (noindex would be invisible)"; fail=1; } || echo "ok   staging robots.txt does not disallow the site"
else
  echo "FAIL staging server did not start"; fail=1
fi
kill "$STAGING_PID" 2>/dev/null

# the editorial quality report must run against the seeded database
qr=$(DATA_DIR="$DB_DIR" DATABASE_URL="file:$DB_DIR/payload.db" node "$ROOT/scripts/quality-report.mjs" 2>&1)
case "$qr" in *"## Articles"*"## Books and issues"*) echo "ok   quality report runs";; *) echo "FAIL quality report: $(echo "$qr" | head -3)"; fail=1;; esac
case "$qr" in *"## Skipped checks"*) echo "FAIL quality report skipped checks (schema changed?)"; fail=1;; esac
# metadata, canonical, JSON-LD, robots and sitemap on every route type (fails on errors, not warnings)
if [ "${SEO_AUDIT:-1}" = 1 ]; then
  (cd "$ROOT" && node scripts/seo-audit.mjs "http://localhost:$PORT" | tail -8) || fail=1
fi
# every legacy id of the old site must 301 to its new page (MIG-007); the other old URL shapes must not soft-404
(cd "$ROOT" && node scripts/redirect-matrix.mjs "http://127.0.0.1:$PORT" --db "$DB_DIR/payload.db" --follow 40 | tail -6) || fail=1
# real-browser journeys and a sitemap-sample sweep (needs Chrome: CI runners have it; locally set RUN_E2E=1)
if [ "${RUN_E2E:-0}" = 1 ]; then
  (cd "$ROOT" && node scripts/e2e.mjs "http://localhost:$PORT" --expect production | tail -14) || fail=1
  (cd "$ROOT" && node scripts/site-sweep.mjs "http://localhost:$PORT" --sample 60 --links 120 --expect production | tail -14) || fail=1
fi
exit $fail
