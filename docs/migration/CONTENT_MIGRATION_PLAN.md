# Content Migration Plan and Verification

| | |
|---|---|
| **Purpose** | Explain exactly how legacy content (hadramout.center) gets into the new platform, how safe it is to repeat, and record an independent verification of the migrated result (counts, URLs, media, Arabic text integrity, dates and attribution). |
| **Scope** | The importer (`scripts/import-legacy.ts`, `src/importer/`), the seeder (`src/seed/seed.ts`, `scripts/seed.ts`), media handling (`scripts/import-images.ts`, `src/app/legacy-media`, `src/lib/legacy-media.ts`), the legacy redirect handler (`src/proxy.ts`, `src/app/legacy/[section]/[id]/route.ts`), backup and deploy scripts as far as they touch migrated data. Out of scope: translation quality, visual design, SEO scoring. |
| **Status** | Verification complete for the sampled scope below. Items marked NOT VERIFIED were not checked. All tasks in section 9 are `BACKLOG` unless stated. |
| **Last updated** | 2026-10-18 |
| **Finding prefix** | `MIG-` (section 8) |
| **Sources / evidence** | Source code at `master` (10 commits ahead of `origin`), a read-only copy of `data/payload.db` (file dated 2026-10-16 05:29), `content/legacy-snapshot.json.gz` (generated 2026-10-14T20:35Z), live GET/HEAD requests on 2026-10-18 to `https://hadramout.center`, `https://files.hadramout.center` and `https://hadramout-center.novixa.dev` (about 370 requests in total, estimated; at least 300 ms between requests; no form submitted; no secret read). |
| **Related** | [URL_REDIRECT_MAP.md](URL_REDIRECT_MAP.md) · [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) · [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md) · [../02-plan/06-content-model-and-migration.md](../02-plan/06-content-model-and-migration.md) (Arabic, original plan) · [../09-redesign/02-editorial-issues.md](../09-redesign/02-editorial-issues.md) · [../03-tracking/TRACKER.md](../03-tracking/TRACKER.md) · [../05-deploy/01-vps-deploy-guide.md](../05-deploy/01-vps-deploy-guide.md) |

## 0. Reading guide

* **Legacy** = `https://hadramout.center` (Next.js on Vercel). **Production** = `https://hadramout-center.novixa.dev` as observed on 2026-10-18. **Local** = the `master` source and the local `data/payload.db` copy.
* **Production is behind local.** The local database copy has only two migrations applied (`20261014_215254_initial`, `20261014_220000_locales_indexes`), and production still serves un-fixed titles (section 6.4), so the redesign v3 commits (editorial-fix migration `20261015_223000`, topics, reviews) are NOT deployed. Every observation below says which side it came from.
* "Verified" = observed in a response or in the database copy. "Inferred" = deduced from code. "NOT VERIFIED" = not checked, with the reason.
* Task statuses use only `BACKLOG / READY / IN_PROGRESS / BLOCKED / DONE / VERIFIED`.
* This document supersedes, for verification purposes, the unchecked box "301 works for every old URL (automated test on a sample and on all ids)" in [../02-plan/06-content-model-and-migration.md](../02-plan/06-content-model-and-migration.md) (line 48). That box is still open: only a sample was tested (section 6.2).

## 1. Result at a glance

| Question | Answer | Evidence |
|---|---|---|
| Are all legacy items migrated? | 1,454 of 1,461 (99.5 percent). The 7 not migrated are empty shells on the legacy side itself (section 3.3). | Legacy listings crawled by me: 1,461 ids; local DB `legacy_id` set difference = exactly those 7 ids (section 6.1) |
| Does production hold the same content as local? | Yes by id and count: 387 / 909 / 52 / 40 / 53 / 11 / 2 in the production sitemap, identical id sets to the DB copy (no id only on one side) | `GET /sitemap.xml` on production vs `SELECT id` on the DB copy |
| Do old URLs redirect? | 37 of 37 sampled item URLs: one hop, HTTP 301, final 200, correct title. 7 unmigrated ids: 302 to the section listing. | section 6.2 |
| Do images work? | 27 of 29 sampled images identical (status, content type, byte length) between legacy and production; 1 returns 404 on production (filename contains U+FFFD); 1 legacy HEAD failed transiently (production 200). | section 6.3 |
| Do PDFs work? | PDFs are not served by the new site at all: detail pages link straight to `files.hadramout.center`. Served through `/legacy-media`, only 2 of 10 sampled were verified complete; 4 return 404 (bidi characters in file name), 2 return 404 (over the 25 MB cap), 2 returned 200 but my client timed out before the end. | section 6.3, MIG-001 |
| Is Arabic text intact? | No mojibake, no truncation observed; 1 U+FFFD (inside an image file name), stray asterisks in 14 titles (mostly footnote marks), 2 empty bodies that are empty on legacy too. | section 6.4 |
| Are dates and attribution preserved? | Yes where the source has them. 18 of 18 sampled pages: title, date and body text length equal to the live legacy page. Article dates are derived from the issue month (894) or estimated (15). | section 6.5 |

