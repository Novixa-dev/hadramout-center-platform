# Progress and continuation point

**Last updated:** 2026-10-20 · **State (2026-10-21):** PRs #12–#20 are merged and deployed to the **staging/review site** `hadramout-center.novixa.dev` (noindex, preview banner, `SITE_ENV` unset). It moves to a new host and domain after the Center approves. All launch gates and their owners: [ROADMAP](ROADMAP.md).
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

## Staging → launch (2026-10-21)

| Change | Evidence |
|---|---|
| Staging-safe by default (noindex header + meta, banner, robots without sitemap) | smoke asserts both modes; unit tests for the helper |
| `scripts/cutover-check.mjs` | run against live staging (39 ok, 1 warning: Cloudflare caches `/sw.js` for 4 h) and in CI |
| Move runbook, Caddy templates, Arabic client checklist | [03-move-to-new-host-and-domain](../05-deploy/03-move-to-new-host-and-domain.md), [client checklist](../06-handover/client-requirements-checklist-ar.md) |

## What changed on 2026-10-21

| Change | Evidence |
|---|---|
| Staging-safe by default, preview banner, `SITE_ENV=production` as the launch switch | smoke asserts both modes; live: `X-Robots-Tag` on every response, robots.txt without sitemap |
| About/privacy/terms marked "awaiting the Center's approval" (preview only) | smoke; live |
| `scripts/cutover-check.mjs` + move runbook + Caddy templates | live staging: 39 ok, 1 warning (Cloudflare caches `/sw.js` 4 h); CI runs it |
| Docker build broke on a hook script (first deploy attempt of #18 failed before shipping; staging unaffected) → fixed; **CI now builds the production image on every PR** | CI `docker` job; deploy of #19 succeeded |
| Pre-commit gate, `CLAUDE.md`, review subagents, release skill | gate tested with a broken file; [research note](../research/CLAUDE_WORKFLOW_BEST_PRACTICES.md) |
| Lighthouse on a clean runner (median of 3): home 93, TBT 79 ms, CLS 0; modeled LCP ≈ 3 s vs **observed ≈ 0.2 s** | [PERFORMANCE_PLAN §0](../quality/PERFORMANCE_PLAN.md); three experiments rejected on evidence |
| ARCH-001 (search blocking) downgraded: ~165 ms warm, ~0.5 s TTFB live like any page | measured on a database copy and live |
| Dependabot (grouped Payload updates, weekly) | `.github/dependabot.yml` |
| Arabic client checklist + meeting agenda | [client-requirements-checklist-ar](../06-handover/client-requirements-checklist-ar.md) |

## Next actionable tasks (in order)

1. **Client meeting:** walk through the staging site and the [checklist](../06-handover/client-requirements-checklist-ar.md); collect the Center's materials and the decisions (domain, host, PDFs, Cloudflare, mail provider, 2FA).
2. **As materials arrive:** enter them (events 2025–26, news, issues, book metadata, About/leadership, legal texts), re-run `npm run quality`, and track the data gates G2/G3 in the [roadmap](ROADMAP.md).
3. **Owner decisions unblock engineering:** PDF hosting (G4, LEG-001), host and domain (G8/G9, runbook), Cloudflare cache rule + purge token (PERF-T4 — the likely real-world speed-up), admin 2FA (SEC-004), deploy user (SEC-005), off-server backups (SEC-007).
4. **Before launch:** manual keyboard and screen-reader pass (G6); restore and rollback rehearsal on the new host (G8); `cutover-check` on the final host (G5/G9).
5. **After launch:** Search Console, field Core Web Vitals (the only valid LCP judge), `npm run quality` weekly for missing pages and zero-result searches.

## Blocked on the owner

Cloudflare cache rule and purge token; translation provider credentials; the Center's approval of About/leadership/legal texts and its materials; domain and hosting decision; off-server backup destination; mail provider for the newsletter.
