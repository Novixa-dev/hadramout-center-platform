# Progress and continuation point

**Last updated:** 2026-11-12 (platforms and dashboard reviewed and fixed; 2026-11-11 payment receipts added to the store and donations; 2026-11-09 digital platforms built: [handover](../client/06-platforms-handover-ar.md); 2026-11-08: client files checked item by item, [conflicts list](../client/05-book-vs-site-conflicts-ar.md)) · **Latest review:** [REVIEW_2026-10-28_ADMIN](../reports/REVIEW_2026-10-28_ADMIN.md) (admin) · [REVIEW_2026-10-27](../reports/REVIEW_2026-10-27.md) (site) · **Readiness:** [RELEASE_READINESS](../reports/RELEASE_READINESS.md) · **Access/roles:** [ACCESS_AND_ACCOUNTS](../06-handover/ACCESS_AND_ACCOUNTS.md) · **Tests:** [test runbook](../04-qa/02-test-runbook.md) · **Next:** [NEXT_PLAN §3c](NEXT_PLAN.md) orders everything still open. **State (2026-10-21):** PRs #12–#33 (incl. Dependabot #22–#30) are merged and deployed to the **staging/review site** `hadramout-center.novixa.dev` (noindex, preview banner, `SITE_ENV` unset). It moves to a new host and domain after the Center approves. All launch gates and their owners: [ROADMAP](ROADMAP.md).
**Related:** [BASELINE_REPORT](../reports/BASELINE_REPORT.md) · [RELEASE_READINESS](../reports/RELEASE_READINESS.md) · [architecture audit](../architecture/SYSTEM_ARCHITECTURE.md) · [data audit](../architecture/DATA_MODEL_AND_TAXONOMY.md) · [migration plan](../migration/CONTENT_MIGRATION_PLAN.md)

## Digital platforms (2026-11-09)

Built: reader accounts (`/account`), store with cart and orders (`/store`), donation pledges (`/donate`), volunteer applications (`/volunteer`), the encyclopedia as an eighth content type (`/encyclopedia`, empty until editors write entries) and a cultural hub drawn from the archive (`/culture`). Staff handle requests in the admin group «الأعضاء والطلبات».

Decisions worth knowing:
- **Members are not a Payload auth collection, on purpose.** `collections/shared.ts` treats any `req.user` as staff, so a reader must never become one. They have their own cookie `hc_member` (`src/lib/member-crypto.ts`, `src/lib/members.ts`). Do not change this without rewriting those access rules.
- **The site takes no money.** Orders and pledges wait for staff. `site.donation.paymentUrl` links to a gateway if the Center ever has one.
- **Payment receipts (2026-11-11).** After transferring outside the site, a visitor uploads a photo of the receipt (`POST /api/hc/receipts`, multipart) proved by the request's reference plus its email. Photos are re-encoded to JPEG with sharp (no EXIF/GPS, no appended payload), stored in `DATA_DIR/receipts` (outside public media, in `backup.sh`), served only to editors/admins with `Cache-Control: private, no-store` (a CDN caches `.jpg` by extension otherwise). Max 8 MB, 5 per request, HEIC refused with an explanation. The photo cannot be replaced; staff set its status and must verify the money arrived before marking a request paid.
- **No email exists,** so there is no verification or reset: staff set a temporary password in the admin.
- **`scripts/platform-check.mjs` writes rows and refuses non-local hosts;** `scripts/e2e.mjs` stays read-only for live runs.
- Security review: a reused member id let a deleted account's token open the next account (reproduced, fixed with a random first `sessionVersion`, regression-tested). Also fixed: unbounded input before limits, email-based lockout, IPv6 buckets, staff rewriting visitor data.

Next steps: CF-PLATFORM-CONTENT, CF-PLATFORM-MAIL, CF-CACHE-ACCOUNT, CF-EVENT-ENDDATES in `BACKLOG.md`.

**Admin dashboard redesign (2026-11-11), mobile first.** `src/admin/EditorialDashboard.tsx` + the «Dashboard» block of `src/app/(payload)/custom.scss`. A green masthead with the Center's pattern says in one sentence how much visitors are waiting on (`waitingLine` in `src/admin/i18n.ts`, Arabic plural agreement, unit-tested); «ما يحتاج انتباهك» is one list (receipts, orders, pledges, volunteers, messages, reviews), empty queues named once in a quiet line, and the editors' own backlog (articles without a topic, latest event) apart under «ترتيب المحتوى», not counted as waiting. Phone order: attention, create, recent edits, content status, tools, shortcuts; from 880 px of dashboard width (container query) the first three boxes sit in the wide column and the rest beside them, so the DOM, focus and visual order agree at every width (since 2026-11-12; CSS `order` had made them differ). `scripts/admin-e2e.mjs` reads counts from `data-count`.

