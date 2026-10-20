# Backlog

**Purpose:** the single register of open and closed findings from the 2026-10 audit, with status. Detail (evidence, acceptance criteria, verification) stays in the source document linked per row.
**Last updated:** 2026-10-20 · **Compiled** once from the finding tables of the audit documents; from now on this file is maintained by hand. Update the status here, not in the source documents.
**Statuses:** READY (can be done without outside input) · PARTIAL (started, remainder listed) · BLOCKED (needs the Center, an editor, or owner credentials) · DONE (changed and verified; evidence in the note).
**Related:** [ROADMAP](ROADMAP.md) · [PROGRESS](PROGRESS.md)

## Counts

| Status | Total | high | medium | low | info |
|---|---:|---:|---:|---:|---:|
| READY | 62 | 0 | 15 | 32 | 15 |
| PARTIAL | 7 | 1 | 5 | 1 | 0 |
| BLOCKED | 18 | 4 | 9 | 4 | 1 |
| DONE | 14 | 1 | 10 | 3 | 0 |

Severity is the auditor's claim backed by cited evidence; the planned adversarial re-verification did not run (usage limit). The 6 high-severity items are LEG-001, LEG-002, ARCH-001, DATA-001, MIG-001, MIG-003.

## Ready

| ID | Severity | Title | Note | Source |
|---|---|---|---|---|
| ARCH-008 | medium | Generated Payload types are unused; 77 casts and an index-signature Doc |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-009 | medium | Retry policy ignores retryable; budget-exhausted jobs die permanently | needs a verified Payload jobs API for non-retryable failures before changing | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-010 | medium | Translation budget accounting is racy and can double-bill |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-011 | medium | Anonymous POST can exhaust the daily translation budget | bounded by the daily character cap and 600/hour bucket; stricter fix = signed token | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-012 | medium | "Translation ready/complete" implemented four times |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-018 | medium | Architecture and ADR docs describe Fastify, Quill, Caddy and ISR |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-008 | medium | Public URLs use autoincrement ids with no slug; topic and category ids are environment-specific |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-009 | medium | No related content for 487 of 1,454 items (34%); related rules ignore cross-type links |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-003 | medium | 7 legacy-listed items (4 news, 3 articles) are not on the new site |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-005 | medium | Image cache coverage unproven; /legacy-media still depends on the legacy host for uncached files |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-011 | medium | Legacy-id redirect map verified on 16 samples only; no full automated check; legacy sitemap cannot reveal indexed URLs |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-002 | medium | Two images in news 331 return 404 on production |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-004 | medium | Re-seeding or rebuilding silently undoes data migrations |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-005 | medium | Editorial migration leaves () and [] in two titles; not yet applied in production |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-006 | medium | 7 legacy URLs get a soft redirect and 6 real entries are lost |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| ARCH-014 | low | Search index maintenance gaps (author rename, pages kind, O(L²) reindex) |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-016 | low | Dead and duplicated code (verified list) |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-017 | low | Configuration not centralised; loadConfig() re-parsed per call |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-020 | low | Mixed-responsibility files and a grab-bag lib/ |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-021 | low | Legacy 301 depends on a cookie; proxy skip pattern lacks boundaries |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-022 | low | Legacy media route buffers whole files and re-fetches misses |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-025 | low | Image optimizer cache lives in the container filesystem |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-027 | low | Two physical-direction CSS exceptions |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-011 | low | featured ("Featured on home") is not read by any reader-facing code |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-012 | low | Double issue 24-25 is one record (issue 25 unreachable); URL id differs from issue number; issues 38-41 have no table of contents |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-013 | low | Migration 5 leaves empty () and [] in two titles and removes footnote markers |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-014 | low | Reviews lack a composite index and a foreign key; in-memory row caps fail silently |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-015 | low | Article breadcrumb skips the parent topic |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-016 | low | Book metadata is sparse (pages 0/52, ISBN 0/52, category 0/52, PDF 21/52, 7 without author) |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-017 | low | 4,004 of 4,004 body images have empty alt text; media collection unused; all images depend on the legacy host or its mirror |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-019 | low | CMS page slugs are not validated against reserved routes; admin hint lists contact, which is a code route |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-020 | low | Field fill gaps: video 2 has no media, magazine season 0/40, news dateline 29/387 |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-012 | low | Page-size change and redirect chains alter legacy deep links (/news/ takes 2 hops) |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-013 | low | Invisible bidi characters in 5 titles and 5 PDF filenames; duplicated "العدد 1، العدد 1" in citations |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-014 | low | New contact and newsletter features have no delivery path (no mail sender, no unsubscribe route) |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-009 | low | Redirect edge cases (2-hop trailing slash, uppercase, query, language) |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-010 | low | 801 documents link to https://hadramout.center/magazines/{id} |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-012 | low | Public ids are surrogate auto-increment values |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-013 | low | Article dates are issue-derived and the provenance is not stored |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-014 | low | Source text defects are carried over |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| MIG-016 | low | Importer exits 1 forever because of the 7 known pages |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| RES-003 | low | Event and forum JSON-LD misses location.address and sometimes startDate |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-004 | low | JSON-LD dates claim more precision than the content has |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-005 | low | JSON-LD author.name includes honorifics |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-006 | low | citation_pdf_url points to another host, which Scholar ignores |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-007 | low | Sitemap hygiene |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-008 | low | Kashida (tatweel) runs survive in migrated text |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| ARCH-028 | info | Capacity: web, admin, worker, OG and FTS share one 1 GB process with no runtime heap cap |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-029 | info | node:sqlite is a second SQLite stack with its own stability status |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-030 | info | Conformance summary: what is already good |  | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-022 | info | Translations are stored as extra rows in one SQLite file (about 21.6 MB per language of body text) |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-023 | info | Referential integrity, encoding and uniqueness checks pass; local DB equals production content |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-024 | info | Topics, Authors and Timeline sit under "More" in the header |  | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-015 | info | Zoom meeting ids and passcodes on 7 legacy pages were correctly stripped |  | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-015 | info | Migration fidelity verified (counts, text length, titles, authors) |  | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| RES-010 | info | Show file type, size and page count on PDF buttons |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-011 | info | Undated and Hijri-aware date facets |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-012 | info | Older benchmark promises COinS; the code has none |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-013 | info | Index PDF text so issues and books are searchable |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-014 | info | SearchAction markup is dead weight |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-015 | info | No rights or reuse statement per item |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| RES-016 | info | Documented read-only data surface for researchers |  | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |

