# Next plan — what we build, fix and decide after 2026-10-21

**Purpose:** one forward-looking plan that orders everything still open: engineering work we can do today, work waiting for the owner or the Center, new feature proposals, and the way we work. Findings live in [BACKLOG](BACKLOG.md), launch gates in [ROADMAP](ROADMAP.md), features in [FEATURE_PLAN](FEATURE_PLAN.md), the running state in [PROGRESS](PROGRESS.md). This file is the order of work.
**Last updated:** 2026-10-27 · **Site status:** staging/review copy at `hadramout-center.novixa.dev` (noindex, preview banner). It moves to a new host and domain after the Center approves.

## الملخص بالعربية

الموقع الحالي نسخة مراجعة (staging). كل ما يمكن بناؤه دون مدخلات خارجية موجود في **المستوى 1** مرتبًا ومعه معيار قبول وطريقة تحقق. ما ينتظر قرار المالك أو مواد المركز في **المستوى 2**. الأفكار الجديدة المقترحة (تحتاج ترتيب أولويات) في **المستوى 3**. لا نُطلق الموقع قبل إغلاق بوابات G1–G11 في الخارطة.

## 1. Verified state (evidence, not claims)

| Area | State | Evidence |
|---|---|---|
| Branches | `master` contains every PR up to #33 and Dependabot #22–#30; all 20 feature branches are fully merged; only PR #32 (sass patch) is open | `git branch`, `gh pr list` on 2026-10-21 |
| Live staging | healthy, new build deployed | `cutover-check` 39 ok / 1 warning (Cloudflare caches `/sw.js` 4 h) / 0 failed; video page serves `og:type video.other`; book page shows the labelled WhatsApp request |
| Unit tests | 160 pass | `npm run check` |
| Browser journeys | 41/41 on a production-mode build | `node scripts/e2e.mjs <url> --expect production` (local only, not in CI yet) |
| SEO / OG audit | 0 errors, 0 warnings; generated cards are real 1200×630 PNGs | `node scripts/seo-audit.mjs` |
| Performance (lab) | home 93, TBT 79 ms, CLS 0; modeled LCP ≈ 3 s vs observed ≈ 0.2 s | Lighthouse workflow, median of 3 |
| Security | REST capped, GraphQL off, health minimal, maintenance mode; open items SEC-004/005/007 need the owner | [SECURITY_REVIEW](../security/SECURITY_REVIEW.md) |

## 2. Ways of working (so nothing is lost)

1. **One PR per change, from a `claude/...` branch, merged only when `check` and `docker` are green.** Merging to `master` deploys to staging; verify each deploy with `node scripts/cutover-check.mjs https://hadramout-center.novixa.dev --expect staging`.
2. **Branch hygiene:** after a PR merges, delete its remote and local branch (`gh pr merge --delete-branch`, or `git push origin --delete <b>`); the merged `claude/*` branches can be removed in one pass (owner approval, nothing in them is unmerged).
3. **Dependabot:** minor/patch updates merge when CI is green; majors (actions/checkout 4→7, setup-node 4→7, docker actions) merged on 2026-10-21 and their first deploy was green — watch the next two deploys and the Lighthouse workflow before treating them as settled.
4. **Docs are the memory:** PROGRESS (state), BACKLOG (status), FEATURE_PLAN, CHANGELOG are updated in the same PR as the code.
5. **Merge permission:** the agent's auto-mode classifier blocks `gh pr merge`. To let the agent merge green PRs itself, add a permission rule such as `Bash(gh pr merge:*)` to `.claude/settings.json` (owner action, one line).

## 3. Tier 1 — engineering work we can do now (in order)

Every item has an acceptance test; none needs the Center.