## 2. Pipeline overview

```
hadramout.center (live HTML)
   |  npm run import:legacy   (scripts/import-legacy.ts -> src/importer/crawl.ts + legacy.ts)
   v
content/legacy-snapshot.json.gz      <- committed; the source of truth after the legacy host is retired
   |  npm run db:seed         (scripts/seed.ts -> src/seed/seed.ts, then reindexAll)
   v
data/payload.db (SQLite, Payload collections; key = legacyId)
   |  npm run import:images   (scripts/import-images.ts)   [optional pre-fill]
   v
$DATA_DIR/legacy-media/YYYY/MM/<file>   <- cache of files.hadramout.center images
   ^
   |  GET /legacy-media/...   (src/app/legacy-media/[...path]/route.ts, lazy fetch on cache miss)
Old links /news/10337 -> src/proxy.ts -> /legacy/news/10337 -> 301 /ar/news/387   (see URL_REDIRECT_MAP.md)
```

## 3. How the migration works

### 3.1 Crawl and snapshot (`import:legacy`)

| Aspect | Behaviour | Evidence |
|---|---|---|
| Discovery | For each of the 7 sections, walks `https://hadramout.center/{section}?page=N` until a page adds no new ids (max 120 pages), collecting `href="/{section}/{id}"` links. | `src/importer/crawl.ts` `discoverIds`; `src/importer/legacy.ts:446` `listingIds` |
| Fetching | 4 workers, 150 ms delay after each uncached fetch, 5 attempts with exponential back-off, 30 s timeout, self-identifying User-Agent `HadramoutCenter-Migration/2.0`. HTTP 404 returns an empty page. | `crawl.ts` (class `Fetcher`) |
| Cache | Raw HTML cached per URL in `.cache/legacy` (not committed). `--offline` re-parses without network; `--refresh` ignores the cache. | `scripts/import-legacy.ts` header |
| Parsing | Pure functions in `legacy.ts` (title, body, cover, dates, author, categories, issue link, PDF, YouTube id). Body is sanitised; video-meeting credentials (Zoom, passcodes) are removed; Facebook emoji hotlinks become plain emoji. | `legacy.ts` `cleanLegacyBody`, `MEETING_PATTERN`; fixture tests in `tests/unit/importer.test.ts` |
| Dates | Real dates are used when the page shows one. Otherwise: articles take the month of their magazine issue (`datePrecision=month`), everything else is interpolated from news ids (`datePrecision=estimated`, "never displayed"). | `crawl.ts` `applyDateEstimates` |
| Output | `content/legacy-snapshot.json.gz` with `meta.discovered` and `meta.imported` counts per type. The committed snapshot says discovered 391/912/52/40/53/11/2 and imported 387/909/52/40/53/11/2. | verified by reading the file (section 6.1) |
| Failures | A page that parses to nothing is listed in `report.failed`; the script then exits with code 1 (unless `--limit` is used). The 7 known empty pages therefore always make a full run exit 1. | `scripts/import-legacy.ts:58` |

### 3.2 Seeding and idempotency (`db:seed`)

