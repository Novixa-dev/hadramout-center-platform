# Legacy Site Inventory and Parity Matrix

| | |
|---|---|
| **Purpose** | Inventory every route template, feature, asset host and content type of the legacy site `https://hadramout.center`, verify the reported content counts independently, and map each item to its equivalent on the new platform with a parity status. |
| **Scope** | Legacy site (read-only crawl), the new platform's routes and legacy-redirect handling in the local `master` source, and spot probes of production `https://hadramout-center.novixa.dev`. Out of scope: visual design, performance, accessibility scoring, translation quality (other audit areas). |
| **Status** | Audit complete. All remediation tasks in section 12 are `BACKLOG`; nothing was changed in the repository other than this file. |
| **Last updated** | 2026-10-18 |
| **Finding prefix** | `LEG-` (section 11) |
| **Extends / supersedes** | Extends [`../01-audit/02-legacy-site-analysis.md`](../01-audit/02-legacy-site-analysis.md) (Arabic, dated 2026-10-14). Its counts are confirmed (section 2). It is superseded on three points listed in section 14. Raw counts also exist in [`../01-audit/evidence/legacy-site-counts.json`](../01-audit/evidence/legacy-site-counts.json). |
| **Related** | [`../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md`](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) · [`../08-review/01-site-review-old-vs-new.md`](../08-review/01-site-review-old-vs-new.md) · [`../03-tracking/TRACKER.md`](../03-tracking/TRACKER.md) · [`../05-deploy/01-vps-deploy-guide.md`](../05-deploy/01-vps-deploy-guide.md) |
| **Evidence base** | Observations made on 2026-10-18 (GET/HEAD only, at least 300 ms between requests, roughly 380 requests in total, estimated). Legacy: all listing pages of all 7 content types, 120+ detail pages. New site: about 80 requests to production plus a read-only copy of `data/payload.db` (local, dated 2026-10-16) and the `src/` tree. No form was submitted. No secret was read or recorded. |

## 0. Reading guide

* **Legacy** = `https://hadramout.center` (Next.js on Vercel). **Production** = `https://hadramout-center.novixa.dev` as it answered on 2026-10-18. **Local** = the `master` branch on disk (10 commits ahead of `origin`).
* Production and local differ. Production has no `/ar/topics` (HTTP 404) although the route exists in local source (added in commit `35f7a63`), no newsletter block in the footer HTML, and ignores `?pdf=1` on `/ar/books`. So production is behind local (see LEG-006). Every row below says which of the two was observed.
* "Verified" means I observed it in a response or in the database copy. "Inferred" means deduced from code or structure. "NOT VERIFIED" means I could not observe it, with the reason.
* Task statuses use only `BACKLOG / READY / IN_PROGRESS / BLOCKED / DONE / VERIFIED`. Parity statuses use `Preserved / Improved / Missing / Inaccessible / Requires migration`.
* Priority scale: **P0** blocks go-live or decommissioning of the legacy host, **P1** should be done before launch, **P2** soon after launch, **P3** polish or decision-only.

## 1. Legacy site at a glance (verified)

| Item | Observation | Evidence |
|---|---|---|
| Stack and host | Next.js App Router, served by Vercel (`Server: Vercel`, `X-Vercel-Id`, `X-Matched-Path`). No CSP, no analytics script found in HTML (no GTM, gtag, Clarity, Plausible). | `curl -I https://hadramout.center/` |
| Language | Arabic only (`<html lang="ar" dir="rtl">`). No `/en`, `/ar` prefix, no language switch, no `hreflang`. | `GET /en` returns the soft-404 page |
| Search | None. `/search` and `/search?q=حضرموت` return the soft-404 page. `?q=` and `?category=` on `/articles` are ignored (same listing returned). | probes 2026-10-18 |
| Forms | None. Contact is by `mailto:info@hadramout.center` and two WhatsApp links only. | home HTML hrefs |
| Feeds | None. `/feed`, `/rss.xml`, `/feed.xml` return the soft-404 page. | probes |
| Header navigation (6) | الأخبار `/news` · الكتب `/books` · المقالات `/articles` · المؤتمرات `/events` · المجلة `/magazines` · الفيديوهات `/videos` (each linked as `?page=1`). `/forum` and `/about` are linked only from the home page body. | home HTML |
| Footer | Full name and address (عمارة باشريف، بجانب مسجد الغالبي، حي الشهيد خالد، المكلا)، email, WhatsApp `00967773570194` and `00966556408983`, social links (X, Facebook, Instagram, Telegram, YouTube), "© 2024". The copyright year is stale (content dated up to 2026-10-04). | home HTML |
| Home sections | Latest-issue hero (issue 41, link to `/magazines/10304`), institution blurb with "عن المركز" link to `/about`, 3 latest news, 2 videos, 4 books, 3 events, 6 latest articles. | home HTML |
| Sitemap | `/sitemap.xml` has 8 URLs, `lastmod` 2024-05-25 for all: `/`, `/books`, `/magazine`, `/events`, `/articles`, `/news`, `/about`, `/contact`. `/magazine` (singular), `/about` and `/contact` are soft 404s. `/magazines`, `/videos`, `/forum` and every detail page are absent. `/sitemap_index.xml` is a soft 404. | `GET /sitemap.xml` |
| robots.txt | `User-agent: *`, `Allow: /`, `Sitemap: https://hadramout.center/sitemap.xml`. | `GET /robots.txt` |
| Soft 404 | Any unknown path returns **HTTP 200** with title "الصفحة غير موجودة - مركز حضرموت", no `noindex` (route `/[page]`). Unknown detail ids (`/news/5000`) also return 200 but do carry `<meta name="robots" content="noindex">`. `/.well-known/security.txt` returns a real 404. | `/about`, `/contact`, `/magazine`, `/nonexistent-xyz`, `/news/abc`, `/news/5000` |
| Pagination edge cases | `?page=0` returns page 1 content; `?page=999` returns 200 with an empty list. | probes |
| Redirects | `http://` redirects 308 to `https://`. `/news/10337/` redirects 308 to the slashless form. `https://www.hadramout.center/` fails TLS (certificate name mismatch, `SEC_E_WRONG_PRINCIPAL`), so `www` is unusable. | probes |
| PWA manifest | `/manifest.json` exists (name "مركز حضرموت للدراسات التاريخية", `display: browser`, `scope: https://hadramout.center/`). | `GET /manifest.json` |

