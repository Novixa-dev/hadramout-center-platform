#!/usr/bin/env bash
# Enables free machine translation via Cloudflare Workers AI (10,000 neurons/day, no card).
# Run on the server and paste the API token when asked (it is never echoed or stored anywhere except .env):
#   ssh -t root@SERVER /opt/hadramout-center/scripts/enable-translation.sh
# Token: Cloudflare dashboard > My Profile > API Tokens > Create Token > template "Workers AI".
set -euo pipefail
cd "$(dirname "$0")/.."

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-ccb157d7db356cc07c9f6f0e13e5f2dd}"
MODEL="${CLOUDFLARE_MODEL:-@cf/mistralai/mistral-small-3.1-24b-instruct}"
read -r -s -p "Cloudflare API token (Workers AI): " TOKEN; echo
TOKEN="$(printf %s "$TOKEN" | tr -cd 'A-Za-z0-9_-')"   # keep only valid token characters (drops BOM/CRLF/spaces from a piped clipboard)
[ -n "$TOKEN" ] || { echo "empty token"; exit 1; }

echo "→ testing the token against Workers AI…"
RESP="$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}" \
  -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Translate to English, output only the translation: مرحبا بكم في مركز حضرموت"}],"max_tokens":60}')"
echo "$RESP" | grep -q '"success":true' || { echo "✗ token rejected or model unavailable:"; echo "$RESP" | cut -c1-300; exit 1; }
echo "✓ token works. Sample: $(echo "$RESP" | grep -o '"response":"[^"]*"' | head -1)"

set_kv() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }
cp .env ".env.bak-translation"
set_kv TRANSLATION_PROVIDER cloudflare
set_kv CLOUDFLARE_ACCOUNT_ID "$ACCOUNT_ID"
set_kv CLOUDFLARE_API_TOKEN "$TOKEN"
set_kv CLOUDFLARE_MODEL "$MODEL"
# stay inside the free allocation: ~200k Arabic characters/day (cache keeps every translation forever)
set_kv TRANSLATION_DAILY_CHAR_LIMIT 200000
chmod 600 .env

docker compose up -d app
echo "✓ translation enabled (provider=cloudflare). Visit any page in another language to trigger it."
