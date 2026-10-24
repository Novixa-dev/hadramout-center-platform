#!/usr/bin/env bash
# Fast-forward every claude/* branch (remote and local) to origin/master. Refuses to touch a branch that is not already contained in
# master (so no work can be lost) and never forces a push. Usage: bash scripts/sync-branches.sh
set -uo pipefail
git fetch -q --prune origin
master=$(git rev-parse origin/master)
skipped=0
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/claude); do
  b=${ref#origin/}
  if git merge-base --is-ancestor "$ref" origin/master; then
    [ "$(git rev-parse "$ref")" = "$master" ] || git push -q origin "master:refs/heads/$b" || skipped=1
  else
    echo "SKIP $b: has commits that are not in master"; skipped=1
  fi
done
cur=$(git rev-parse --abbrev-ref HEAD)
for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
  [ "$b" = "$cur" ] && continue
  if git merge-base --is-ancestor "$b" origin/master; then git branch -qf "$b" origin/master; else echo "SKIP local $b: not contained in master"; skipped=1; fi
done
git fetch -q --prune origin
echo "master is $(git rev-parse --short origin/master); branches differing from it:"
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/claude); do [ "$(git rev-parse "$ref")" = "$master" ] || echo "  $ref"; done
exit $skipped