| # | Work | Why | Acceptance (how we know it is done) | Backlog |
|---|---|---|---|---|
| 1 | **DONE (PR #35, in #40)** — **Browser tests in CI**: a job that installs Chrome (`browser-actions/setup-chrome` or the runner's Chrome), seeds, starts the standalone server and runs `e2e.mjs` and `site-sweep.mjs` | the search-submit bug shipped unnoticed; unit tests cannot see it | CI fails if any journey fails; run time under 6 min; the server logs are kept as an artifact on failure | QA |
| 2 | **DONE (PR #36, in #40; runs after the first merge)** — **Post-deploy verification workflow**: after each deploy run `cutover-check`, `seo-audit` and `site-sweep --sample 60` against the live URL and open an issue on failure | merging deploys; we should learn about a bad deploy from CI, not a visitor | workflow runs on `workflow_run` of Deploy; a deliberately broken check fails it | OPS |
| 3 | **DONE (2026-10-27)** — **Redirect matrix test** for all seven legacy URL types (query strings, trailing slash, case) | the SEO cutover depends on it | `tests` or smoke asserts every row of [URL_REDIRECT_MAP](../migration/URL_REDIRECT_MAP.md) gives one 301 to the right target | QA-3, MIG-007 |
| 4 | **Bidi controls and tatweel**: hook on title fields that strips direction controls and kashida runs on write + an idempotent migration for the 5 affected titles | site-sweep reports them; they break search matching and copy | `site-sweep` shows 0 `bidi-in-title`/`tatweel-in-h1`; migration up/down/up tested on a DB copy; backup first | RES-008 |
| 5 | **PARTLY DONE (priority removed, builder tested; no per-type index on purpose)** — **Sitemap hygiene**: drop `priority`/`changefreq`, sitemap index per type, `lastmod` from `updatedAt`, image entries for covers | Google ignores priority/changefreq; per-type files make coverage reports readable | `seo-audit` validates index + children; `cutover-check` host consistency still green | RES-007 |
| 6 | **MOSTLY DONE (per-author card; `profile` type on authors; article cards show the article's own illustration; JSON-LD image on every article — 2026-10-27; `buildMetadata` unit tests still open, the SEO audit asserts og:type per page type meanwhile)** — **OG/SEO second pass**: a per-author card (name + number of works) instead of the generic authors card; `article:publisher`, `og:updated_time`; unit tests for `buildMetadata` per type (title/description limits, og:type, absolute URLs, image alt) | author/topic shares currently look generic | unit tests cover every `type`; `seo-audit` still 0/0; cards viewed and approved | RES-004/005 |
| 7 | **PARTLY DONE (search bar, find-in-facet, modern filters panel); category facet blocked: 0 of 52 books have a category** — **Book catalogue upgrade**: filters for "has PDF", year range and language; sort by year; ISBN found by search; related books by author and topic; availability note when no PDF | the books page is the most browsed collection | e2e journey for the facets; facet counts equal the result counts (existing unit property) | — |
| 8 | **One translation-readiness rule** used by pages, sitemap and API; atomic budget accounting; retry honours `retryable` | four copies of one rule can disagree (sitemap lists pages that noindex) | single function with unit tests; sitemap and page agree for all sampled items | ARCH-012, ARCH-009/010 |
| 9 | **Typed Payload access** instead of 77 casts; tests for translation engine, hooks, rate limiter, legacy media | safer refactors | `tsc` clean with the casts removed in `lib/data.ts`; new tests in `tests/unit` | ARCH-008, ARCH-019 |
| 10 | **Accessibility automation**: axe on 8 page types inside the e2e run; then the manual keyboard + screen-reader pass (needs a tester) | G6 is only partly automated | axe reports 0 serious/critical; written test notes in `docs/04-qa/` | QA-1 |
| 11 | **CSP without `unsafe-inline`** (evaluate the cost of dynamic rendering first; hash-based inline scripts may be enough) | hardening | measured TTFB impact written down before deciding; report-only header first | SEC-1 |
| 12 | **Slugs in URLs** (`/ar/books/37-وجوه-في-بلاد-العرب`) with 301 from the id-only form | readable shares and better snippets; ids stay the key | all old URLs still 200/301; canonical is the slug form; sitemap updated | DATA-008 |
| 13 | **Related content** rules for the 34% of items with none (same author/category/period, never random) | engagement | share of items without related content measured before/after (`npm run quality`) | DATA-009 |
| 14 | **LQIP / blur placeholders** for covers; confirm no CLS regression | perceived speed on slow phones | Lighthouse median CLS stays 0 | F-35 |
| 15 | **Branch cleanup** of merged branches | clarity | `git branch -r` shows only live work | process |

## 3b. Done on 2026-10-23/24 (all in PR #40)

| Work | Evidence |
|---|---|
| Search bar inside every section (news, articles, books, issues, events, forum, videos) | e2e: each section has `#list-q`; Enter filters, chip + clear work |
| Filters panel redesign, find-in-list, sort menu bug (outside the form) | e2e: sort applies at once with a clean URL; facet find narrows without reload |
| UI review of 26 page types at 390/1440 px | before/after screenshots; no horizontal overflow at 390 px |
| Rejected: `loading.tsx` skeleton | smoke caught soft 404s (status 200 before `notFound()`); do not reintroduce without a different approach |

## 3c. Next up (in order) — updated 2026-10-27

Done on 2026-10-27 ([review](../reports/REVIEW_2026-10-27.md)): redirect matrix in CI, article cards with their own illustration, `profile` on authors, reviewer role locked to translations (SEC-010), staff cannot read other users (SEC-003).

1. ~~Bidi/tatweel cleanup~~ — **done 2026-10-27** (titles/names on write + migration, rehearsed up/down/up).
2. ~~Optional "lead image" on articles~~ — **done 2026-10-27** (migration `article_lead_image`; page header, card, JSON-LD use it).
2b. ~~Editorial dashboard~~ — **done 2026-10-27** ("what needs attention" panel per role in the admin).
3. `buildMetadata` unit tests per type (needs a `getSite` seam); JSON-LD gaps RES-004/005.
4. One translation-readiness rule (Tier 1 #8), then typed Payload access (#9).
5. Typeahead inside the section search; saved searches.
6. Editorial (Center): video 2 has no video; photos for events; see the review's data list.


## 4. Tier 2 — blocked on the owner or the Center

| Item | Unblocks | Needs |
|---|---|---|
| Host and domain decision | G8, G9, the move runbook | owner |
| PDF hosting (63 files) and mirror | G4, Scholar indexing, retiring the legacy host | owner decision + storage |
| Cloudflare HTML cache rule + purge token | real-world speed (the lab is already good) | owner token |
| Admin 2FA (recommended: Cloudflare Access), deploy user, off-server backups | G7 | owner |
| About/leadership/privacy/terms approval | G1 | Center |
| Events 2025–26, news, issues, book metadata | G2, G3 | Center + editors |
| Mail provider for the newsletter | F-23/F-46 | owner |
| Search Console property | G9 | owner/domain |
| Audit trail (enable Payload `versions` on content) | restore-after-mistake | owner decision (recommended yes) |
| Translation provider credentials | higher translation budget | owner |

## 5. Tier 3 — feature proposals (need a priority decision, none are promised)

| Idea | Value | Risk / note |
|---|---|---|
| **Reading lists / collections** curated by editors (e.g. "Hadhrami poets") shown on topic pages and exported as RSS | discovery and teaching use | needs editors; content model change |
| **Advanced search**: phrase, exclude, author/year operators, saved searches | researchers | keep the plain form default |
| **Per-author bibliography export** (RIS/BibTeX of all works) | researchers | uses the tested export module |
| **"Cite this page" for every page type** including events and videos | consistency | citation formats for events need a convention |
| **Print-ready article layout** with source line and QR to the URL | libraries, classrooms | print CSS exists; add QR carefully |
| **Admin analytics view** (zero-result searches, top 404s) | editors act on real demand | the data exists; today a script report |
| **Email alerts per topic/author** | retention | needs a mail provider |
| **Timeline expansion** with sourced entries | education | each entry needs the Center's scientific review |
| **Search inside PDFs** | high for scholars | only after PDF hosting; OCR is never shown as authoritative |
| Rejected for now | — | IIIF viewer (no verified manuscripts), semantic search, AI summaries (accuracy risk) |

## 6. Definition of done (every item above)

1. `npm run check` green; routes/headers/config changes also `npm run build && npm run smoke`.
2. New behaviour has a test at the cheapest level that can see it (unit, smoke, or browser journey).
3. PR with green `check` + `docker`; docs (PROGRESS/BACKLOG/FEATURE_PLAN/CHANGELOG) updated in the same PR.
4. After the deploy: `cutover-check` against staging and a look at the changed page.
5. No invented facts: unknown data is omitted, never guessed (dates, ISBNs, speakers, ratings).

## 7. Risks to watch

| Risk | Mitigation |
|---|---|
| Cloudflare caches HTML or `/sw.js` and serves stale pages after a deploy | purge rule once the token exists; `sw.js` no-cache rule; recreate the container after host/env changes |
| Data migrations (bidi cleanup, MIG-010 link rewrite in 801 documents) damage content | backup first (includes `legacy-media`), idempotent migrations, test on a DB copy, up/down/up |
| Grouped Dependabot majors break a deploy | CI builds the production image on every PR; deploy rolls back on a failed health check |
| The Center's materials arrive late | launch gates G1–G3 stay open; engineering continues with Tier 1 |