## 2. Content counts: independent verification

Method: for each type I requested `/{type}?page=N` for N = 1, 2, ... until a page returned no new detail links, collected unique `/{type}/{id}` links, and cross-checked against the local database copy.

| Type | Reported | **Counted on legacy** | Pages (per page) | Id range | Migrated (local DB and production sitemap) | Gap |
|---|---:|---:|---|---|---:|---|
| News `/news` | 391 | **391** | 19 non-empty pages (21 × 18, then 13) | 226 to 10337 | 387 | 4 not migrated |
| Articles `/articles` | 912 | **912** | 44 non-empty pages (21 × 43, then 9) | 1953 to 9597 | 909 | 3 not migrated |
| Books `/books` | 52 | **52** | 5 pages (12 × 4, then 4) | 246 to 9990 | 52 | 0 |
| Events `/events` | 53 | **53** | 6 pages (10 × 5, then 3) | 1391 to 8458 | 53 | 0 |
| Magazine issues `/magazines` | 40 | **40** | 4 pages (12 × 3, then 4) | 76 to 10304 | 40 | 0 |
| Videos `/videos` | 2 | **2** | 1 page | 9934 to 10158 | 2 | 0 |
| Forum events `/forum` | 11 | **11** | 1 page (11 cards) | 5891 to 7821 | 11 | 0 |
| **Total** | 1,461 | **1,461** | | | **1,454** | **7** |

* All reported counts are **confirmed exactly**. No discrepancy against `docs/01-audit/evidence/legacy-site-counts.json`.
* The 1,461 ids are unique across types (no id appears in two sections), which indicates one shared, non-contiguous id space (inferred: WordPress post ids behind a headless Next.js front end).
* "40 issues vs latest issue 41": the 40 items are issues 1 to 41 with issues 24 and 25 published as **one** item (`/magazines/266`, PDF named `العدد-24-25.pdf`). So no issue is missing.
* The 1,454 migrated figure matches the production sitemap (388 + 910 + 53 + 41 + 54 + 12 + 3 `ar` URLs, each including one listing URL, equals 387 + 909 + 52 + 40 + 53 + 11 + 2) and the local database copy. `docs/03-tracking/TRACKER.md` line 10 says "7 broken pages in the source". I confirmed that claim, see section 9.

## 3. URL patterns, ids and conventions (legacy)

| Pattern | Meaning | Notes |
|---|---|---|
| `/` | Home | |
| `/{section}?page=N` | Listing, N is 1-based | Sections: `news`, `articles`, `books`, `events`, `magazines`, `videos`, `forum`. `page` absent or `0` shows page 1. Per-page: news 21, articles 21, books 12, events 10, magazines 12; videos and forum fit on one page. No other parameter is honoured (no search, filter or sort). |
| `/{section}/{id}` | Detail | `id` is a decimal number, not a slug. No title slug exists anywhere, so URLs carry no keywords. Non-numeric or unknown ids return the soft-404 page. |
| `/about`, `/contact`, `/magazine` | Linked or sitemap-listed pages | All soft 404 (HTTP 200, "not found" body). |
| `https://files.hadramout.center/media/YYYY/MM/{filename}` | Images and PDFs | Cloudflare-served, `Cache-Control: public, max-age=2592000`. The host root returns 404. Filenames are Arabic and contain spaces replaced by hyphens, WordPress size suffixes (`-1024x683`), and in 5 PDF names invisible bidi control characters (U+200E, U+2066, U+2069). |
| `https://s3.me-south-1.amazonaws.com/assets.hadramout.center/uploads/2024/05/...pdf` | Forum brochure PDF | Only one such link was found (forum listing). `assets.hadramout.center` does **not** resolve in DNS (it is only a bucket name inside an S3 path). The S3 URL timed out twice (20 s) from the audit machine: availability NOT VERIFIED. |
| `https://www.youtube.com/embed/{id}` | Embedded videos | Used by video and forum detail pages. |
| `/_next/image?url=...` | Next.js image optimiser for `files.hadramout.center` images | Not an archival URL. |

Listing order is fixed (not user selectable): news and events newest first by date, articles and books by descending id, magazines by issue number descending. Event and forum cards show day and month without the year.

## 4. Route-template parity matrix

One row per template. "Sample" lists concrete legacy URLs that I fetched. "New" columns state what was observed on **P** (production) or **L** (local source only).

