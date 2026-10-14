#!/usr/bin/env bash
# Consistent backup of the SQLite databases + uploaded media. Keeps the last 14 archives.
# Usage: ./scripts/backup.sh [label]   — run daily from cron:  15 3 * * * /opt/hadramout/scripts/backup.sh daily
set -euo pipefail
cd "$(dirname "$0")/.."
LABEL="${1:-manual}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${BACKUP_DIR:-/opt/hadramout/backups}"
mkdir -p "$DEST"
APP="$(docker compose ps -q app)"
[ -n "$APP" ] || { echo "app container is not running"; exit 1; }

# sqlite3 .backup gives a consistent snapshot even while the app is writing (node:sqlite VACUUM INTO as fallback)
docker exec "$APP" node -e "
const {DatabaseSync}=require('node:sqlite');const fs=require('fs');
fs.mkdirSync('/data/_bk',{recursive:true});
for (const f of ['payload.db','extras.db']) { if(!fs.existsSync('/data/'+f)) continue; try{fs.unlinkSync('/data/_bk/'+f);}catch{}
  const d=new DatabaseSync('/data/'+f); d.exec(\"VACUUM INTO '/data/_bk/\"+f+\"'\"); d.close(); }
"
docker exec "$APP" sh -c "cd /data && tar czf /tmp/bk.tgz _bk media i18n 2>/dev/null || tar czf /tmp/bk.tgz _bk"
docker cp "$APP:/tmp/bk.tgz" "$DEST/hadramout-$LABEL-$STAMP.tgz"
docker exec "$APP" sh -c "rm -rf /data/_bk /tmp/bk.tgz"
ls -1t "$DEST"/hadramout-*.tgz | tail -n +15 | xargs -r rm -f
echo "✓ $DEST/hadramout-$LABEL-$STAMP.tgz"