## Partial

| ID | Severity | Title | Note | Source |
|---|---|---|---|---|
| ARCH-001 | high | Synchronous FTS on the single event loop behind public, unlimited search and typeahead | 60 s result cache cleared by every index write (unit-tested) cuts repeats of the slowest query from >1 s of blocked CPU to ~0.2 s page time; typeahead rate-limited (90/min/client) and lang validated. The first uncached request still blocks the event loop: move FTS to a worker thread (PERF-T3) | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-006 | medium | No error boundaries, 45 empty catch blocks, no telemetry | route error boundary added; ~45 empty catch blocks and error telemetry remain | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-019 | medium | No tests for translation engine, hooks, rate limit, proxy, routes; no integration tier | CI runtime smoke tier added (PR #14); translation engine, hooks and rate limiter still untested | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-005 | medium | splitAuthors splits on /, creating authors named الشيخ and أ.م.د; older doc item C1 is wrong | importer fixed; authors 78 and 159 and their articles need an editorial data migration | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| MIG-007 | medium | No automated test of the legacy redirect map | smoke covers one legacy redirect; a full redirect-matrix test is still missing | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| RES-002 | medium | VideoObject markup has a malformed image URL and misses a required property | thumbnail URL fixed and verified live; uploadDate still absent (date unknown, not invented) | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| ARCH-026 | low | CI duplication and missing gates | CI now seeds a DB and probes the built server; duplication between ci.yml and deploy.yml remains | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |

## Blocked on the Center / editors / owner

| ID | Severity | Title | Note | Source |
|---|---|---|---|---|
| DATA-001 | high | Article and magazine "publication dates" are cover-upload months (713 articles show 2023) | real publication dates must come from the Center (issue contents); do not invent | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-001 | high | All 63 referenced PDFs stay hot-linked to files.hadramout.center | decide where the 63 PDFs are hosted before the legacy host is retired | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-002 | high | Issue and article dates are the legacy upload month, not publication dates; they feed citations and JSON-LD | same as DATA-001 | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-001 | high | PDFs are served from the legacy host and cannot be mirrored locally as-is | same as LEG-001 | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| ARCH-002 | medium | Content and list pages are not cached; ISR claim only holds for home and timeline | edge HTML caching needs the owner Cloudflare cache rule + purge token | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-015 | medium | Every translation write purges all caches; purge may silently fail in the worker | depends on ARCH-002 cache strategy | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-003 | medium | Taxonomy is the journal's column list; no place/period/theme facets; history topic holds 4.6% of articles | subject/place/period vocabulary needs editor approval | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-004 | medium | 142 articles (15.6%) uncategorised, concentrated in issues 18-28; junk and credit-line columns; 18 of 48 columns hold 2 or fewer articles | 142 uncategorised articles need editors | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-006 | medium | Author identity: 19 candidate duplicate pairs, role inside name (24 articles), 6 non-person authors, 88 honorific prefixes in name, 0 bios | author identity merges need editor decisions | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-007 | medium | Events stop at 2024-11-26 and forum at 2024-10-12; structured event fields are empty; 2025-2026 events exist only as news | event data after 2024-11 must be supplied by the Center | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-004 | medium | Forum brochure PDF (S3) is missing from /forum | the brochure PDF is on S3 and timed out; needs the file from the Center | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-010 | medium | Legacy site shows a spam news item (/news/10300), indicating a possible content-system compromise | tell the Center: the legacy site published a spam news item (possible compromise) | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-008 | medium | Domain cutover prerequisites are not in place | domain cutover plan, Search Console and change of address need the owner | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| DATA-018 | low | Timeline: 6 unreviewed entries, authored outside the Center's review, no linked studies | timeline entries need the Center scientific review | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-008 | low | New /about text contains claims absent from the legacy source ("دراسات محكَّمة", translation definition) | About page wording must be confirmed by the Center | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-009 | low | Video 2 has no playable source (legacy also broken) | video 2 has no source; needs the Center | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| MIG-011 | low | Forum brochure PDF on S3 not migrated | same as LEG-004 | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| DATA-021 | info | No model for documentation assets (photographs, manuscripts, documents) or for article series | new content types need scope approval | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |

## Done

| ID | Severity | Title | Note | Source |
|---|---|---|---|---|
| MIG-003 | high | Backups exclude the legacy-media cache | backup includes legacy-media (verified in the deploy log: archive taken before each deploy) | [doc](../migration/CONTENT_MIGRATION_PLAN.md) |
| ARCH-003 | medium | Production runs a build older than HEAD | Redesign v3 and the hardening pass deployed 2026-10-19 (PR #12, #13); production verified | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-004 | medium | Public Payload REST API has no depth/limit ceiling | REST limit<=100 / depth<=2 (src/proxy.ts), GraphQL disabled; verified live and in CI smoke | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-005 | medium | getDoc/getAuthor turn every error into a 404 | only Payload 404/403 map to not-found (src/lib/errors.ts); implausible ids 404 | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-007 | medium | ESLint ignores project rules for all .tsx and has no React/Next/a11y plugins | ESLint rules apply to .tsx; no React/Next/a11y plugins yet | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-013 | medium | Backup can silently omit i18n bundles and always omits the image cache | backup includes legacy-media and fails loudly; off-server copy still needed (see OPS-1) | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| DATA-002 | medium | 714 of 909 article excerpts start with a reference boilerplate; it becomes meta/OG/JSON-LD description | citation line stripped from descriptions, cards, JSON-LD, feeds (714/714 real excerpts); stored text unchanged | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| DATA-010 | medium | Migrations 3-6 are not applied on the live database and auto-run at start; migration 4 deletes rows irreversibly | migrations 3-6 applied at the 2026-10-19 deploys after pre-deploy backups; rehearsal was local | [doc](../architecture/DATA_MODEL_AND_TAXONOMY.md) |
| LEG-006 | medium | Production is behind local master; several "Improved" rows exist only in source | production now runs master (deploys 2026-10-19) | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| LEG-007 | medium | Staging robots.txt names hadramout.center; redirect, canonical and citation hosts depend on SITE_URL at cutover | runtime robots/sitemap use the production host; flip SITE_URL at cutover (MIG-008) | [doc](../audit/LEGACY_SITE_INVENTORY.md) |
| RES-001 | medium | Magazine-article citations and citation_journal_title use the issue title as the journal name | periodical name constant used in citations and JSON-LD; verified live (article 690) | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |
| ARCH-023 | low | Health endpoint leaks error text and whether any user exists; first-user bootstrap is open when users = 0 | health no longer discloses user existence or error text | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| ARCH-024 | low | search_queries grows without bound and feeds public "popular searches" | search_queries: only successful short queries stored, 120-day pruning | [doc](../architecture/SYSTEM_ARCHITECTURE.md) |
| RES-009 | low | RSS feeds are not language-aware and carry little metadata | RSS channel title follows the feed language; checked in CI smoke | [doc](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) |

## Tasks that are not audit findings

| ID | Task | Status | Note |
|---|---|---|---|
| OPS-1 | Copy backups off the server | BLOCKED | needs a destination chosen by the owner |
| OPS-2 | Exercise `restore.sh` and the rollback path on a scratch host | READY | never exercised in this pass |
| OPS-3 | Dependabot/Renovate and `npm audit` in CI | PARTIAL | Payload upgraded to 3.91.0 (17 → 10 production advisories, remainder are dev tooling); automated update PRs and an audit step in CI are still missing |
| QA-1 | Manual keyboard and screen-reader pass on the main journeys | READY | only axe/Lighthouse so far |
| QA-2 | Full per-route SEO matrix and Search Console readiness | READY | script audit passes; matrix not written |
| QA-3 | Redirect matrix test (all seven legacy types, query strings, trailing slash) | READY | see MIG-007 |
| PERF-T1..T6 | Home page profile, payload, search off the event loop, edge cache, field data | READY / BLOCKED (T4, T6) | see [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md) |
| SEC-1 | Nonce-based CSP to remove `script-src 'unsafe-inline'` | READY | needs dynamic rendering of every page; evaluate cost first |