| Legacy URL | Page type | Purpose | Main features | Content / data | Media / assets | SEO properties seen (legacy) | New equivalent | Status | Priority | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Home | Entry point | Latest-issue hero with "لقراءة المجلة" PDF link, about blurb, 6 content shelves | Aggregates latest of each type | Hero issue cover, thumbnails from `files.hadramout.center` | Title `الرئيسية - مركز حضرموت للدراسات التاريخية`; one site-wide description `مركز حضرموت للدراسات التاريخية والتراث والنشر` (says "التراث", the official name says "التوثيق"); OG title/image/size, `twitter:card=summary_large_image`; no canonical, no JSON-LD, no hreflang | `/{lang}` (`src/app/(site)/[locale]/page.tsx`). **P** `/ar`: title, rich description, `canonical`, `hreflang ar/en/x-default`, `og:locale ar_YE`, `robots index, follow, max-image-preview:large` | Improved | P2 | `curl -s https://hadramout-center.novixa.dev/ar \| grep -o 'rel="canonical"[^>]*'` |
| `/news?page=N` | Listing | Chronological news | Numbered pager (window of 6 plus "المزيد من الصفحات"), 21 cards per page | 391 items: image, day-month-year date, title | Card thumbnails | Title `أخبار المركز - مركز حضرموت`; generic description; generic OG image; no canonical | `/{lang}/news?page=N`. **P**: 387 results, year facet (2015 to 2026), sort (newest, oldest, title), 12 per page, `noindex` on customised views. Facets declared in source for news: `q`, `year` (`FACETS` in `src/lib/list-query.ts`); the `q` box was not looked for on P | Improved | P1 | `curl -s 'https://hadramout-center.novixa.dev/ar/news' \| grep -o '[0-9]* نتيجة'` |
| `/news/{id}` (sample: 226, 313, 995, 10198, 10337) | Detail | One news item | Title, date text ("04 أكتوبر 2026"), dateline ("المكلا / إعلام المركز"), body HTML, image gallery, Web Share button "شارك الخبر" | Body, date, dateline. Some bodies contain a YouTube link as plain text ("فيديو الخبر: https://youtu.be/...", news 226) | Cover plus inline images: news 313 has 47 distinct image files on the legacy page (cover plus 46 inline); news 226 has 9 | `<title>{headline} - مركز حضرموت` (only type besides events and videos with a unique title); `og:image` is the item cover; description is generic; titles contain double-escaped entities (`&amp;#8220;`); no canonical, no JSON-LD | `/{lang}/news/{payloadId}`; legacy id resolved by `/legacy/news/{id}` (301). **P** `/news/10337` returns 301 to `/ar/news/387`; `/ar/news/2` (legacy 313) shows 46 distinct inline images served from `/legacy-media/...` plus the cover, matching the legacy page, and 0 references to `files.hadramout.center`. `NewsArticle` JSON-LD, canonical, `og:type=article` | Improved | P1 | `curl -sI https://hadramout-center.novixa.dev/news/10337` expects 301 `Location: .../ar/news/387` |
| `/articles?page=N` | Listing | Scholarly articles | Pager, 21 per page, card shows author and title | 912 items | Rarely images | Title `المقالات - مركز حضرموت`; generic OG and description | `/{lang}/articles`. **P**: year facet, sort, 20 per page. **L** only: topic facet (`category`), author facet, compact view, `/topics`, `/authors` pages (`FACETS` in `src/lib/list-query.ts`) | Improved | P1 | `curl -s .../ar/articles \| grep -o '[0-9]* نتيجة'` expects 909 |
| `/articles/{id}` (sample: 1953, 4000, 9597, 2317) | Detail | Full article text | Title, category label ("دراسات"), author, "هذه المقالة منشورة في مجلة حضرموت الثقافية العدد N" linking to `/magazines/{issueId}`, long HTML body (up to 82,785 characters in the DB; `articles/2317` is a 298 KB HTML response) | 894 of 909 migrated articles are linked to an issue; 767 have a category; 912 author relation rows exist for 909 articles | Almost none | **`<title>` is the generic `مركز حضرموت للدراسات التاريخية` on every article sampled (6 of 6 including broken ones)**; `og:image` generic; no date, no canonical, no JSON-LD | `/{lang}/articles/{id}`. **P** `/ar/articles/909`: unique title, `ScholarlyArticle` JSON-LD, citations (APA, MLA, Chicago, Harvard, BibTeX, RIS, CSL-JSON), author link `/ar/authors/249`, issue link `/ar/magazines/36`, reading time, TOC (**L** for `showToc` when more than 2 headings) | Improved (but dates wrong, see LEG-002) | P1 | Compare body text of `legacy /articles/9597` and `/ar/articles/909` (same heading "ثانيًا: تاريخ حضرموت القديمة") |
| `/books?page=N` | Listing | Publications | 12 per page, cover cards | 52 | Covers | Title `كتب المركز - مركز حضرموت`; generic | `/{lang}/books`. **P**: 52 results, year and sort facets. **L**: `pdf=1` facet (P ignores it: still 52 results) | Improved | P2 | `curl -s '.../ar/books?pdf=1' \| grep -o '[0-9]* نتيجة'` expects 21 once deployed |
| `/books/{id}` (sample: 246, 9308, 9882, 9990) | Detail | Book record | Cover, description, "تأليف", editor ("تحقيق"), "رقم الطبعة", "الناشر", "تاريخ النشر", "ملف الكتاب للتحميل" link when a PDF exists | 21 of 52 books have a PDF; 31 have none | Cover; PDFs on `files.hadramout.center/media/2023/10/...pdf` (5 filenames carry bidi control characters) | **Generic `<title>` on all 52**; `og:image` generic (cover not used) | `/{lang}/books/{id}`. **P** `/ar/books/1`: unique title, `Book` JSON-LD, `og:image` = cover, PDF button. PDF href still `https://files.hadramout.center/media/...` (verified) | Preserved (PDF host unchanged, LEG-001) | P0 | `curl -sI` each of the 21 PDF URLs expects `200 application/pdf` |
| `/magazines?page=N` | Listing | Journal issues | 12 per page, cover and "مجلة حضرموت الثقافية العدد N" | 40 | Covers | Title `مجلة حضرموت الثقافية - مركز حضرموت`; generic | `/{lang}/magazines`. **P**: 40 results | Preserved | P1 | listing count equals 40 |
| `/magazines/{id}` (sample: 76, 9079, 10304) | Detail | One issue | "لتحميل المجلة" PDF link, release note, "محتويات العدد" as formatted plain text (section headings, titles, authors, page numbers). **The contents list contains no links to the issue's articles** (0 links to `/articles/` on the 2 issues checked for this: 10304 and 9079) | 40 PDFs | PDFs on `files.hadramout.center/media/YYYY/MM/` (issue 41 = 59,202,598 bytes; issue 4 lives under `/2017/06/`, the others under `/2023/10`, `/2023/12`, and so on) | **Generic `<title>` on all 40**; `og:image` generic | `/{lang}/magazines/{id}`. **P** `/ar/magazines/40`: PDF link, no article links. **L**: "article.issueArticles" section (line 392 of `[section]/[id]/page.tsx`) lists the issue's articles | Improved (L) / Preserved (P) | P1 | `curl -s .../ar/magazines/36 \| grep -c 'href="/ar/articles/'` should be above 0 after deploy |
| `/events?page=N` | Listing | Conferences, lectures | 10 per page, "day month" label without year | 53 (2016-01-17 to 2024-11-26 by migrated date) | None | Title `المؤتمرات والندوات - مركز حضرموت`; generic | `/{lang}/events`. **P**: 53 results. Facets `when` (upcoming/past) and `year` | Improved | P2 | count equals 53 |
| `/events/{id}` (sample: 1391, 8229, 8458, +17 more) | Detail | Event notice or report | Title, date range ("26 نوفمبر 2024 - 26 نوفمبر 2024"), speaker, moderator, venue text | Mostly short text; 20 of 53 fetched | **No images in any of the 20 fetched events**; no PDFs; 1 of 20 (8229) contains Zoom meeting id and passcode | Unique `<title>`; titles show literal `&amp;#8211;`; generic OG | `/{lang}/events/{id}`, plus `/api/hc/ics/events/{id}.ics` calendar download (P route exists, Preserved + Improved). Zoom credentials stripped by the importer (DB: 0 bodies contain `Passcode`, `Meeting ID` or `zoom.us`) | Improved | P2 | `grep -c Passcode` on `/ar/events/51` returns 0 |
| `/videos` | Listing | Video library | 2 cards | 2 | Thumbnails: none | Title `الفيديوهات - مركز حضرموت` | `/{lang}/videos`. **P** 2 items | Preserved | P2 | count equals 2 |
| `/videos/{id}` (9934, 10158) | Detail | One video | YouTube iframe (9934: `8mLzjsj-kw0`). **10158 shows "رابط الفيديو غير صالح لعرض يوتيوب" and no player** | 2 | Embed only | Unique title, generic OG | `/{lang}/videos/{id}`. **P** `/ar/videos/1` uses `youtube-nocookie.com` embed (VideoFacade). `/ar/videos/2` shows description text and no player (source URL not in legacy HTML: NOT VERIFIED) | Preserved (1 of 2 playable, LEG-009) | P3 | open `/ar/videos/2`, confirm the missing source with the client |
| `/forum` | Listing | منتدى عميد الوفاء Cultural Forum | Intro text, **"لتحميل البروشور التعريفي بالمنتدى" link to a PDF on S3**, list of events | 11 events | Brochure PDF | Title `منتدى عميد الوفاء - مركز حضرموت` | `/{lang}/forum`. **P**: intro text present, 11 results, facets year and `when`. **Brochure link absent** (no `.pdf`/`amazonaws` href on the page; 0 `amazonaws` references in the DB) | Preserved except brochure: **Missing** | P1 | `curl -s .../ar/forum \| grep -c '\.pdf'` expects at least 1 |
| `/forum/{id}` (5891, 5893, 7821) | Detail | Forum event | Speaker, moderator, time, place, YouTube iframe (11 of 11), Facebook and Zoom blocks (6 of 11 pages contain `us06web.zoom.us` plus meeting id and passcode) | 11 | YouTube embeds, Facebook plugin scripts (`static.xx.fbcdn.net`) | **Generic `<title>` on all 11** | `/{lang}/forum/{id}`. **P** `/ar/forum/11`: `youtube-nocookie` embed, no credentials | Improved | P2 | `grep -ci passcode` on all 11 pages expects 0 |
| `/about` (linked from home) | Missing page | Institution profile | **HTTP 200 soft-404 body "لم نتمكن من العثور على الصفحة"** | none | none | `الصفحة غير موجودة`, no noindex | `/{lang}/about` (CMS page `about`, 1,465 characters). **P** `/ar/about` returns 200 with canonical, `robots index`. **New content, not migrated**: text composed from the legacy home blurb plus structured sections | Inaccessible (legacy) / new page: Requires client review | P1 | client approves the text (LEG-008) |
| `/contact` (sitemap only) | Missing page | Contact | Soft-404 | none | none | Soft-404 title | `/{lang}/contact`. **P**: address, email (Cloudflare obfuscated), two WhatsApp numbers, social links, form (name, email, phone, subject, message) writing to the `messages` collection. No email notification code exists (LEG-014) | Improved | P1 | submit a test message in staging and confirm an admin sees it |
| `/magazine` (singular, in legacy sitemap) | Broken sitemap entry | none | Soft-404 | none | none | Soft-404 title | `/magazine` redirects 307 to `/ar/magazine`, which is not a section (expected 404) | Missing (never worked) | P3 | no action beyond noting it |
| unknown path (any) | Error template | 404 | Link "الرجوع للصفحة الرئيسية" | none | none | **HTTP 200**, no noindex on path 404s | **P** real HTTP 404 with `robots noindex` (`/ar/nonexistent-xyz`, `/ar/news/99999`) | Improved | P3 | `curl -sI .../ar/nonexistent-xyz` returns 404 |
| `/sitemap.xml` | Sitemap | Discovery | 8 URLs, no detail pages | | | `lastmod` 2024-05-25 | **P** 1,487 URLs with `xhtml:link` hreflang, `ar` and `en` | Improved | P1 | see `../seo/` audit for details |
| `/robots.txt` | Robots | Crawl policy | Allow all | | | | **P** disallows `/admin`, `/api/`, `/*/search`, `/*/saved`; but `Host` and `Sitemap` still say `https://hadramout.center` (LEG-007) | Improved, with defect | P1 | `curl -s .../robots.txt` |
| `/manifest.json` | PWA manifest | Install metadata | | | Icons | | `src/app/manifest.ts` (L) | Preserved | P3 | `curl -s .../manifest.webmanifest` |
| `https://files.hadramout.center/media/...` | Asset host | Images and PDFs | Cloudflare cache 30 days | 4,472 distinct images referenced by migrated content (jpg 4,147, jpeg 184, png 141) plus 63 distinct PDFs | | | Images: `/legacy-media/...` (lazy cache with fallback fetch, `src/app/legacy-media/[...path]/route.ts`). PDFs: **unchanged links to the legacy host** | Images: Requires migration (cache coverage unproven, LEG-005). PDFs: Requires migration (LEG-001) | P0 | see section 12 tasks T1 and T2 |