| Aspect | Behaviour | Evidence |
|---|---|---|
| Stable source id | `legacyId` (the numeric id from the legacy URL) is stored on every document and has a **unique index** on every content table (`news_legacy_id_idx`, `articles_legacy_id_idx`, ...). No duplicate `legacy_id` exists in any table. | `src/collections/shared.ts:144-146`; `sqlite_master` of the DB copy; query returned 0 duplicates per table |
| Match rule | Find by `legacyId`. Not found: create. Found and `edited=false` and `source='legacy'`: **overwrite with snapshot data**. Found and (`edited=true` or `source!='legacy'`): skip (counted as `skippedEdited`). | `src/seed/seed.ts:109-140` |
| What marks a document as edited | The `markEdited` hook sets `edited=true` on a Payload update of a legacy document unless the update comes from the importer or from the translation engine. **Raw SQL data migrations do not set it** (section 3.4). | `src/collections/shared.ts:174-181` |
| Authors | De-duplicated by a normalised key (`nameKey`); the most frequent spelling wins. 274 authors in the DB copy. | `seed.ts` `canonicalAuthors`; DB count |
| Categories | Created by exact name (`kind='article'`); 53 in the DB copy. Later curated into topics by migration `20261015_222500_curate_topics`. | `seed.ts`; `src/migrations/20261015_222500_curate_topics.ts` |
| Order | magazines first (articles link to them), then news, articles, books, events, forum, videos. | `seed.ts` `order` |
| Hooks | `skipHooks: true`, so no translation or search side effects during import; `reindexAll` runs at the end of `scripts/seed.ts`. | `seed.ts:23`, `scripts/seed.ts` |
| Defaults | Pages, timeline, glossary and site settings are created only if missing (`seedDefaults`). The `site` global is **overwritten on every run** (`updateGlobal`). | `seed.ts:168` |
| Public id | The public URL id (`/ar/news/387`) is the Payload auto-increment id, which equals the rank of the legacy id inside its type in a single full seed (observed). It is a surrogate, not a contract. See MIG-012. | matrix in [URL_REDIRECT_MAP.md](URL_REDIRECT_MAP.md) |

**Re-run safety matrix** (what happens when a command is run again on a database that already holds migrated content):

| Command | Safe to re-run? | Why / caveat |
|---|---|---|
| `npm run import:legacy` | Yes for the repository. It only rewrites the snapshot file (use `--out=` to avoid overwriting the committed one). Once the legacy host is gone it can no longer be used (`--offline` needs the local `.cache/legacy`, which is not versioned). | `scripts/import-legacy.ts` |
| `npm run db:seed` | **Mostly, not fully.** Edited documents are preserved. Un-edited documents are overwritten from the snapshot, which silently reverts every raw-SQL data migration (editorial fixes, topic curation). On a fresh database those migrations run on empty tables before any row exists (inferred: `prodMigrations` in `src/payload.config.ts:46` makes Payload apply pending migrations when it initialises, and the tools stage sets `NODE_ENV=production`; `deploy/scripts/deploy.sh:29` runs `db:seed` in that stage), so they never apply to the seeded rows. See MIG-004. | `seed.ts:109-136`; `src/payload.config.ts:46`; `Dockerfile` tools stage |
| `npm run import:images` | Yes. Skips files already cached; atomic write via `.tmp` + rename. Cannot cache 7 assets whose names contain characters rejected by `resolveLegacyPath` (MIG-001, MIG-002). | `scripts/import-images.ts` |
| `GET /legacy-media/...` | Yes (idempotent cache fill). Unauthenticated; each uncached request triggers one upstream fetch. | `src/app/legacy-media/[...path]/route.ts` |
| Redirect handler | Read-only. | `src/app/legacy/[section]/[id]/route.ts` |

### 3.3 The 7 legacy pages that cannot be migrated

`docs/03-tracking/TRACKER.md` line 10 says "7 pages broken in the source". Confirmed: on 2026-10-18 each of the 7 legacy detail URLs returns HTTP 200 with an empty page shell (no title, no body, no date), and the importer's parser reports `missing #post-content`.

