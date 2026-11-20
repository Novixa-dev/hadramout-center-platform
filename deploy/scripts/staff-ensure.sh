#!/usr/bin/env bash
# Create missing staff accounts with the tools image. Reads two lines on stdin: the accounts (email[:role[:name]],
# comma-separated) and the starting password. They reach only this shell and the one-off container's environment
# (`-e NAME` without a value copies it from here): never .env, a command line, or the log, which shows counts only.
#   printf '%s\n%s\n' "$STAFF_ACCOUNTS" "$STAFF_PASSWORD" | ./scripts/staff-ensure.sh
set -euo pipefail
cd "$(dirname "$0")/.."
IFS= read -r STAFF_ACCOUNTS || true
IFS= read -r STAFF_PASSWORD || true
IFS= read -r extra || true
if [ -n "${extra:-}" ]; then echo "✗ the accounts must be one line (comma-separated); nothing was changed"; exit 1; fi
if [ -z "${STAFF_ACCOUNTS}" ] || [ -z "${STAFF_PASSWORD}" ]; then echo "✗ STAFF_ACCOUNTS and STAFF_PASSWORD secrets are both needed; nothing was changed"; exit 1; fi
docker image inspect "$(grep -E '^TOOLS_IMAGE=' .env | cut -d= -f2- || true)" >/dev/null 2>&1 \
  || docker image inspect hadramout-center-platform-tools:latest >/dev/null 2>&1 \
  || { echo "✗ tools image missing: run the Deploy workflow with with_tools=true"; exit 1; }
export STAFF_ACCOUNTS STAFF_PASSWORD STAFF_QUIET=1
docker compose run --rm -T -e STAFF_ACCOUNTS -e STAFF_PASSWORD -e STAFF_QUIET tools npm run --silent staff:ensure