## 5. Concrete legacy samples fetched (reproducible)

| Type | URLs (all HTTP 200) | Why chosen |
|---|---|---|
| News | `/news/226` (lowest id; date 05 Nov 2023; 9 images; plain-text YouTube link), `/news/313` (dated 16 Oct 2016; 47 distinct images; 155 KB HTML), `/news/995` (oldest by date, 21 Dec 2015, "إشهار مركز حضرموت…"), `/news/10198` (06 Aug 2026), `/news/10337` (newest, 04 Oct 2026) | Oldest and newest by id and by date; image-heavy page |
| Articles | `/articles/1953` (issue 1), `/articles/4000` (issue 17, has a cover image), `/articles/9597` (issue 37, category "دراسات"), `/articles/2317` (longest body, 82,785 characters) | Oldest id, newest id, longest |
| Books | All 52 fetched. With PDF: `/books/246`, `/books/247`, `/books/391`, `/books/415`. Without: `/books/9308`, `/books/9882`, `/books/9990` | PDF presence matrix |
| Magazines | All 40 fetched. `/magazines/76` (issue 1), `/magazines/266` (issues 24-25), `/magazines/85` (PDF under `/2017/06/`), `/magazines/10304` (issue 41) | Includes the combined issue |
| Events | 20 of 53: `/events/1391`, `/events/2125`, `/events/5011`, `/events/6764`, `/events/8229` (Zoom credentials), `/events/8456`, `/events/8458` | Spread across the id range |
| Videos | `/videos/9934`, `/videos/10158` | Both |
| Forum | All 11 fetched, e.g. `/forum/5891`, `/forum/5893`, `/forum/7811`, `/forum/7821` | Zoom credentials on 6 pages |
| Broken | `/news/1472`, `/news/1538`, `/news/1640`, `/news/10300`, `/articles/2544`, `/articles/3350`, `/articles/4262` | Section 9 |

