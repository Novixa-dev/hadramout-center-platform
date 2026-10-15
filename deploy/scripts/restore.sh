#!/usr/bin/env bash
# Usage: ./scripts/restore.sh /opt/hadramout-center/backups/hadramout-daily-XXXX.tgz
set -euo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?backup archive required}"
read -r -p "This REPLACES the live data with $FILE. Type 'restore' to continue: " ok
[ "$ok" = "restore" ] || exit 1
docker compose stop app
docker compose run --rm --no-deps -v "$(realpath "$FILE"):/restore.tgz:ro" --entrypoint sh app -c "
  cd /data && tar xzf /restore.tgz && cp -f _bk/*.db . && rm -rf _bk"
docker compose up -d app
echo "✓ restored"
