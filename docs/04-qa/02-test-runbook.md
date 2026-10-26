# Test runbook — every tier, how to run it, what "green" means

**Last updated:** 2026-10-27 · **Who:** any engineer or AI agent continuing the project. Human click-through testing: [01-human-test-guide.md](01-human-test-guide.md).

## Tiers

| Tier | Command | Needs | Green means | Last result |
|---|---|---|---|---|
| Static + unit | `npm run check` | `npm ci` | tsc, ESLint and all unit tests pass (pre-commit hook runs it) | 172/172 (2026-10-27) |
| Dead code | `npm run knip` | — | no unused files, dependencies or exports | clean |
| Production build | `TRANSLATION_PROVIDER=none npm run build` | ~6 GB RAM | build succeeds (`mock` is rejected in production mode on purpose) | ok |
| Runtime smoke | `DB_DIR=<seeded dir> npm run smoke` | a seeded DB copy (`.smoke-data/db`), build | ~72 route/header/regression checks, SEO audit 0 errors, **redirect matrix 0 failed**, staging-mode checks | 72 ok, 1,603 redirect checks |
| Browser journeys | `RUN_E2E=1 DB_DIR=… npm run smoke` or `node scripts/e2e.mjs <url> --expect production\|staging` | Chrome | all journeys (search, saving/offline, filters, language, mobile menu, keyboard, 320–1024 px overflow, clean console) | 55/55 local, 56/56 live |
| Sitemap sweep | `node scripts/site-sweep.mjs <url> --sample 60 --links 120 --expect staging` | — | sampled pages 200, valid metadata, no broken internal links | 77 pages, 0 errors (live) |
| SEO / OG audit | `node scripts/seo-audit.mjs <url> [--expect staging]` | — | 0 errors: titles, descriptions, canonical, hreflang, 1200×630 PNG cards, og:type per page type, JSON-LD, robots, sitemap | 0 errors live |
| Legacy redirects | `node scripts/redirect-matrix.mjs <url> --db <payload.db> [--follow 60]` | a DB with legacy ids | all 1,454 legacy ids 301 to the right page; listings, `/magazine`, trailing slash, cookie language; unknown URLs end in 404 | 1,663 checks, 0 failed |
| Deployment | `node scripts/cutover-check.mjs <url> --expect staging` | — | host, indexing mode, sitemap, redirects, headers, health, REST caps | 39 ok, 1 known warning (Cloudflare caches `/sw.js`) |
| Accessibility | `npm run a11y` (server running) | Chrome | axe: 0 serious/critical on 12 pages | see PROGRESS |
| Performance | GitHub workflow "Lighthouse" (median of 3, clean runner) | — | perf ≥ 80, TBT ≤ 600 ms, CLS ≤ 0.1, a11y ≥ 95 | 93 / 79 ms / 0 / 100 |
| Editorial quality | `npm run quality` | DB | report only (missing authors, categories, dates, zero-result searches) | [QUALITY_REPORT](../reports/QUALITY_REPORT.md) |

## Local setup for the runtime tiers (Windows notes)

```bash
mkdir -p .smoke-data/db && cp data/payload.db data/extras.db .smoke-data/db/ && cp -r data/legacy-media .smoke-data/db/
TRANSLATION_PROVIDER=none npm run build
DB_DIR="$(pwd -W)/.smoke-data/db" SMOKE_DIR="$(pwd -W)/.smoke-data/smoke" RUN_E2E=1 npm run smoke
```

- Use a **copy** of the database: some checks write (search log, reviews).
- On Windows the standalone server's libvips cannot draw text, so `/og/...` cards fall back to the brand image locally; they render on Linux/Docker and in CI. To look at cards on Windows render them through `renderOgCard` in a script (see `tests/unit/seo.test.ts`).
- Stop only the servers you started (by task/PID); never kill every `node` process.

## After every deploy (live)

```bash
L=https://hadramout-center.novixa.dev
node scripts/cutover-check.mjs $L --expect staging
node scripts/seo-audit.mjs $L --expect staging
node scripts/site-sweep.mjs $L --sample 60 --links 120 --expect staging
node scripts/e2e.mjs $L --expect staging
```

CI repeats the build/smoke/e2e tiers on every push; the post-deploy workflow runs the live checks and opens an issue on failure.