Production redirect probes that returned `301` to a canonical `/ar/...` target (legacy id then Payload id): `/news/10337` 387, `/news/226` 1, `/articles/9597` 909, `/articles/1953` 1, `/books/246` 1, `/books/9990` 52, `/magazines/10304` 40, `/magazines/76` 1, `/forum/7821` 11, `/forum/5891` 1, `/videos/9934` 1, `/videos/10158` 2, `/events/8458` 53, `/events/1391` 1. A legacy id that was not migrated (`/news/5000`) returns `302` to `/ar/news`.

## 6. Feature inventory

| Feature | Legacy (verified) | New platform | Status | Notes |
|---|---|---|---|---|
| Browse by type | 7 sections, numbered pager | 7 sections plus authors, timeline, topics (L), saved | Improved | Page sizes changed (21 to 12 for news). Legacy deep links `?page=N` therefore point at different items; acceptable but see LEG-012 |
| Site search | None | `/ar/search` (accent- and hamza-insensitive per the page copy; 188 hits for "باعيسى" on P), `/api/hc/suggest` | Improved | `Disallow: /*/search` in robots is correct |
| Filters and sort | None | Year, sort on P; topic, author, pdf, when on L | Improved | `pdf` facet not live on P |
| Languages | Arabic only | `ar`, `en` hreflang; `/de/news` also answers 200 on P (auto-translation engine) | Improved | Language coverage is the translation audit's topic |
| Downloads | Book PDF link, issue PDF link, forum brochure | Same PDFs, "read" and "download" buttons | Preserved (brochure Missing) | LEG-001, LEG-004 |
| Video | YouTube iframe: video 9934 and all 11 forum pages play; video 10158 has no player | `youtube-nocookie` facade; `youtube_id` set on 12 of the 13 forum and video records | Preserved | Video 2 has no source (LEG-009) |
| Share | Web Share button on news only | Share menu (WhatsApp, Telegram, X, Facebook, copy link) on detail pages, print button | Improved | |
| Citation tools | None | APA, MLA, Chicago, Harvard, BibTeX, RIS, CSL-JSON; Google Scholar meta | Improved | Wrong years for older issues (LEG-002) |
| Calendar | None | `.ics` download for events (`/api/hc/ics/...`) | Improved | |
| RSS | None | `/feeds/{lang}/all.xml` and per type (P returns `application/rss+xml`) | Improved | |
| Newsletter | None | `/api/hc/subscribe` stores emails; footer block exists in L source only (absent in P HTML) | New, incomplete | No mail sender, no unsubscribe route, 0 subscribers in DB (LEG-014) |
| Contact | `mailto:` plus WhatsApp | Form stored in `messages` (0 rows), honeypot, rate limit (5 per hour per client) | Improved | No notification email (LEG-014) |
| Reader reviews | None | `/api/hc/reviews` (L source) | New | Out of parity scope |
| Social links | X, Facebook, Instagram, Telegram, YouTube (5) | Same 5 plus 2 WhatsApp links on P | Preserved | URLs identical (verified on `/ar`) |
| Analytics | None found | Cloudflare Insights allowed by CSP | Different | Privacy page text must match |
| Accessibility statement, privacy, terms | None | `/ar/accessibility`, `/ar/privacy`, `/ar/terms` | New | |
| Admin | WordPress behind the scenes (inferred) | Payload CMS `/admin` | Replaced | Editors need training; see `../06-handover/admin-guide-ar.md` |
| Error handling | Soft 404 (200) | True 404 plus noindex | Improved | |