| Legacy URL | Live legacy response (2026-10-18) | Importer warnings | New-site behaviour (production) |
|---|---|---|---|
| `/news/1472` | 200, 22,863 bytes, empty shell | missing #post-content, date, title | 302 to `/ar/news` |
| `/news/1538` | same | same | 302 to `/ar/news` |
| `/news/1640` | same | same | 302 to `/ar/news` |
| `/news/10300` | 200, 22,865 bytes, empty shell (listing card title is unrelated foreign-language text, see [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md) section 9) | same | 302 to `/ar/news` |
| `/articles/2544` | 200, 23,438 bytes, empty shell | missing #post-content, category, author, title | 302 to `/ar/articles` |
| `/articles/3350` | same | same | 302 to `/ar/articles` |
| `/articles/4262` | same | same | 302 to `/ar/articles` |

The listing cards of six of them still carry a title and date (inferred from [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md); I did not re-read the cards). That metadata exists only on the legacy listing pages and is not in the snapshot; it is lost when the legacy host is retired. See MIG-006.

Two further legacy events (`/events/6726`, `/events/8456`) have a title but a genuinely empty body on the legacy site (parser: `bodyLen=0`, no warning). They are migrated with an empty body (DB copy: events 48 and 52).

### 3.4 Backups and rollback

| Mechanism | What it does | Gap |
|---|---|---|
| `deploy/scripts/backup.sh` | `VACUUM INTO` consistent copies of `payload.db` and `extras.db`, then `tar czf` of `_bk media i18n`; keeps 14 archives. Cron nightly; `deploy.sh` also runs it before every non-first deploy. | **`legacy-media` is not in the tar** (`backup.sh:20`). The 4,472-image cache is lost with the volume and can only be rebuilt while the legacy host still serves the files. MIG-003. |
| `deploy/scripts/restore.sh` | Stops the app, extracts the archive into `/data`, copies the `.db` files back. | Restores whatever the archive holds (no legacy-media). |
| Snapshot in git | `content/legacy-snapshot.json.gz` (6.1 MB), commit `6e7c204`. | Contains the un-fixed text (14 titles with `*`, 2 with the doubled preposition). Rebuilding from it loses migration-applied fixes (MIG-004). |
| Database copy for audits | Copy `data/payload.db` before querying; never open the live file for writing. | n/a |

### 3.5 Media

* The database keeps **raw** `https://files.hadramout.center/media/...` URLs (covers in `cover_url`, images inside `body`). They are rewritten to `/legacy-media/...` **at render time** by `localizeLegacyMedia` (`src/lib/ctx.ts:50`, `src/app/(site)/[locale]/[section]/[id]/page.tsx:130`). No body in the DB contains `/legacy-media/` (verified: 0 documents).
* The `pdf` fields (40 magazines, 21 books) are **not** rewritten: the page renders `href={pdf}` directly (`page.tsx:134,201-202`). Verified on production: `/ar/magazines/40` links to `https://files.hadramout.center/media/2026/10/...-41.pdf`.
* `/legacy-media` accepts only `jpg, jpeg, png, gif, webp, avif, svg, pdf`, a restricted character set (`SAFE_PATH`, `legacy-media.ts:8`) and no `..`; lazy upstream fetch has a 20 s timeout, `redirect: 'error'`, and a **25 MB cap** (`route.ts:38`).
* Response headers on production for a cached image: `Content-Type: image/jpeg`, `Cache-Control: public, max-age=31536000, immutable`, `cf-cache-status: HIT`, `x-content-type-options: nosniff`.

## 4. Field mapping (legacy to new)

| Type | Collection | Public route | Legacy fields carried | Notes |
|---|---|---|---|---|
| news | `news` | `/{lang}/news/{id}` | title, body, cover, date (day precision), dateline (e.g. "المكلا / إعلام المركز") | 387 of 391 |
| article | `articles` | `/{lang}/articles/{id}` | title, body, authors (relation), category (relation), magazine issue (relation) | 909 of 912. 142 articles have no category and 0 articles have no author in the DB copy; 4 of 4 sampled no-category articles are also uncategorised on legacy |
| book | `books` | `/{lang}/books/{id}` | title, description, authors, publisher, edition, editor, translator, year, PDF | 52 of 52. 45 have authors (7 without; 4 of 4 sampled also lack an author on legacy); 21 have a PDF |
| magazine | `magazines` | `/{lang}/magazines/{id}` | title, issue number, PDF, contents body, month date | 40 of 40; issues 24 and 25 are one legacy item |
| event | `events` | `/{lang}/events/{id}` | title, body, date or range, speaker, moderator, venue, time text | 53 of 53 |
| forum | `forum_events` | `/{lang}/forum/{id}` | as events plus YouTube id; meeting credentials removed | 11 of 11 |
| video | `videos` | `/{lang}/videos/{id}` | title, YouTube id or embed URL, thumbnail | 2 of 2; 1 has a YouTube id |

