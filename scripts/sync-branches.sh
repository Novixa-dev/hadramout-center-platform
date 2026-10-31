#!/usr/bin/env bash
# Fast-forward every claude/* branch (remote and local) to origin/master.
# Refuses to touch a branch that is not already contained in master and never forces a push.
# Usage: bash scripts/sync-branches.sh
set -uo pipefail
node "$(dirname "$0")/sync-branches.mjs" "$@"