## 7. External hosts and dependencies (legacy)

| Host | Used for | Observed |
|---|---|---|
| `files.hadramout.center` | All images and 61+ PDFs | Alive; 200 on the 3 files probed (issue 41 PDF 59,202,598 bytes; `الطب-الشعبي-بحضرموت.pdf` 6,602,666 bytes; an image 1,229,101 bytes); root path 404; `Server: cloudflare` |
| `s3.me-south-1.amazonaws.com/assets.hadramout.center/...` | Forum brochure | Connection timed out twice (NOT VERIFIED) |
| `assets.hadramout.center` | Appears only as a bucket path segment | DNS does not resolve |
| `www.youtube.com` | Embeds and channel link | Used by 11 of 11 forum events, video 9934 |
| `us06web.zoom.us`, `static.xx.fbcdn.net` | Zoom links and Facebook plugin on forum pages (6 of 11) | Zoom meeting id and passcode printed in clear text (also on event 8229) |
| `wa.me`, `x.com`, `facebook.com`, `instagram.com`, `t.me` | Footer social | Preserved on new site |
| `mailto:info@hadramout.center` | Contact | New site wraps it in Cloudflare email obfuscation (`/cdn-cgi/l/email-protection`) so it needs JavaScript to read |

## 8. Migration reconciliation (legacy vs local DB and production)

Method: set difference between the legacy ids I crawled and `legacy_id` in the database copy (`data/payload.db`, 25,092,096 bytes, modified 2026-10-16). Production counts equal the DB counts (sitemap and `نتيجة` totals), so the DB copy is representative for these tables; production's own database could not be read directly.

| Collection | Legacy | DB | Missing legacy ids |
|---|---:|---:|---|
| news | 391 | 387 | 1472, 1538, 1640, 10300 |
| articles | 912 | 909 | 2544, 3350, 4262 |
| books, magazines, events, forum, videos | 158 | 158 | none |

Other reconciled facts (all from the DB copy unless noted):

* Referenced media: 4,535 distinct `files.hadramout.center/media/` URLs (4,472 images, 63 PDFs). PDFs in structured fields: 21 books and 40 issues. 2 more PDF URLs appear elsewhere in content (not individually traced).
* Authors 274, categories 53, timeline entries 6, pages 4 (about, privacy, terms, accessibility). `subscribers` 0, `messages` 0.
* Titles: 0 non-Arabic titles imported, 0 HTML-entity leftovers; 1 article and 4 book titles contain invisible bidi control characters (article 572, books 1 to 3 and one more).
* Date precision: news 387 `day`; events 53 `day`; articles 894 `month` plus 15 `estimated`; books 48 `year` plus 4 `estimated`; magazines 40 `month`; forum 5 `day` plus 6 `estimated`; videos 2 `estimated`. Dates marked `estimated` are not displayed (`src/lib/ctx.ts:54`).

## 9. The 7 legacy items that were not migrated

| Legacy id | Listing page | What the legacy detail page returns | What the listing card shows |
|---|---|---|---|
| `/news/1472` | 16 | HTTP 200, 23,327 bytes, no title, no body (header and footer only), no noindex | Date 31 Dec 2018, title about the third scientific conference "التاريخ والمؤرخون الحضارمة في الحادي عشر والثاني عشر الهجريين" |
| `/news/1538` | 16 | Same empty page | 07 Sep 2019, "جلسة نقاش عن الساحل والبحر" |
| `/news/1640` | 15 | Same | 17 Dec 2020, "لقاء رئيسي مركز ابن عبيدالله ومركز حضرموت" |
| `/news/10300` | 4 | Same | 24 Nov 2025, **title and image alt are Hungarian spam text** ("Hány nap alatt érkezik meg a kifizetés a banki rendszerben"), no thumbnail |
| `/articles/2544` | 34 | HTTP 200, 24,468 bytes, empty | "إطلالة تاريخية من خلال كتاب الدلائل والحجج على منتصف القرن الخامس الهجري" |
| `/articles/3350` | 27 | Same | "قبيلة قضاعة اليمنية" |
| `/articles/4262` | 20 | Same | "الشيخِ أحمد مُحمَّد باجنيد .. صاحب القيم التي لا تموت ..." |

These are real catalogue entries whose bodies cannot be extracted from the legacy front end (the page responds with the shell only). Six appear to be genuine entries whose bodies are unreachable (inferred from their ordinary titles and dates); `news/10300` is spam and was correctly excluded. Their legacy URLs currently receive a temporary `302` to the section listing on the new site.

## 10. Data-accuracy observations that affect parity

