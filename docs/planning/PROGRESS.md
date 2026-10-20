# Progress and continuation point

**Last updated:** 2026-10-20 · **State:** hardening pass deployed 2026-10-19 (PR #12, #13). Open and green: PR #14 (CI runtime tier, search cache, favicon, backlog/roadmap), PR #15 (Payload 3.91.0) and PR #16 (dark default and features), stacked in that order. Merging deploys; the user merges.
**Related:** [BASELINE_REPORT](../reports/BASELINE_REPORT.md) · [RELEASE_READINESS](../reports/RELEASE_READINESS.md) · [architecture audit](../architecture/SYSTEM_ARCHITECTURE.md) · [data audit](../architecture/DATA_MODEL_AND_TAXONOMY.md) · [migration plan](../migration/CONTENT_MIGRATION_PLAN.md)

## Audit coverage

| Area | Status | Document |
|---|---|---|
| Legacy inventory and parity | DONE (counts verified against the live legacy site) | [LEGACY_SITE_INVENTORY](../audit/LEGACY_SITE_INVENTORY.md) |
| Comparable sites and standards | DONE | [COMPETITOR_AND_BEST_PRACTICES_REVIEW](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| Architecture and code quality | DONE | [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md) |
| Data model, taxonomy, IA | DONE | [DATA_MODEL_AND_TAXONOMY](../architecture/DATA_MODEL_AND_TAXONOMY.md), [INFORMATION_ARCHITECTURE](../architecture/INFORMATION_ARCHITECTURE.md) |
| Content migration and redirects | DONE | [migration/](../migration/) |
| Performance | PARTIAL — lab baseline measured, plan written (single runs; field data and a profiled trace still missing) | [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md) |
| Functional edge cases, security, SEO, accessibility | PARTIAL — production edge-case probes, header/exposure spot checks, local SEO-script and axe runs are recorded; the full security review, per-route SEO matrix, manual keyboard/screen-reader testing and an integration/e2e test tier are NOT done | [CURRENT_STATE_AUDIT](../audit/CURRENT_STATE_AUDIT.md) |
| Consolidated gap analysis, roadmap, backlog | **NOT DONE** — per-area task tables exist inside the documents above (e.g. DATA tasks T1–T10) | none yet |

Findings from the finished audits were **not** adversarially re-verified (the verification agents hit the same limit); treat severity as the auditor's claim backed by the cited evidence.

## Implemented in this pass (all verified by `npm run check` and a local production build)

| Finding | Change |
|---|---|
| SEC/ARCH-004 | REST reads capped at `limit<=100`, `depth<=2` (`limit=0` no longer unlimited); GraphQL switched off and its routes removed; `maxDepth: 3` |
| ARCH-023 | `/api/hc/health` no longer reveals whether users exist or raw error text |
| MIG-003 | Backups now include `legacy-media` (4,473 mirrored images); a failing `tar` fails the backup |
| DATA-010 | Deploy aborts when the pre-deploy backup fails (migrations may merge/delete rows) |
| ARCH-005/006 | Only 404/403 from Payload mean "not found"; other failures surface as 5xx; implausible ids → 404; route error boundary added |
| RES-001/002 | Magazine citations/JSON-LD use the periodical name; external image URLs no longer get the site origin prepended |
| DATA-002 | The migrated "المرجع … اضغط هنا" citation line is dropped from descriptions, cards, JSON-LD and feeds (714/714 real excerpts) |
| DATA-005 | Importer keeps a title with its name when splitting a byline on `/` |
| ARCH-007 | ESLint rules now apply to `.tsx` |
| SEO | List pages beyond the last page now return 404 (verified on a local build: article list has 46 pages; page 50 → 404) |

## Added after the first deploy (PR #14, #15)

| Change | Evidence |
|---|---|
| CI seeds a database from the snapshot, starts the standalone server and runs the smoke script + SEO audit | green on Linux (first run 2m15s); the script also guards the fixed defects |
| Search result cache (60 s, cleared by index writes) and rate-limited, validated typeahead | 4 unit tests; repeated slowest query ~0.2 s page time (was >1 s of blocked CPU) |
| `/favicon.ico`, translated RSS channel title, bounded `search_queries` | checked in smoke |
| Event JSON-LD only with a start date (otherwise CreativeWork) | unit tests |
| Payload 3.90.2 → 3.91.0 (+ 13-index migration, up/down tested) | check, build, smoke, admin login on the upgraded build; CI green; first CI attempt failed on a lockfile without peer packages and was fixed |
| Backlog (101 findings) and roadmap | [BACKLOG](BACKLOG.md), [ROADMAP](ROADMAP.md) |

Production was re-verified after the first deploy: health, GraphQL 404, REST clamp redirect on the public host, pagination 404, SEO audit 0 errors, citation fixes visible.

## Added in PR #16 (stacked on #15)

| Change | Evidence |
|---|---|
| Dark theme default (server-rendered) and Arabic default guarded | smoke checks; live check that `Accept-Language` is ignored |
| Copy with attribution; open catalogue CSV/JSON; saved list RIS/BibTeX/CSL-JSON; per-topic/author feeds | unit tests + smoke |
| High-contrast mode (AAA tokens, forced-colors) and maintenance mode (503 + Retry-After) | contrast unit tests; tested on the standalone server on and off |
| Offline support for saved articles (conservative service worker) | 11 sandbox tests + smoke |
| `npm run quality` editorial report + zero-result search analytics | report snapshot in docs/reports/QUALITY_REPORT.md; runs in smoke |
| [FEATURE_PLAN](FEATURE_PLAN.md), [SECURITY_REVIEW](../security/SECURITY_REVIEW.md), launch asset drafts | docs |
| Catalogue type validation fix (`?type=constructor` was a 500) | found by the security review, tested |

## Next actionable tasks (in order)

1. Merge #14, then #15, then #16 when ready (each deploy takes a pre-deploy backup and aborts if it fails). After #15 check `/admin` login and the 13 new indexes; after #16 check the dark default, `/sw.js`, `/offline.html`, `/api/hc/catalog` and the new feeds on the live site.
2. Before deploying: rehearse migrations 3–6 on a copy of the production database (done locally in < 1 s) and confirm `backup.sh` runs on the server with the new `legacy-media` coverage and its size.
3. Performance: profile the home page (PERF-T1), then cut its RSC payload (PERF-T2) and move search off the event loop (PERF-T3) — see [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md).
4. Still to write: full security review, per-route SEO matrix and manual accessibility test. The consolidated register is [BACKLOG](BACKLOG.md) (101 findings: 63 ready, 6 partial, 18 blocked, 14 done) and the ordering is in [ROADMAP](ROADMAP.md). The runtime test tier now exists (CI seeds a database and smoke-tests the built server).
5. Data work needing editors: author merges (DATA-006), the 142 uncategorised articles (DATA-004), article dates that are cover-upload months (DATA-001, LEG-002).
6. Hosting of the 63 PDFs that still point at `files.hadramout.center` (LEG-001/MIG-001) — must be solved before the legacy host is retired.

## Blocked on the owner

Cloudflare cache rule and purge token; translation provider credentials; confirmation of the About page and leadership; production domain cutover plan and Search Console; off-server backup destination.