**Review of the platforms and dashboard (2026-11-12).** Code, security and Arabic/a11y reviews of `353ef5d` and `63f307c`. Security: no exploitable finding; the earlier fixes hold. Fixed: addresses, notes and volunteer experience keep their line breaks (`sanitizeLines`/`cleanLines`; before, every field was flattened to one line); JSON bodies are read through a byte cap, so a chunked body or a false Content-Length can no longer make the server buffer it all; the profile refuses a phone an order would refuse; the account page shows the newest receipt's status; the cart's quantity field keeps a draft while typing ("3" no longer became "13"), and the store's add button links back to the cart; the dashboard's boxes are in the DOM in phone order (CSS `order` had made focus order differ from what is seen), split into two unbroken columns from 880 px (screenshots checked at 390 and 1440 px, light and dark); admin gold text `#7a5a26` and zero counts reach 4.5:1 (new admin contrast test); the dashboard request counts run in parallel; encyclopedia entries cannot be published in Arabic without a source; copy no longer implies an email («رسالة التأكيد»), says who sees receipts accurately, and «ملغى»/«متاحة بالطلب». Open: CF-PLATFORM-APPROVAL (blocks launch), CF-PLATFORM-A11Y, CF-SAVED-BACKUP, CF-ENC-KIND.

**Dashboard design and platform accessibility (2026-11-12, second pass).** Dashboard, following the design system: the Shibam skyline (`src/components/Skyline.tsx`, as on the home page) rises along the masthead's bottom edge in a shade of its green; the content table shows each section's size against the largest as a thin bar under its name, zeros as a quiet dash (still «0» to screen readers), drafts as gold counts, and frameless 44 px add buttons; a single item's status reads «مسودة»; Payload's section cards below are an even index of 44 px chips under small headings. Platforms: see CF-PLATFORM-A11Y and CF-SAVED-BACKUP in `BACKLOG.md`; prices go through `src/lib/money.ts`. `scripts/e2e.mjs` now checks that focus follows add-to-cart and lands on the cart heading when the cart empties.

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

## 2026-10-27 — review, OG pass, redirect matrix, role hardening

| Change | Evidence |
|---|---|
| Redirect matrix for every legacy id, inside `npm run smoke` (CI); legacy rewrite moved to `next.config.ts` (proxy rewrite hit `ECONNRESET` 500s); `/magazine` → 308 | 1,603–1,663 checks, 0 failed |
| Article social cards use the article's own illustration (framed), ~42% of articles; JSON-LD image on every article; `og:type profile` on authors; card revision `?d=4` | unit tests; cards inspected; smoke SEO audit 0/0 |
| Reviewer role limited to translatable fields (SEC-010); staff read only their own user (SEC-003) | unit tests + Payload local-API checks |
| Docs: access/roles guide, git-ignored local credentials file (repo is public), test runbook, review, readiness | — |

Live before deploy: cutover-check 39 ok/0 failed, SEO audit 0 errors, sweep 77/0, e2e 56/56.

## 2026-10-27 (second pass) — dashboard, lead image, tidy titles, dependencies

| Change | Evidence |
|---|---|
| Editorial dashboard per role (admin `beforeDashboard`) | signed in as admin/editor/reviewer on a production build: right cards per role; filters return the shown counts (142 uncategorised, 1 translation report); screenshots light/dark/phone/Arabic |
| Article lead image + migration | editor uploads and attaches an image over REST: page header, JSON-LD and card version use it; migration up/down/up, 909 rows kept |
| Titles tidied on write + migration (RES-008) | unit tests; migration up/down/up; «1000هـ» kept |
| Dependabot #41–#45 integrated (Payload 3.92, SDK 1.1, react-dom 19.3.1) | check 173/173, build, smoke 72 ok, redirect matrix 1,603/0, e2e 55/55, sweep 77/0, knip clean; the server applied both new migrations itself on start |

## 2026-10-28 — admin audit: identity, overview, both languages, role-tested fixes