1. **Dates derived from upload month.** `src/importer/legacy.ts:396` sets an issue's `publishedAt` from the cover/PDF upload month (`uploadMonth`), and `src/importer/crawl.ts:189` copies it to every article of that issue. The legacy site shows no date on issues or articles. In the DB, 29 of 40 issues (legacy ids 76 to 271) are dated October to December 2023 because the files were bulk-uploaded then, and 713 articles inherit 2023-10 (567), 2023-11 (78) or 2023-12 (68). On production, `/ar/articles/1` (from issue 1) displays "أكتوبر 2023", emits `citation_publication_date` 2023 and a citation "(2023)". Issue 4's own PDF sits under `/media/2017/06/`, proving the upload month is not the publication date.
2. **Duplicate issue wording in citations.** Production citation for article 1 reads "مجلة حضرموت الثقافية العدد 1، العدد 1".
3. **Legacy HTML quality** (not carried over): double-escaped entities in `<title>` (`&amp;#8211;`), 52/52 books, 40/40 issues and 11/11 forum pages with the generic title.

## 11. Findings (parity gaps)

Full structured text for each finding is in the audit return payload; this table is the readable index.

| ID | Severity | Title | Status of proposed fix |
|---|---|---|---|
| LEG-001 | high | All 63 referenced PDFs stay hot-linked to `files.hadramout.center` | BACKLOG (T1) |
| LEG-002 | high | Issue and article dates are the legacy upload month, not publication dates; they feed citations and JSON-LD | BACKLOG (T3) |
| LEG-003 | medium | 7 legacy-listed items (4 news, 3 articles) are not on the new site | BACKLOG (T4) |
| LEG-004 | medium | Forum brochure PDF (S3) is missing from `/forum` | BACKLOG (T5) |
| LEG-005 | medium | Image cache coverage unproven; `/legacy-media` still depends on the legacy host for uncached files | BACKLOG (T2) |
| LEG-006 | medium | Production is behind local `master`; several "Improved" rows exist only in source | BACKLOG (T6) |
| LEG-007 | medium | Staging `robots.txt` names `hadramout.center`; redirect, canonical and citation hosts depend on `SITE_URL` at cutover | BACKLOG (T7) |
| LEG-008 | low | New `/about` text contains claims absent from the legacy source ("دراسات محكَّمة", translation definition) | BACKLOG (T8) |
| LEG-009 | low | Video 2 has no playable source (legacy also broken) | BACKLOG (T9) |
| LEG-010 | medium | Legacy site shows a spam news item (`/news/10300`), indicating a possible content-system compromise | BACKLOG (T10) |
| LEG-011 | medium | Legacy-id redirect map verified on 16 samples only; no full automated check; legacy sitemap cannot reveal indexed URLs | BACKLOG (T11) |
| LEG-012 | low | Page-size change and redirect chains alter legacy deep links (`/news/` takes 2 hops) | BACKLOG (T12) |
| LEG-013 | low | Invisible bidi characters in 5 titles and 5 PDF filenames; duplicated "العدد 1، العدد 1" in citations | BACKLOG (T13) |
| LEG-014 | low | New contact and newsletter features have no delivery path (no mail sender, no unsubscribe route) | BACKLOG (T14) |
| LEG-015 | info | Zoom meeting ids and passcodes on 7 legacy pages were correctly stripped | VERIFIED |

## 12. Remediation tasks

