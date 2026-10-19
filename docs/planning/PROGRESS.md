# Progress and continuation point

**Last updated:** 2026-10-19 · **Branch:** `claude/audit-and-hardening-20261019` (not merged; `master` deploys on push)
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

## Next actionable tasks (in order)

1. Push the branch, open a PR, let CI run (typecheck, lint, tests, Docker build). Do not merge to `master` until CI is green — merging deploys.
2. Before deploying: rehearse migrations 3–6 on a copy of the production database (done locally in < 1 s) and confirm `backup.sh` runs on the server with the new `legacy-media` coverage and its size.
3. Performance: profile the home page (PERF-T1), then cut its RSC payload (PERF-T2) and move search off the event loop (PERF-T3) — see [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md).
4. Still to write: full security review, per-route SEO matrix, manual accessibility test, an integration/e2e test tier, and the consolidated gap analysis, roadmap and backlog.
5. Data work needing editors: author merges (DATA-006), the 142 uncategorised articles (DATA-004), article dates that are cover-upload months (DATA-001, LEG-002).
6. Hosting of the 63 PDFs that still point at `files.hadramout.center` (LEG-001/MIG-001) — must be solved before the legacy host is retired.

## Blocked on the owner

Cloudflare cache rule and purge token; translation provider credentials; confirmation of the About page and leadership; production domain cutover plan and Search Console; off-server backup destination.