Data captured by the parser but **not persisted** (no column): `data.legacy_extra` (unmapped book labels) and `data.date_source` (tells whether an article date came from its issue). See MIG-013.

## 5. Known limits of the source

* Legacy HTML is Next.js streamed output; the parser picks the last `<div hidden id="S:n">` segment containing an `<h1>`/`<h2>`. If the legacy front end changed, re-run the fixture tests (`tests/unit/importer.test.ts`, 11 saved real pages in `tests/fixtures/legacy`).
* No title slugs exist anywhere on the legacy site, so no slug-based mapping is possible: the only key is the numeric id.
* The legacy site returns HTTP 200 for unknown pages (soft 404), so a crawler cannot use status codes to detect missing items; listing pages are the only reliable inventory.

## 6. Verification results

### 6.1 (a) Counts: legacy vs database copy vs production

Legacy counts come from my own crawl of every listing page on 2026-10-18 (87 requests, until a page added nothing new). Production counts come from `GET https://hadramout-center.novixa.dev/sitemap.xml` (`/ar/{type}/{id}` URLs).

| Type | Legacy (listing crawl) | Snapshot `imported` | DB copy | Production sitemap | Not migrated (legacy ids) |
|---|---:|---:|---:|---:|---|
| news | 391 | 387 | 387 | 387 | 1472, 1538, 1640, 10300 |
| articles | 912 | 909 | 909 | 909 | 2544, 3350, 4262 |
| books | 52 | 52 | 52 | 52 | none |
| magazines | 40 | 40 | 40 | 40 | none |
| events | 53 | 53 | 53 | 53 | none |
| forum | 11 | 11 | 11 | 11 | none |
| videos | 2 | 2 | 2 | 2 | none |
| **Total** | **1,461** | **1,454** | **1,454** | **1,454** | **7** |

* Set difference of `legacy_id` vs the legacy listing ids: exactly the 7 ids above, nothing extra in the DB.
* The sitemap id sets equal the DB `id` sets for all 7 types (sitemap min id 1, max id = count; no id only on one side).
* All rows in the DB copy have `status=published`, `source=legacy`, `edited=0`.
* TRACKER says 4,473 images. The DB references 4,472 distinct `files.hadramout.center` image URLs plus 1 YouTube-thumbnail cover = 4,473 (arithmetic consistent; whether all 4,472 files are physically cached on the production volume is NOT VERIFIED, I cannot read the volume).
* Reproduce: section 1-2 of [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md).

### 6.2 (b) Old URLs on production

Full matrix in [URL_REDIRECT_MAP.md](URL_REDIRECT_MAP.md) section 5: 37 sampled item URLs across all 7 types (first, last and spread ids), 7 unmigrated ids and 17 edge cases, 61 cases in total, 121 requests.

* 37 of 37: `301` then `200`, a single hop, final URL `/ar/{type}/{n}`, `<h1>` equal to the DB title, canonical equals the final URL, `robots: index, follow`.
* The public id in production equals the DB-copy id for all 37 (so the DB copy is a faithful stand-in for production ids).
* The 7 unmigrated ids: `302` then `200` on the section listing (no 404/410).
* Not covered: all 1,454 ids (NOT VERIFIED; script in the checklist), other languages, Googlebot-specific behaviour.

### 6.3 (c) Images and PDFs

Method: for each file, `HEAD` on `https://files.hadramout.center/media/<path>` and `GET` on `https://hadramout-center.novixa.dev/legacy-media/<path>`, compare status, content type, byte length. Sample: 29 images (spread over 2016 to 2026, including Arabic names, size-suffixed names and the one U+FFFD name) and 10 PDFs.

