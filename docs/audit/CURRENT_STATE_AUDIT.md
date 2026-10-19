# Current-state audit

**Purpose:** one place stating what was verified about the rebuild, by area, with links to the detailed evidence. **Status:** partial — see "Coverage". **Last updated:** 2026-10-19
**Source of truth for open work:** [PROGRESS](../planning/PROGRESS.md). Detailed findings live in the area documents; this file does not repeat them.

## Coverage

| Area | State | Evidence |
|---|---|---|
| Legacy parity | Audited, counts verified | [LEGACY_SITE_INVENTORY](LEGACY_SITE_INVENTORY.md) |
| Architecture / code | Audited | [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md) |
| Data model / taxonomy / IA | Audited | [DATA_MODEL_AND_TAXONOMY](../architecture/DATA_MODEL_AND_TAXONOMY.md), [INFORMATION_ARCHITECTURE](../architecture/INFORMATION_ARCHITECTURE.md) |
| Migration / redirects | Audited | [migration/](../migration/) |
| Benchmarks / standards | Done | [research review](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| Performance | Measured (lab, one run per page) | [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md) |
| Functional edge cases | Probed on production (below) | this file |
| SEO | Script audit passes on the local build; the per-route matrix was not written | [BASELINE_REPORT](../reports/BASELINE_REPORT.md) |
| Security | Spot-checked (below); full review not written | this file, [PROGRESS](../planning/PROGRESS.md) |
| Accessibility | axe on 12 pages clean; Lighthouse a11y 100 on 5 pages; no manual keyboard or screen-reader test | – |
| Tests / CI | CI runs install, typecheck, lint, unit tests and build; there is no integration or e2e tier (`test:int` points at a missing directory) | `.github/workflows/ci.yml` |

## Verified strengths

- Layering is sound: 0 import cycles in 127 modules, strict TypeScript, no `ts-ignore` or `any`, one sanitizer allow-list (architecture audit).
- Content fidelity: counts, ids, titles, dates, body length and attribution match the legacy source for all migrated items; the 7 legacy-listed items that are missing were empty shells in the source.
- Legacy URLs: 301 to the new canonical URL for all seven types in the sample; unmigrated ids get a 302 to the listing.
- Edge: `X-Forwarded-For` is overwritten from `CF-Connecting-IP`, so rate-limit keys cannot be spoofed. CSP, HSTS, `nosniff`, COOP and frame-ancestors are set.
- `legacy-media` proxy: fixed upstream origin, path allow-list, no traversal, redirects refused, SVG sandboxed.
- Lighthouse accessibility 100 and SEO 100 on the indexable pages tested.

## Production probes (GET only, 2026-10-19; production runs a build older than `master`)

| Probe | Result | Verdict |
|---|---|---|
| `/ar/articles/0`, `/-1`, `/1.5`, unknown path, `/ar/ARTICLES` | 404 | OK |
| `/xx/articles`, `/feeds/zz/all.xml` | 307 to `/ar/xx/articles` (then 404); 404 | Acceptable; one extra hop |
| `/ar/articles/` | 308 to the no-slash URL | OK |
| `?page=0`, `abc`, `-1` | 200, canonical = list, indexable | OK |
| `?page=99999` | 200 empty state, `noindex` | Soft 404 → fixed on this branch (now 404) |
| `/articles/9597` (legacy) | 301 to `/ar/articles/909` | OK |
| `/news/10300` (legacy spam item, not migrated) | 302 to `/ar/news` | By design |
| `/favicon.ico` | 404 | Low: `<link rel=icon>` tags exist |
| `/.env` | 404 page | OK |
| `/.git/config` | 307 to a language page, no content | OK |
| `/api/users` anonymous | 403 | OK |
| `/api/news?limit=1000&depth=3` | 200, 1.4 MB | Fixed on this branch (capped) |
| `/api/graphql` GET | 405 | GraphQL removed on this branch |
| `/api/hc/health` | discloses `users: true` | Fixed on this branch |
| Headers | CSP has `script-src 'self' 'unsafe-inline'`; `Accept-CH`/`Critical-CH` still sent (older build) | `unsafe-inline` open; client hints already removed in `master` |

## Open risks worth a decision

1. Merging deploys. Migration 4 merges duplicate categories irreversibly, so take a backup and rehearse on a server copy first (rehearsed locally only).
2. 63 PDFs are hot-linked to `files.hadramout.center`; if the legacy host goes away they break (LEG-001, MIG-001).
3. Article "publication dates" are mostly the cover-upload month and feed citations and JSON-LD (DATA-001, LEG-002).
4. Anonymous traffic can consume the translation budget up to the 600 per hour site-wide cap (ARCH-009 to ARCH-011).
5. `script-src 'unsafe-inline'` weakens the CSP; a nonce-based policy requires dynamic rendering of every page.