| Task | Finding | Description | Status | Acceptance criteria | Verification method | Priority |
|---|---|---|---|---|---|---|
| T1 | LEG-001 | Download the 63 PDFs (from `books.pdf`, `magazines.pdf` and the two PDFs found in body text) to storage the Center controls (for example `MEDIA_DIR` served by nginx, or a bucket under the Center's account), verify checksums, rewrite the `pdf` fields, keep `files.hadramout.center` only as a redirect-safe fallback. | BACKLOG | (a) `grep -r files.hadramout.center` in all `pdf` columns returns 0 rows; (b) all 61 book and issue PDFs return `200 application/pdf` from the new host with matching `Content-Length`; (c) the 59 MB issue 41 file streams with HTTP range support. | Script: for each row `curl -sI` old and new URL, compare `Content-Length`; spot-open 5 in a browser. | P0 |
| T2 | LEG-005 | Run `npm run import:images` on the production data volume; report cached count against the 4,472 referenced images. | BACKLOG | `find $DATA_DIR/legacy-media -type f` equals 4,472 (or a documented list of failures) and a sample of 50 random `/legacy-media/...` URLs return 200 with the legacy host blocked (hosts file entry). | Count files; run the 50-URL check from the VPS. | P0 |
| T3 | LEG-002 | Stop treating the upload month as a publication date. Either set `datePrecision='estimated'` (hidden) for issues 1 to 29 and their articles, or enter real issue dates from the printed issues (the Center supplies them). Remove `datePublished` and `citation_publication_date` when the date is estimated. | BACKLOG | `/ar/articles/1` shows no "أكتوبر 2023"; its citation has no year or the client-confirmed year; `articles` rows with `date_precision='month'` and `published_at` in 2023-10..12 equal 0 unless confirmed. | SQL count; `curl -s .../ar/articles/1 \| grep -c citation_publication_date` equals 0 for unconfirmed dates. | P1 |
| T4 | LEG-003 | Ask the Center for the 7 source texts (or accept stubs created from the listing title and date for the 6 genuine items); exclude `news/10300`. Map the 7 legacy ids to either the new records or a deliberate `410`/redirect. | BACKLOG | Written client decision per id; legacy URLs of the 7 resolve to the chosen outcome (not an accidental 302). | Request each of the 7 legacy ids against staging. | P2 |
| T5 | LEG-004 | Obtain the forum brochure PDF from the Center, store it with T1, link it from `/forum` (static page field or a Pages entry). | BACKLOG | `/ar/forum` contains one working `.pdf` link that returns `200 application/pdf`. | `curl -s .../ar/forum \| grep -o 'href="[^"]*\.pdf"'` then `curl -sI`. | P1 |
| T6 | LEG-006 | Deploy current `master` (after review) so that production and source agree; re-run this audit's probes. | BACKLOG | `/ar/topics` returns 200; `/ar/books?pdf=1` returns 21; footer newsletter present only if T14 is done; `/ar/magazines/36` links its articles. | Re-run the probes in section 4's Verification column. | P1 |
| T7 | LEG-007 | At cutover set `SITE_URL` to the final host; rebuild so `robots.txt`, redirects, canonicals, sitemap and citation URLs share one origin. Remove `Host:` or keep it consistent. | BACKLOG | On the live host `robots.txt` Sitemap, `/sitemap.xml` `<loc>`, canonical and legacy-redirect `Location` all start with the same origin. | `scripts/seo-audit.mjs <url>` and `curl -sI` of 5 legacy URLs. | P0 |
| T8 | LEG-008 | Have the Center approve or edit the `/about` text; remove "محكَّمة" and the translation definition unless confirmed. | BACKLOG | Written approval recorded in `../03-tracking/TRACKER.md`. | Document review. | P1 |
| T9 | LEG-009 | Ask the Center for the real source of video 10158 (likely a non-YouTube URL). Add it as an external link or an embed. | BACKLOG | `/ar/videos/2` offers a working way to watch, or the page states the recording is unavailable. | Manual open. | P3 |
| T10 | LEG-010 | Tell the Center that their live site publishes a spam item and that the CMS or its credentials may be compromised; recommend credential rotation before the legacy host is retired. | BACKLOG | Written notice sent; item removed from legacy or the legacy site retired. | `curl -s https://hadramout.center/news?page=4 \| grep -c 'Hány nap'` equals 0. | P2 |
| T11 | LEG-011 | Write a script that requests `/{section}/{legacyId}` on staging for all 1,461 ids (polite delay) and asserts 301 with a resolvable target for 1,454 and a documented outcome for 7. Export indexed URLs from Search Console to confirm none are missed. | BACKLOG | Report with 1,461 rows; 0 unexpected statuses; every 301 target returns 200. | Run against staging, store the CSV under `docs/migration/`. | P0 |
| T12 | LEG-012 | Redirect trailing-slash legacy URLs in one hop; decide whether to keep `?page=N` semantics (document the change). | BACKLOG | `/news/` returns one 308 to `/ar/news`. | `curl -sI`. | P3 |
| T13 | LEG-013 | Strip U+200E, U+200F and U+2066 to U+2069 from titles at import (keep them out of file names when mirroring); fix duplicated issue label in citations. | BACKLOG | 0 titles match the bidi regex; citation for article 1 contains the issue label once. | SQL regex count; view citation. | P3 |
| T14 | LEG-014 | Decide whether newsletter and contact notification stay in scope; if yes add a sender, a double opt-in and an unsubscribe route; if not, hide the footer block. | BACKLOG | Submitting the contact form sends or queues an email to the Center; unsubscribe link works; or newsletter UI removed. | Staging test with a mailbox. | P2 |

## 13. Limitations and what could not be inspected

* **Legacy content breadth.** I fetched all 52 books, 40 issues, 11 forum events and both videos, 20 of 53 events, 5 healthy news items plus the 4 broken ones (and one non-existent id for the 404 test), and 4 healthy articles plus the 3 broken ones. The other news, article and event bodies were not fetched (request cap). Their PDF and media hosts are therefore inferred from the local DB, not observed on the legacy site. There may be PDFs or external links inside unfetched articles and news; I looked for them in the DB, which found 2 additional PDF URLs that I did not trace to a legacy page.
* **Rendering.** All fetches were plain HTTP. No JavaScript was executed. The legacy streams content inside `<div hidden id="S:n">` and the text I read is that server-rendered HTML. Client-only behaviour (for example the pager's "المزيد من الصفحات" widget) was not exercised.
* **Production database.** Not accessible. Counts rely on the production sitemap and listing totals, and on the local DB copy dated 2026-10-16. Production's `legacy-media` cache population is NOT VERIFIED.
* **Forum brochure on S3.** NOT VERIFIED: `s3.me-south-1.amazonaws.com` did not answer within 20 s on two attempts from the audit machine (could be local network filtering).
* **Video 10158 source.** NOT VERIFIED: the URL is not present in the HTML; the page prints "رابط الفيديو غير صالح لعرض يوتيوب".
* **Which legacy URLs Google has indexed.** NOT VERIFIED (no Search Console access). The legacy sitemap lists only 8 URLs, so redirect completeness cannot be derived from it.
* **Legacy admin and CMS.** Not inspected (read-only crawl; no auth testing). The WordPress origin is inferred from id patterns and `media/YYYY/MM` paths.
* **Unlinked or hidden legacy routes.** Not enumerated (no fuzzing). `/[page]` exists as a catch-all; there may be other CMS pages.
* **Email delivery, form submission, translation output, accessibility, performance and security headers** were not tested here; they belong to other audit areas.
* **Request budget.** The cap of about 400 requests was respected (estimate: about 380). No 429 or 403 was received from either host.

## 14. Corrections to earlier documents

| Earlier statement | Where | Correction |
|---|---|---|
| "`/about` returns 404" | `../01-audit/02-legacy-site-analysis.md` section 1 and 2 | It returns **HTTP 200** with a "not found" body (soft 404). `/contact` and `/magazine` do the same. |
| PDFs on `files.hadramout.center` **and** `assets.hadramout.center` | same, section 1 | `assets.hadramout.center` does not resolve; the only second host is an S3 URL used once (forum brochure). All 61 book and issue PDFs are on `files.hadramout.center`. |
| "40 issues in the list while the last issue is 41, check the gap" | same, section 2 note | Not a gap: issues 24 and 25 are one item (`/magazines/266`). |
| "Legacy has no search, languages, citation, author ordering" | same | Confirmed. |
| Counts 391 / 912 / 52 / 53 / 40 / 2 / 11 | same and `legacy-site-counts.json` | Confirmed independently on 2026-10-18. |