| Result | Images (29) | PDFs (10) |
|---|---:|---:|
| Identical status, type and byte length | 27 | 2 |
| Production 200, legacy HEAD failed transiently | 1 (`2017/09/2-2.jpg`, 30,825 bytes, `image/jpeg` on production) | 0 |
| Production 200, but my 70 s client timeout cut the body (not verified complete) | 0 | 2 (`العدد-35.pdf` 40,538,608 bytes on legacy, `العدد-28.pdf` 19,835,505 bytes) |
| Production 404, legacy 200 | 1 (`2026/02/CamScanner-...�...-703x1024.jpg`, 128,005 bytes on legacy) | 6 |

The 6 PDF 404s: 4 file names contain invisible bidi controls (U+200E, U+2068, U+2069), rejected by `SAFE_PATH`; 2 (`2023/10/العدد-9.pdf` 51,006,146 bytes and `2023/10/العدد-18.pdf` 39,638,274 bytes) exceed the 25 MB lazy-fetch cap and are not in the cache. Offline check of all references in the DB copy with the real `resolveLegacyPath`: of 4,535 image and PDF URLs, **7 are rejected** (2 images with U+FFFD, 5 PDFs with bidi controls).

PDFs are not affected today only because the pages link them directly to the legacy host. See MIG-001 and MIG-002.

### 6.4 (d) Arabic text integrity (DB copy, `ar` locale, 1,454 documents)

Queries are in section 5 of [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md). Only the `ar` locale exists in the DB copy.

| Check | Result | Assessment |
|---|---|---|
| Mojibake (Latin-1 lead bytes `Ã Ø Ù` followed by C1/continuation range, `â€`) | 0 documents | Clean |
| U+FFFD | 1 document (news 331): inside an image file name in an `<img src>` | Source defect; makes the image 404 on the new site (MIG-002) |
| Truncation | 18 of 18 sampled pages: visible body text length on the live legacy page equals the DB body text length exactly | No truncation observed in the sample; full-corpus truncation check NOT VERIFIED (no second source after the legacy site is retired) |
| Title/body empty | 2 events with empty body and excerpt (legacy ids 6726, 8456) | Empty on the live legacy page too |
| Stray `*` in titles | 14 titles (10 articles, 4 forum events) | Mostly footnote marks (`(*)`, `[*]`, trailing `*`), not Markdown emphasis; see MIG-005 |
| `*` in bodies | 174 articles, 6 forum events, 1 news, 1 book | Mostly poetry hemistich separators (`**`, `***`) and footnote marks: legitimate, do not strip |
| Doubled preposition `عن بعنوان` | 2 forum titles (forum 8 and 9) | Source defect, fixed by migration `20261015_223000` on databases that already held the rows; still present in the snapshot |
| Doubled word (naive regex) | 117 article bodies, 3 news bodies, 1 book body, 2 magazine bodies, 2 event titles | Body hits are mostly legitimate (poetry repetition: "أنت وأنت وأنت"). Real source typos: event 3 title ends "في حضرموت حضرموت", event 31 title ends "في إندونيسيا إندونيسيا", news 127 excerpt "مركز حضرموت حضرموت للدراسات". Not fixed by any migration (MIG-014) |
| Entities | 45 documents contain `&amp; &lt; &gt; &quot;`; none double-encoded | Valid HTML encoding (one `<pre><code>` block with an escaped iframe in news 322 is intentional) |
| Source garbage kept | articles 401: `?????????` literal run; articles 368: link with a relative `href="الخميس%2029%20يناير%202009م "` | Present on legacy; harmless but a visible defect (MIG-014) |
| Production vs DB copy | Production still shows `*` and `عن بعنوان` on forum 8 (`<h1>...عن بعنوان *الصورة...`) and the `(*)` / `[*]` titles of articles 254 and 540 | Confirms the editorial-fix migration is not yet applied in production |

Simulating migration `20261015_223000` on a scratch copy of the DB (not on the repository database) produced two empty bracket pairs: article 254 becomes `...عائشة الحطّاب() نص...` and article 540 becomes `وللكويت رحلتها..[]` (MIG-005).

### 6.5 (e) Dates and attribution

