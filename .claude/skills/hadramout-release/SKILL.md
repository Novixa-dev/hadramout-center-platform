---
name: hadramout-release
description: Release, deploy-verification and host/domain move procedure for the Hadhramout Center platform (staging preview, SITE_ENV, cutover-check, backups, rollback). Invoke when merging to master, verifying a deploy, or preparing the move to the new host and domain.
disable-model-invocation: true
---
# Hadhramout release procedure

Facts that drive every step (verified; details in `AGENTS.md` and `docs/05-deploy/03-move-to-new-host-and-domain.md`):
- Merging to `master` deploys by GitHub Actions: image built in CI, shipped over SSH, `deploy.sh` takes a **pre-deploy backup (aborts if it fails)**, health-checks, rolls back on failure.
- The site is a **staging preview** until `SITE_ENV=production`: noindex header + meta, banner, no sitemap in robots.txt.

## 1. Before merging a PR
1. `npm run check` is green locally (the pre-commit hook enforces it) and CI is green on the PR.
2. If it touches routes, headers, config, the proxy or deploy files: `npm run build && npm run smoke` locally (needs a seeded DB in `.smoke-data/`, see `AGENTS.md`).
3. Run `/code-review`; for input-handling changes use the `security-reviewer` subagent; for UI/copy the `arabic-ux-reviewer`.
4. Docs updated: `docs/planning/PROGRESS.md`, `BACKLOG.md`/`FEATURE_PLAN.md`, `CHANGELOG.md`.

## 2. After the deploy finishes (never skip)
```bash
node scripts/cutover-check.mjs https://hadramout-center.novixa.dev --expect staging   # current staging host
node scripts/seo-audit.mjs <url>                                                      # production mode only
curl -s <url>/api/hc/health
```
Expect 0 failures; the `/sw.js` Cloudflare-cache warning is known. Then open the changed pages in a browser (light and dark, phone width).

## 3. Moving to the new host/domain (only after the Center approves)
Follow the runbook phases A-D exactly. The irreversible-looking steps are: set `SITE_ENV=production` (makes the site indexable), recreate the container (`docker compose up -d --force-recreate app`), switch DNS. Run `node scripts/cutover-check.mjs https://FINAL-DOMAIN` (expecting production) immediately; any failure stops the launch. Rollback = DNS back (low TTL) and, if content changed on the new host, `backup.sh` there and restore on the old one.

## 4. Never
- Merge with red or pending CI, or skip the pre-commit hook to push a failing change.
- Put `Disallow: /` in a staging robots.txt (it hides the noindex from crawlers).
- Publish text the Center has not approved as final (About, privacy, terms carry a preview notice until launch).
- Print or commit secrets (`.env`, tokens); production secrets live only on the server and in GitHub Actions secrets.
