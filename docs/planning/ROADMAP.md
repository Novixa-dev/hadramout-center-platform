# Roadmap

**Purpose:** dependency-ordered phases from the current state to a launch-ready platform that can replace `hadramout.center`. Task detail lives in [BACKLOG](BACKLOG.md); this file orders it.
**Last updated:** 2026-10-20 · **Status:** the platform is live at `hadramout-center.novixa.dev` (redesign v3 + hardening deployed 2026-10-19); the legacy domain has not been switched.
**Related:** [PROGRESS](PROGRESS.md) · [RELEASE_READINESS](../reports/RELEASE_READINESS.md) · [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md)

## Phase status

| Phase | Goal | State |
|---|---|---|
| A. Safety and baseline | Known-good tooling, written baseline, git hygiene | **DONE** — [BASELINE_REPORT](../reports/BASELINE_REPORT.md) |
| B. Critical repairs | Close exposure and failure modes found by the audit | **DONE** for everything that did not need outside input (REST cap, GraphQL off, health, not-found vs failure, backups) |
| C. Legacy parity and migration | Nothing the old site offered is lost; URLs keep working | **PARTIAL** — content and redirects verified; PDFs still hot-linked (blocked) |
| D. Architecture and code quality | Maintainable, tested core | **PARTIAL** — CI runtime tier added; engine/hooks untested; 4 duplicated "translation ready" rules |
| E. Content and discovery | Taxonomy, related content, search quality | **READY/BLOCKED** — vocabulary and author curation need editors |
| F. Design and experience | Responsive, accessible, fast | **PARTIAL** — design v3 live; home page performance below target |
| G. SEO and metadata | Complete, correct, verified on every route type | **MOSTLY DONE** — script audit clean on production; cutover steps pending |
| H. Testing and hardening | Regression safety net | **PARTIAL** — see Phase H |
| I. Release and cutover | Replace the legacy domain safely | **BLOCKED** on owner decisions |

## Phase C — Legacy parity and migration

| Order | Task | Backlog | Needs |
|---|---|---|---|
| 1 | Decide hosting for the 63 PDFs, then mirror them and rewrite links | LEG-001, MIG-001 | owner decision, storage |
| 2 | Obtain the forum brochure PDF and the source of video 2 | LEG-004, MIG-011, LEG-009 | the Center |
| 3 | Redirect matrix test for all seven legacy types | MIG-007, QA-3 | none |
| 4 | Fix the two news images that 404 and the mirror coverage check | MIG-002, LEG-005 | none |
| 5 | Replace `hadramout.center/magazines/{id}` links inside 801 documents | MIG-010 | none (data migration, back up first) |

## Phase D — Architecture and code quality

| Order | Task | Backlog |
|---|---|---|
| 1 | Search/typeahead FTS off the event loop (the one high-severity open code finding) | ARCH-001, PERF-T3 |
| 2 | One `translationState()` used by pages, sitemap and the API | ARCH-012 |
| 3 | Atomic translation budget accounting; retry policy honours `retryable` (verify the Payload jobs API first) | ARCH-009, ARCH-010 |
| 4 | Use generated Payload types instead of 77 casts | ARCH-008 |
| 5 | Replace the stale architecture/ADR text (Fastify, Quill, Caddy) | ARCH-018 |
| 6 | Tests for translation engine, hooks, rate limiter, legacy media | ARCH-019 |

## Phase E — Content and discovery

All items need editors or Center approval first: real article dates (DATA-001), subject/place/period vocabulary (DATA-003), uncategorised articles (DATA-004), author merges (DATA-006), event data after 2024-11 (DATA-007). Safe engineering work while waiting: slugs in URLs (DATA-008), related content rules (DATA-009).

## Phase F — Performance and UX

Follow [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md): repeat the profile on a quiet machine or CI runner, find what drives 2.6 s of style/layout on the home page, decide card counts with the Center, add the Cloudflare cache rule (owner token), collect field data. Target: home mobile performance ≥ 80, LCP ≤ 2.5 s, TBT ≤ 600 ms.

## Phase G — SEO

| Task | Backlog | State |
|---|---|---|
| JSON-LD correctness (event address/start date, date precision, author honorifics) | RES-003/004/005 | READY |
| Scholar: PDF on the same host/path as the abstract page | RES-006 | depends on PDF hosting |
| Sitemap hygiene (index per type, drop `priority`) | RES-007 | READY |
| Cutover steps: flip `SITE_URL`, 301 map, Search Console, sitemap submission, change of address | MIG-008 | BLOCKED (owner) |

## Phase H — Testing and hardening

Done: CI seeds a database and probes the built server with regression checks and the SEO audit. To do: redirect matrix (QA-3), unit tests for the engine and rate limiter (ARCH-019), manual keyboard/screen-reader pass (QA-1), restore and rollback rehearsal on a scratch host (OPS-2), dependency updates in CI (OPS-3), evaluate a nonce-based CSP (SEC-1).

## Phase I — Release and cutover

Preconditions: PDFs hosted (C1), backups copied off-server (OPS-1), restore rehearsed (OPS-2), About page and leadership confirmed (LEG-008), Cloudflare cache rule and purge token, domain plan agreed. Then follow [MIGRATION_CHECKLIST](../migration/MIGRATION_CHECKLIST.md) and [URL_REDIRECT_MAP](../migration/URL_REDIRECT_MAP.md). Rollback: the deploy script restores the previous image automatically on a failed health check; data rollback uses the pre-deploy archive and `restore.sh`.

## What needs the owner

| Input | Unblocks |
|---|---|
| Decision and storage for the PDFs | Phase C, Scholar indexing, safe retirement of the legacy host |
| Cloudflare cache rule + purge token | Edge caching, faster pages |
| Translation provider credentials/limits | Higher translation budget |
| Confirmation of About page and leadership names | Treating the About page wording as final |
| Backup destination | Off-server backups |
| Domain cutover date and Search Console access | Phase I |
| Notice to the Center | The legacy site published a spam news item (LEG-010) |