| Check | Result |
|---|---|
| Live legacy page vs DB, 18 pages (4 news, 4 articles, 2 books, 2 magazines, 2 events, 2 forum, 2 videos) | Title equal 18/18; date equal where the legacy page has a date (news, books, magazines, events, forum 7821); body text length equal 18/18 |
| Date precision in the snapshot | news 387 day; events 53 day; forum 5 day + 6 estimated; magazines 40 month; articles 894 month (from issue) + 15 estimated; books 48 year + 4 estimated; videos 2 estimated; none undated |
| Display policy | Dates with `estimated` or `none` precision are not shown and are not emitted as `datePublished` in JSON-LD (`src/lib/ctx.ts:54-57`, `src/lib/jsonld.ts:43`, `src/lib/facets.ts:51`) |
| Article authors | 909 of 909 articles have at least one author relation; 4 sampled no-category articles show an author on legacy and in the DB |
| Book authors | 45 of 52 books have authors; the 4 sampled books without an author also lack one on legacy |
| Publisher, edition | publisher filled for 48 books, edition for 17 |
| Event fields | speaker filled for 5 of 53 events, venue for 2 (only what the legacy page labels); YouTube id on 11 of 11 forum events and 1 of 2 videos |

Note: article dates are the **issue** month. They are shown as month and year, which a reader may take as the article's own date (MIG-013).

## 7. Risks and decisions needed

| # | Risk or decision | Owner |
|---|---|---|
| D1 | What to do with the 6 real but empty legacy entries (stub from listing metadata, or 410)? Capture the listing metadata before the legacy host is retired. | Center editors + dev |
| D2 | Who controls `files.hadramout.center`, and for how long will it keep serving the 63 PDFs and any image not yet cached? NOT VERIFIED (no information in the repository). | Center / Novixa |
| D3 | Final domain: when `hadramout.center` is pointed at the new site, the redirect handler builds absolute targets from `SITE_URL` (`route.ts:12`); production currently emits `hadramout-center.novixa.dev`. | Novixa |

## 8. Findings

Each finding is also returned in structured form; ids are stable.

| ID | Sev | Title | Evidence (short) |
|---|---|---|---|
| MIG-001 | high | PDFs are served from the legacy host and cannot be mirrored locally as-is | `page.tsx:134,201`; production `/ar/magazines/40` links to `files.hadramout.center/...pdf`; 6 of 10 PDF probes 404 on `/legacy-media` |
| MIG-002 | medium | Two images in news 331 return 404 on production | `legacy-media.ts:8`; legacy 200 (128,005 bytes) vs production 404 |
| MIG-003 | high | Backups exclude the `legacy-media` cache | `deploy/scripts/backup.sh:20` |
| MIG-004 | medium | Re-seeding or rebuilding silently undoes data migrations | `seed.ts:109-136`; snapshot has 14 `*` titles |
| MIG-005 | medium | Editorial migration leaves `()` and `[]` in two titles; not yet applied in production | simulation; production h1 of articles 254, 540 |
| MIG-006 | medium | 7 legacy URLs get a soft redirect and 6 real entries are lost | matrix; legacy empty shells |
| MIG-007 | medium | No automated test of the legacy redirect map | `tests/unit` has none; smoke checks one URL |
| MIG-008 | medium | Domain cutover prerequisites are not in place | nginx `server_name`; `SITE_URL` |
| MIG-009 | low | Redirect edge cases (2-hop trailing slash, uppercase, query, language) | URL_REDIRECT_MAP section 4 |
| MIG-010 | low | 801 documents link to `https://hadramout.center/magazines/{id}` | DB query |
| MIG-011 | low | Forum brochure PDF on S3 not migrated | legacy `/forum` listing vs DB |
| MIG-012 | low | Public ids are surrogate auto-increment values | matrix; `seed.ts` |
| MIG-013 | low | Article dates are issue-derived and the provenance is not stored | `crawl.ts`; `articles` columns |
| MIG-014 | low | Source text defects are carried over | section 6.4 |
| MIG-015 | info | Migration fidelity verified (counts, text length, titles, authors) | section 6 |
| MIG-016 | low | Importer exits 1 forever because of the 7 known pages | `import-legacy.ts:58` |

## 9. Task list