| Change | Evidence |
|---|---|
| Author names stuck on "Loading…" off `SITE_URL` (absolute clamp redirect) → relative redirect | smoke asserts a relative `Location` with a foreign `Host`; admin-e2e: 6 list pages resolve every relationship cell |
| SEC-011 admin/API framing, SEC-012 reset endpoint writing tokens to the log, SEC-013 SVG uploads | smoke (headers, 403) + admin-e2e (PNG accepted, SVG refused) |
| Rich-text field: label/description/required/locale, read-only for reviewers, live toolbar state, bilingual | admin-e2e (label present, aria-pressed, reviewer read-only Arabic / editable English, opening leaves the document unmodified) |
| Arabic-first admin with a header and sign-in language switch; «لغة المحتوى»; dates; every label bilingual (unit test walks all collections and the site settings) | admin-e2e (English browser → Arabic, switch persists); `tests/unit/admin-i18n.test.ts` |
| Admin identity (logo, palette from the site tokens, Plex Arabic/Naskh), dashboard with live counts, recent edits, translation budget, shortcuts | screenshots ar/en × light/dark × 1440/390; admin-e2e compares the numbers with the database |
| Phone header: picker no longer covers the breadcrumb (Payload RTL gaps) | admin-e2e at 390 px, Arabic and English, 4 page types |
| `scripts/admin-e2e.mjs` in CI; import-map consistency step in CI | ci.yml |

## 2026-10-29 — deploy unblocked, CI supply chain hardened

| Change | Evidence |
|---|---|
| Deploys had stopped since `b1ce484`: with the repository private, GitHub refused every job (organization billing: "payments failed or spending limit"); 0 billable minutes had been used. Repository made public again → Deploy and Live check green | Deploy run 40774313346; live `sha-ef40632`: cutover 39/0, SEO 0/0, sweep 77/0, `e2e.mjs` 56/56, read-only admin with the owner's account 14/14 |
| Workflows: actions pinned to SHAs, least-privilege permissions, no persisted checkout tokens, inputs via env (template injection in the rollback tag), zizmor job + CodeQL + critical `npm audit` gate (SEC-015, OPS-3) | zizmor 33 → 0, actionlint and shellcheck clean |
| CodeQL first scan, 24 alerts: 4 real defects fixed in runtime code (entity decoding order, sitemap attribute quotes, one BibTeX escaper, language-tag path guard); 13 triaged for dismissal (SEC-016). undici 8.12.3, Anthropic SDK 1.3.0. Repository: secret scanning + push protection, Dependabot alerts/security updates, private vulnerability reporting, `master` protected from force-push/deletion | CodeQL: 0 open in runtime code; live `sha-0f62a46`: cutover 39/0, SEO 0/0, sweep 77/0, e2e 56/56, admin read-only 14/14; Lighthouse CI median mobile 90–94 / desktop 100, a11y 97–100, SEO 100 |
| `dompurify` (critical) and `fast-uri` via overrides; Node floor 24.22.1 and newest Node 24 in CI; Turbopack whole-project tracing removed (standalone 199 → 158 MB) | `npm audit --omit=dev`: 0 critical; build has 0 warnings; check 181/181, smoke 80/0, e2e 55/55, admin-e2e 65/65 |

## 2026-11-06 — repository sync, dependency batch, multi-matrix audit, author-data fix

| Change | Evidence |
|---|---|
| Repository state verified: every `claude/*` branch equals `master`; Dependabot #48 (Payload 3.92.1), #49 (tiptap), #51, #52, #53 (lint/types, puppeteer, sass) merged via GitHub after their CI was green; each push deployed | `gh pr list`, Deploy runs green |
| Browser audit of the live site: 366 page loads (23 pages × ar/en × light/dark × 390/820/1440/2560 px) with axe (WCAG 2.2 AA + best practice), console, network, overflow, `dir`/`lang`, broken images | `.smoke-data/audit/audit.mjs` (scratch). 502s seen were the container restart window of a deploy running at the same time |
| A11y fixes: warning badge contrast (new `--warning-text`, 5.9:1), 24 px radio targets, sub-topic links no longer overlap, author index links underlined faintly (WCAG 1.4.1), topic facet no longer puts a radio inside `<summary>` (group = disclosure, "All in X" first inside it) | axe re-run on a local build |
| **Author titles** — the hand-run clean-up never reached the live database, and its fix for author 159 would have listed one person twice. New migration `20261106_120000_split_author_honorifics` (idempotent): titles → `honorific`, bare-title authors cut off by the legacy import (159 "أ.م.د", 78 "الشيخ") merged into the person who follows them. Same rules in `src/lib/author-names.ts`, used by the seeder, so a fresh seed gives the same 272 authors / 88 titles | unit tests (20), migration run on a seeded copy, fresh seed compared |
| Quality report: new "Authors" section lists names that are only a title or not a person (78/129/254/264 → editors decide; nothing is guessed) | `npm run quality` |
| Dependabot alerts: two high-severity `happy-dom` advisories (pulled in by Lexical inside Payload) closed with an `overrides` entry (20.14.6 → 21.0.4); 12 low/moderate dev-tooling advisories remain (drizzle-kit, esbuild, minimatch: build-time only) | npm audit, check 232/232, build, smoke 80, redirect matrix 1,603/0, e2e 55/55, admin-e2e 65/65 |