| ID | Task | Status | Acceptance criteria | Verification |
|---|---|---|---|---|
| T-MIG-01 | Mirror all 63 PDFs into the data volume and serve them from `/legacy-media`; rewrite `pdf` fields with `localizeLegacyMedia`; relax `SAFE_PATH` to accept bidi controls and U+FFFD, or normalise those file names on download; raise or remove the 25 MB cap for PDFs and the 30 s timeout in `import-images.ts` | BACKLOG | All 63 PDF URLs return 200 `application/pdf` with byte length equal to legacy; the magazine page links to `/legacy-media/...pdf` | checklist step 4.3 (script); `curl -I` on 10 PDFs including the 4 bidi names and `العدد-9.pdf` |
| T-MIG-02 | Make the 2 U+FFFD images and 5 bidi PDFs resolvable (see T-MIG-01) | BACKLOG | `resolveLegacyPath` rejects 0 of the 4,535 referenced URLs | checklist step 4.1 prints `rejected 0` |
| T-MIG-03 | Add `legacy-media` to `backup.sh` (or mirror it with rsync/rclone to off-server storage) and prove a restore | BACKLOG | `tar tzf <archive>` lists `legacy-media/`; restore drill on a scratch VPS serves images with the legacy host blocked | checklist step 7 |
| T-MIG-04 | Make the seed reproduce migrated state: apply editorial fixes and topic curation inside the importer/snapshot (regenerate the snapshot with fixes) or run data migrations after seeding; make migrations set `edited` semantics explicit | BACKLOG | A fresh install (empty volume, `migrate` then `db:seed`) has 0 titles with `عن بعنوان`, 0 titles with stray `*`, and the curated topics | checklist step 5 on a fresh DB |
| T-MIG-05 | Fix the editorial migration so footnote markers `(*)` and `[*]` are removed together with their brackets | BACKLOG | No title contains `()` or `[]` after migration (articles 254, 540) | checklist step 5, query 5.6 |
| T-MIG-06 | Decide D1; implement stub entries or 410 for the 7 ids; capture the 7 listing cards now | BACKLOG | The 7 URLs return a deliberate response (200 stub with `noindex`, or 410); card metadata saved in the repo | checklist step 3.4 |
| T-MIG-07 | Add a unit test for the redirect handler/proxy and a full-sweep script run in CI against a seeded DB | BACKLOG | Test covers: known id, unknown id, non-digit, trailing slash, cookie language; sweep reports 1,454 x 301 and 7 x defined response | `npm test` plus checklist step 3.2 |
| T-MIG-08 | Prepare cutover: nginx vhost and certificate for `hadramout.center` and `www`, `SITE_URL` set, `files.hadramout.center` plan | BLOCKED (domain decision, D2/D3) | `curl -I https://hadramout.center/news/10337` returns 301 to `https://hadramout.center/ar/news/387` | checklist step 8 |
| T-MIG-09 | Redirect polish: collapse `/news/10337/` to one hop, lowercase section matching, add `Vary: Cookie` | BACKLOG | edge-case rows E1, E3 in URL_REDIRECT_MAP show one hop / defined result | rerun the edge matrix |
| T-MIG-10 | Rewrite in-body absolute links to the legacy host (`https://hadramout.center/magazines/{id}`) to site-relative links, or accept them as redirect-dependent | BACKLOG | 0 bodies contain `//hadramout.center/` | checklist step 5, query 5.9 |
| T-MIG-11 | Persist `date_source` (issue vs own date) and decide how article dates are labelled | BACKLOG | Column exists; article pages show "issue date" semantics or no day/month | DB query; page check |
| T-MIG-12 | Add known-missing allowlist to the importer so a full run exits 0 with the 7 documented | BACKLOG | `npm run import:legacy` exit code 0 with warnings listing the 7 | run with `--offline` |

## 10. Corrections to earlier documents

* [../03-tracking/TRACKER.md](../03-tracking/TRACKER.md) line 10 ("301 for old links: done"): true for the 1,454 migrated items (37 of 37 sampled), but the 7 unmigrated ids get a `302`, not a `301` or `410`.
* [../02-plan/06-content-model-and-migration.md](../02-plan/06-content-model-and-migration.md) line 48: the full-id redirect test is still open (this document and the checklist provide the script).
* [../09-redesign/02-editorial-issues.md](../09-redesign/02-editorial-issues.md) section A states the asterisk fix is certain and mechanical; it is correct for 12 of 14 titles, see MIG-005 for the other 2.