## 2026-11-08 — admin dashboard redesign (mobile first)

| Change | Evidence |
|---|---|
| Emoji icons → inline SVG set; swipeable quick actions; icon cards; compact content rows on phones; duplicate CSS and the pulse animation removed | screenshots light/dark × 390/1440 px, no horizontal overflow; check 236/236; see CHANGELOG 5.17.0 |

Also 2026-11-08: dashboard axe 0 violations (4 combinations); public site: 25 route shapes × 2 themes at 390 px, axe 0, no overflow; footer credit and byline author links raised to 24 px; admin drawer toggles 44 px. **Open:** admin header hamburger/sign-out/list controls < 24 px (Payload's own markup; needs a header redesign).

Known, not fixed: 4,004 images in article bodies have no alt text (editorial work list in the quality report); a deploy restarts the container, so there is a short 502 window (a zero-downtime swap is an infrastructure task); local Windows smoke can hit a one-off `ECONNRESET` in the redirect matrix (passes alone, Linux CI is the reference).

## 2026-11-06 (second pass) — the Center's files: feedback report and tenth-anniversary book

| Change | Evidence |
|---|---|
| Both client files read page by page (their Arabic text cannot be extracted: fonts without Unicode maps) and analysed: [docs/client](../client/README.md) — 20-row conformity matrix, book digest with page numbers, action plan CF-01…CF-24 | docs |
| **Menu grouped as the Center proposed**: About · Media Center · Research & Studies · Programs & Projects · Contact (14 flat links → 5 entries); keyboard/Esc/outside-click dropdowns, "More" overflow kept, phone drawer shows sections | e2e 55/55, admin-e2e 65/65, screenshots ar/en × light/dark × 390/1366 |
| 7 institutional pages from the book (`src/seed/center-pages.ts`) + migration `20261106_130000`: vision/mission/values, goals, organisation, a decade, 2026–2030 plan, digital library, partnerships. Figures need the Center's confirmation (CF-24) | migration run on an old seeded copy: 12 pages |
| Events: *supporters* and *attendance* fields (migration `20261106_140000`), "Add to Google Calendar" link (unit-tested) | 236 unit tests, migration chain run on a seed copy |
| Light theme: gold tint behind the header (client request); `.date-block` contrast fixed in dark (4.15 → ≥ 4.5:1) | axe on local build: 0 violations on new pages |
| Docs rebuilt: README, index, CHANGELOG 5.16.0, [HANDOVER](../06-handover/HANDOVER.md), [IDEAS_AND_ROADMAP](IDEAS_AND_ROADMAP.md), designed Arabic manual [docs/manual](../manual/index.html) + PDF (`npm run manual:pdf`) | PDF checked page by page (21 pages) |
| Raw client PDFs are git-ignored (public repository); the root audit prompt moved to `docs/archive/` | — |

Still waiting on the Center: logo asset (CF-05), chairman's word and board/team names (CF-07a), governance documents (CF-08), publishing-ethics texts (CF-10), podcast files (CF-14), partner logos with consent (CF-17), testimonials (CF-18), taxonomy policy (CF-19), and **confirmation of every figure and name taken from the book (CF-24)**.
## 2026-11-03 — the Center's feedback report and decade book

| Change | Evidence |
|---|---|
| Audit of the 2026-10-31 "stage B" work: `editorial-assist` was open to visitors and spent the translation budget; `?preview=1` showed drafts to anyone; `/submit` published invented publishing/peer-review rules (and an internal id, and a made-up fallback email); announcement `.ics` + an unused calendar route read drafts; `/audio` and `/submit` had no share card; sitemap hard-coded six pages; inline-styled components | probes on live (assistant answered 200 without a session); code review |
| Fixes for all of the above + REST consent filters for testimonials/partner logos (from the security-reviewer pass, which found nothing exploitable in the new code) | smoke asserts 401 / draft 404 / dead route 404 / no invented rules / OG key 404 |
| Menu in the Center's order with sub-levels (`src/lib/nav.ts`, desktop dropdowns, phone accordions), utility bar, gold light theme | unit test for the order and labels; smoke: all 40 menu destinations 200; screenshots 1440/390 light/dark |
| About pages from the decade book, governance/support/exhibition pages, 14 partners, event type (44/53 typed from titles), forum category, participants/supporters/attendance, audio clips + Saqaya series, video clips, announcements page + home section + Google Calendar, partners/testimonials/platforms/podcast pages | migrations `20261103_*` up/down/up on real data; smoke; unit tests (224/224) |
| Local verification | check 224/224; build 0 warnings; smoke SMOKE_RESULT; redirect matrix 1,603/0; SEO audit 0/0; cutover-check 37/0 |

**Waiting on the Center:** the 3D logo file, governance texts, names of the board/team/advisors and committee members, publishing standards/ethics/AI policy, testimonials, partner logo consents, Saqaya recordings, the categorisation decision ([proposal](../06-handover/taxonomy-policy-proposal-ar.md)), and which text is «كلمة رئيس المركز».

## 2026-11-08 — both client files checked item by item against the database and code

The earlier traceability matrix called several book items "partial, editorial". Measured against the database, the gap was larger: no event had papers, participants or an attendance value; conferences 4, 6 and 7 were missing; forum 11/41, seminars 6/12, panels 5/12. The PDF's text layer is usable (the docs said it was not), so the tables were transcribed and checked against the page images.

| Change | Evidence |
|---|---|
| `src/seed/book-records-data.ts` + `applyBookRecords` (seeder and migration `20261108_130000_book_records`): 56 new records, 52 matched, 310 papers, 26 participants, 4 books. Fills only what is empty; idempotent; reversible | existing-DB copy: up, down, up give identical counts, 0 unmatched; fresh migrate + seed gives the same; 8 new unit tests |
| Book vs announcements: lecturer column on printed p. 67 contradicts the announcements on 7 of 8 comparable lectures, so it is not used; 7 dates corrected only where a second source supports the book; 7 more left unchanged | [conflicts list for the Center](../client/05-book-vs-site-conflicts-ar.md) |
| New pages `about/achievements`, `about/outreach`; TV-episode and film lists on `about/media-work`; seventh conference on `decade`; both pages added to the menu | smoke checks |
| Stash-pop conflicts resolved; matrix and action plan brought up to date | — |
| `/ar/studies` returned 500 (read `searchParams` without `force-dynamic` under the locale layout's static params); now dynamic and uses `fixed` for its category | smoke: all menu destinations 200 |
| Utility bar widened the page at 768 px (818 px Arabic, 911 px English): icons only up to 1000 px, list scrolls inside the bar | e2e responsive journey at 320/360/768/1024 |
| Menu, footer and utility links no longer prefetch: 17–23 RSC requests per page, and links differing only by `#fragment` fetched one URL twice and hung about 30 s on the browser's cache lock | e2e theme and language journeys |
| Verification | check 253/253; knip clean; build; smoke 0 failures; SEO 0/0; redirect matrix 1,603/0; e2e 55/55; site sweep 87 pages 0/0; admin e2e 65/65; live migration order rehearsed from `origin/master` with a seeded database |

**Open owner decision:** commit `2f335bb` put the Center's two internal PDFs in the public repository, against the rule in `docs/client/README.md`.
**Deploying this:** the migration rebuilds the search index itself; if its log warns otherwise, run `npm run db:seed -- --defaults-only`.

## Next actionable tasks (in order)

1. **Client meeting:** walk through the staging site and the [checklist](../06-handover/client-requirements-checklist-ar.md); collect the Center's materials and the decisions (domain, host, PDFs, Cloudflare, mail provider, 2FA).
2. **As materials arrive:** enter them (events 2025–26, news, issues, book metadata, About/leadership, legal texts), re-run `npm run quality`, and track the data gates G2/G3 in the [roadmap](ROADMAP.md).
3. **Owner decisions unblock engineering:** PDF hosting (G4, LEG-001), host and domain (G8/G9, runbook), Cloudflare cache rule + purge token (PERF-T4 — the likely real-world speed-up), admin 2FA (SEC-004), deploy user (SEC-005), off-server backups (SEC-007).
4. **Before launch:** manual keyboard and screen-reader pass (G6); restore and rollback rehearsal on the new host (G8); `cutover-check` on the final host (G5/G9).
5. **After launch:** Search Console, field Core Web Vitals (the only valid LCP judge), `npm run quality` weekly for missing pages and zero-result searches.

## Blocked on the owner

Cloudflare cache rule and purge token; translation provider credentials; the Center's approval of About/leadership/legal texts and its materials; domain and hosting decision; off-server backup destination; mail provider for the newsletter.
