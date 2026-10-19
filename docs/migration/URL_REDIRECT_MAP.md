# URL Redirect Map (legacy hadramout.center to the new platform)

| | |
|---|---|
| **Purpose** | Define every rule that maps an old URL of `https://hadramout.center` (and its file hosts) to its new location, list the edge cases and their current behaviour, and record a sampled test matrix with results from production. |
| **Scope** | Item pages, section listings, `/about`, `/contact`, root, media and PDF hosts, sitemap and manifest. Implementation: `src/proxy.ts`, `src/app/legacy/[section]/[id]/route.ts`, `src/lib/content-types.ts`, `src/app/legacy-media/[...path]/route.ts`. Out of scope: redirects inside the new site between languages, hreflang and canonical design (see the SEO documents). |
| **Status** | Rules documented from code and confirmed by 61 live test cases. The full-id sweep (1,454 items) is NOT VERIFIED; the script is in [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) step 3. All tasks `BACKLOG`. |
| **Last updated** | 2026-10-18 |
| **Sources / evidence** | Code at `master`; live requests on 2026-10-18 to `https://hadramout-center.novixa.dev` (121 requests for the matrix, `redirect: manual`, 330 ms apart) and `https://hadramout.center` (listing crawl for the id list, 87 requests); DB copy of `data/payload.db` (2026-10-16). |
| **Related** | [CONTENT_MIGRATION_PLAN.md](CONTENT_MIGRATION_PLAN.md) · [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md) · [../03-tracking/TRACKER.md](../03-tracking/TRACKER.md) |

**What was observed where.** All results below are from **production** (`hadramout-center.novixa.dev`), which is behind the local `master` source (see [CONTENT_MIGRATION_PLAN.md](CONTENT_MIGRATION_PLAN.md) section 0). The redirect code paths named here exist in the local source; production behaviour matched them in every test, so the redirect layer itself appears to be identical on both sides. Public ids matched the local DB copy in 37 of 37 cases.

## 1. Legacy URL inventory (what must be mapped)

Legacy URLs have no language prefix and no slug; ids are decimal numbers from one shared WordPress-style id space (a given number belongs to one section only; inferred from the 1,461 unique ids found).

| Legacy URL kind | Example | Count | Mapped by |
|---|---|---:|---|
| Item page | `/news/10337`, `/articles/9597`, `/books/9990`, `/magazines/10304`, `/events/8458`, `/forum/7821`, `/videos/9934` | 1,461 (1,454 migrated + 7 empty) | Rule R1 |
| Section listing | `/news`, `/news?page=2` (legacy pagination uses `?page=N`) | 7 sections | Rule R2 |
| About / contact | `/about` (legacy: soft 404), `/contact` (legacy: soft 404) | 2 | Rule R2 / R3 |
| Root | `/` | 1 | Rule R3 |
| Legacy `sitemap.xml` entries | `/`, `/books`, `/magazine`, `/events`, `/articles`, `/news`, `/about`, `/contact` (8 URLs, per [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md)) | 8 | R2/R3; `/magazine` has no rule (E14) |
| Images | `https://files.hadramout.center/media/YYYY/MM/<file>` | 4,472 referenced | Rewritten at render to `/legacy-media/YYYY/MM/<file>` (Rule R5); external links to the old host stay on the old host |
| PDFs | `https://files.hadramout.center/media/YYYY/MM/<file>.pdf` | 63 referenced | NOT mapped: pages link to the old host (MIG-001) |
| Forum brochure | `https://s3.me-south-1.amazonaws.com/assets.hadramout.center/uploads/2024/05/<file>.pdf` | 1 | NOT migrated (MIG-011) |
| Next image proxy | `https://hadramout.center/_next/image?url=...` | unknown | No rule. NOT VERIFIED whether any external site links to it |

## 2. Rules (pattern to target)

Rules are evaluated in `src/proxy.ts` (called "middleware" before Next.js 16) in this order. `lang` below means: the `hc_lang` cookie for R2/R3 together with `Accept-Language` negotiation (`negotiate`), but **only the cookie (default `ar`) for R1** (`route.ts:13`).

| Rule | Pattern (method GET/HEAD) | Target | Status | Code |
|---|---|---|---|---|
| R0 skip | path starts with `admin`, `api`, `_next`, `brand`, `icons`, `fonts`, `og`, `feeds`, `sitemap`, `robots`, `manifest`, `sw.js`, `healthz`, `legacy`, `favicon`, `media`, or ends with a 2 to 5 character file extension | unchanged | n/a | `proxy.ts:10,16` |
| R0b prefixed | first segment is an enabled language code (`/ar/...`, `/en/...`) | unchanged (`x-pathname` header added) | n/a | `proxy.ts:18-23` |
| R1 item | `^/(news\|articles\|books\|magazines\|events\|forum\|videos)/(\d+)/?$` | internal rewrite to `/legacy/{section}/{id}`, then lookup `legacyId = {id}` in the section's collection: found, `301 /{lang}/{route}/{newId}`; not found, `302 /{lang}/{route}` | 301 / 302 | `proxy.ts:11,25-26`; `legacy/[section]/[id]/route.ts:16-19` |
| R2 listing | `^/(news\|articles\|books\|magazines\|events\|forum\|videos\|about)/?$` | `/{lang}/{path-without-trailing-slash}{?query kept}` | 308 | `proxy.ts:12,27-29` |
| R3 other | any other path without a language prefix, including `/` and `/contact` | `/{lang}{path}{?query kept}` (the `/{lang}` page decides 200 or 404) | 307 | `proxy.ts:32-33` |
| R4 direct handler | `/legacy/{section}/{id}` requested directly | same lookup as R1 | 301 / 302 | `route.ts` |
| R5 media | body/cover URLs `https://files.hadramout.center/media/...` | `/legacy-media/...` (rewritten when the page is rendered, not a redirect); direct requests to `/legacy-media/{path}` serve the cached file or fetch it once from the old host | 200 / 404 / 502 | `src/lib/legacy-media.ts:15-17`; `legacy-media/[...path]/route.ts` |

Mapping of section to collection and route (`src/lib/content-types.ts`): `news`→`news`/`news`, `articles`→`articles`/`articles`, `books`→`books`/`books`, `magazines`→`magazines`/`magazines`, `events`→`events`/`events`, `forum`→`forum-events`/`forum`, `videos`→`videos`/`videos`. Legacy and new section names are identical, so only the id changes.

**The id mapping is a database lookup, not a formula.** In the current data, `newId` happens to equal the position of the legacy id within its type after sorting ascending (news 226 is 1, news 10337 is 387, articles 9597 is 909, magazines 5682 is 30), because the snapshot is sorted by `(type, id)` and inserted once. Do not rely on that: after any re-import it may change (MIG-012). To export the map (for a static fallback such as nginx or Cloudflare bulk redirects):

```sql
-- run against a COPY of the database
SELECT 'news' AS section, legacy_id, id FROM news
UNION ALL SELECT 'articles', legacy_id, id FROM articles
UNION ALL SELECT 'books', legacy_id, id FROM books
UNION ALL SELECT 'magazines', legacy_id, id FROM magazines
UNION ALL SELECT 'events', legacy_id, id FROM events
UNION ALL SELECT 'forum', legacy_id, id FROM forum_events
UNION ALL SELECT 'videos', legacy_id, id FROM videos
ORDER BY 1, 2;   -- expected 1,454 rows
```

## 3. Response details observed (production)

| Item | Observation |
|---|---|
| `Location` header | Absolute: `https://hadramout-center.novixa.dev/ar/news/387` (built from `SITE_URL`, `route.ts:12`) |
| Caching | R1 responses carry no `Cache-Control`; Cloudflare reports `cf-cache-status: DYNAMIC`. The target depends on the `hc_lang` cookie but the response has no `Vary: Cookie` (MIG-009). |
| `HEAD` | `HEAD /news/10337` returns 301 like `GET` |
| Language | `Accept-Language: en-US` on R1 still redirects to `/ar/...`; `Cookie: hc_lang=en` redirects to `/en/news/387`. Other unprefixed paths use full negotiation. |
| Target page | `200`, `<link rel="canonical">` equal to the final URL, `robots: index, follow, max-image-preview:large` |
| Legacy headers still sent | production still sends `accept-ch` and `critical-ch: Sec-CH-Prefers-Color-Scheme` on these responses although the local source removed them in commits `f9f2ea8`/`737f0f4` (confirms production is behind local) |

## 4. Edge cases and decisions

| Edge case | Current behaviour (production) | Assessment | Recommended rule | Task |
|---|---|---|---|---|
| Trailing slash `/news/10337/` | `308` to `/news/10337`, then `301` to `/ar/news/387`: **2 hops** (E1) | Works; legacy itself 308-redirects the slash form, so it is rare. The first hop is most likely Next.js built-in slash normalisation running before the proxy (inferred; the proxy regex already accepts a trailing slash). | Set `skipTrailingSlashRedirect: true` in `next.config.ts` and let the proxy answer R1 directly | T-RED-01 |
| Query string on an item URL (`?utm_source=x&page=2`) | Dropped, `301 /ar/news/387` (E2) | Acceptable: item pages have no meaningful parameters. Tracking parameters are lost. | Keep dropping; document | none |
| Query string on a listing (`/news?page=2`) | `308 /ar/news?page=2` kept (E10) | Parameter kept, but legacy page size (news 21, articles 21, books 12, events 10, magazines 12) differs from the new site, so page 2 holds different items | Acceptable; or drop `page` and send to page 1 | T-RED-03 |
| Uppercase section `/News/10337` | `307 /ar/News/10337` then `404` (E3) | Legacy Next.js routes are case-sensitive and would also fail; low value | Optional: lowercase before matching | T-RED-01 |
| Non-numeric id `/news/abc` | `307 /ar/news/abc`, `404` (E4) | Correct final answer, but a redirect then a 404 | Return 404 directly for `/{section}/{non-numeric}` | T-RED-01 |
| Unknown or unmigrated numeric id `/news/5000`, `/news/0`, the 7 empty ids | `302` to the section listing, `200` (E5, E6, U1 to U7) | Soft 404 for search engines; the legacy site also answers 200 for unknown ids, so there is no regression, but no signal that the page is gone | `410 Gone` (or a `noindex` stub) for the 7 known ids; `404` for ids never seen; keep the listing link in the body | T-RED-02 |
| Leading zeros `/news/010337` | `301 /ar/news/387` (E7) | Creates an alias URL; harmless | Accept | none |
| Extra segment `/news/10337/extra` | `307` then `404` (E8) | Correct | none | none |
| `/magazine` (singular, listed in the legacy sitemap) | `307 /ar/magazine`, `404` (E14) | Legacy answered it with a soft 404 as well, so nothing indexed is lost | Optional: `308 /{lang}/magazines` | T-RED-03 |
| `/about` | `308 /ar/about`, `200` (E12) | Legacy `/about` is a soft 404, so this is a gain. The page content is awaiting Center confirmation (TRACKER item 2). | none | none |
| `/contact` | `307 /ar/contact`, `200` (E13) | Fine; 307 (temporary) for a permanent move | Add `/contact` to `LEGACY_LIST` so it gets 308 | T-RED-03 |
| Root `/` | `307 /ar` (E15) | Intended: language negotiation is temporary | none | none |
| Language of the target | R1 ignores `Accept-Language` | Intentional for an Arabic-first archive; English visitors from old links land on Arabic | Accept; or negotiate like R2 | T-RED-03 |
| `www.hadramout.center` | Legacy: TLS certificate mismatch ([../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md) section 1). New site: not configured (nginx `server_name` lists only the novixa.dev host, `deploy/nginx/hadramout-center.conf`). | Must be solved at cutover | vhost + certificate for apex and `www`, `www` to apex 301 | T-MIG-08 |
| `http://` | Production nginx redirects 80 to 443 (`deploy/nginx/hadramout-center.conf` lines 13-17) | OK | none | none |
| Files hosts | `files.hadramout.center` keeps serving until someone stops it. After cutover the DNS owner decides whether it survives. | Unknown | See MIG-001; decide before DNS change | T-MIG-01 |

## 5. Test matrix and results

Method: `fetch(url, { redirect: 'manual' })`, follow `Location` up to 6 hops, 330 ms between requests, 2026-10-18. "Statuses" lists every hop. Sample selection: for each type the first and last legacy id plus ids spread evenly (news 7, articles 9, books 5, magazines 5, events 5, forum 4, videos 2) taken from my own listing crawl. Title column is the `<h1>` of the final page (first 40 characters); all 37 matched the database title exactly after removing bidi control characters.

### 5.1 Migrated items (37 cases: 37 pass, 0 chains over 1 hop, 0 errors)

| # | Legacy URL | Statuses | Final URL | Final status | Title (first 40 chars) |
|---|---|---|---|---|---|
| 1 | `/news/226` | 301 > 200 | `/ar/news/1` | 200 | المحافظ بن ماضي يزور مركز حضرموت للدراسا |
| 2 | `/news/10337` | 301 > 200 | `/ar/news/387` | 200 | منسق مشاريع «اليونسكو» بحضرموت أ. عبد ال |
| 3 | `/news/1490` | 301 > 200 | `/ar/news/65` | 200 | إدارة مركز حضرموت للدراسات التاريخية وال |
| 4 | `/news/1914` | 301 > 200 | `/ar/news/130` | 200 | مركز حضرموت يبدأ التجهيزات للمؤتمر العلم |
| 5 | `/news/8562` | 301 > 200 | `/ar/news/194` | 200 | كرسي الملك سلمان يهدي مركز حضرموت للدراس |
| 6 | `/news/8978` | 301 > 200 | `/ar/news/258` | 200 | منتدى عميد الوفاء الثقافي ينفذ فعالية بع |
| 7 | `/news/9795` | 301 > 200 | `/ar/news/323` | 200 | دعوة للمشاركة .. المؤتمر العلمي السابع . |
| 8 | `/articles/1953` | 301 > 200 | `/ar/articles/1` | 200 | أدباء حضرموت وبديعية جابر رزق |
| 9 | `/articles/9597` | 301 > 200 | `/ar/articles/909` | 200 | موانئ حضرموت (من القرن الثالث قبل الميلا |
| 10 | `/articles/2650` | 301 > 200 | `/ar/articles/115` | 200 | مقطع من رواية ( ليل ) .. ظلال صباحية داك |
| 11 | `/articles/3297` | 301 > 200 | `/ar/articles/228` | 200 | الريادة في التصوف بحضرموت بين الشيخ سعد  |
| 12 | `/articles/3867` | 301 > 200 | `/ar/articles/342` | 200 | بُلْدَانُ وأمَاكِنُ رَيْدَةِ الدَّيِّنِ  |
| 13 | `/articles/4603` | 301 > 200 | `/ar/articles/455` | 200 | خور المكلا – 1 .. شقيق النيل |
| 14 | `/articles/5378` | 301 > 200 | `/ar/articles/569` | 200 | السيف النقاد .. شاعر مجهول .. أفلتت المق |
| 15 | `/articles/6163` | 301 > 200 | `/ar/articles/682` | 200 | حكايات من المشقاص .. مصرع الشاعر بن علي  |
| 16 | `/articles/7333` | 301 > 200 | `/ar/articles/796` | 200 | تحدث حتى يراك العالم |
| 17 | `/books/246` | 301 > 200 | `/ar/books/1` | 200 | المؤتمر العلمي الرابع التاريخ والمؤرخون  |
| 18 | `/books/9990` | 301 > 200 | `/ar/books/52` | 200 | الشَّامِل في تاريخ حضر موت و مخاليفها –  |
| 19 | `/books/259` | 301 > 200 | `/ar/books/14` | 200 | المؤتمر العلمي الثاني التاريخ والمؤرخون  |
| 20 | `/books/9129` | 301 > 200 | `/ar/books/27` | 200 | ألفاظ رمضانية وعيدية حضرمية فصيحة |
| 21 | `/books/9948` | 301 > 200 | `/ar/books/39` | 200 | روزنامات الربان بامعيبد (معارف الربابنة  |
| 22 | `/magazines/76` | 301 > 200 | `/ar/magazines/1` | 200 | مجلة حضرموت الثقافية العدد 1 |
| 23 | `/magazines/10304` | 301 > 200 | `/ar/magazines/40` | 200 | مجلة حضرموت الثقافية العدد 41 |
| 24 | `/magazines/111` | 301 > 200 | `/ar/magazines/11` | 200 | مجلة حضرموت الثقافية العدد 11 |
| 25 | `/magazines/132` | 301 > 200 | `/ar/magazines/21` | 200 | مجلة حضرموت الثقافية العدد 21 |
| 26 | `/magazines/5682` | 301 > 200 | `/ar/magazines/30` | 200 | مجلة حضرموت الثقافية العدد 31 |
| 27 | `/events/1391` | 301 > 200 | `/ar/events/1` | 200 | تقرير المؤتمر العلمي الخامس (التاريخ وال |
| 28 | `/events/8458` | 301 > 200 | `/ar/events/53` | 200 | فعالية بعنوان (المشروع الحضاري في أدب با |
| 29 | `/events/2383` | 301 > 200 | `/ar/events/14` | 200 | فعالية ثقافية: عرض لكتاب ليندا بوكسبيرج  |
| 30 | `/events/3635` | 301 > 200 | `/ar/events/27` | 200 | محاضرة: النجوم الشبامية والتقويم الهجري |
| 31 | `/events/5011` | 301 > 200 | `/ar/events/40` | 200 | المؤتمر العلمي الثالث التاريخ والمؤرخون  |
| 32 | `/forum/5891` | 301 > 200 | `/ar/forum/1` | 200 | خصائص الهوية الثقافية الحضرمية |
| 33 | `/forum/7821` | 301 > 200 | `/ar/forum/11` | 200 | فعالية بعنوان .. مقارنة لرؤية المؤرخ بام |
| 34 | `/forum/6035` | 301 > 200 | `/ar/forum/4` | 200 | محاولات للكشف عن مواقع الإنسان البدائي(ا |
| 35 | `/forum/7818` | 301 > 200 | `/ar/forum/8` | 200 | فعالية منتدى عميد الوفاء الثقافي عن بعنو |
| 36 | `/videos/9934` | 301 > 200 | `/ar/videos/1` | 200 | كاتب وكتاب / الحلقة 1 / الدكتور أحمد باح |
| 37 | `/videos/10158` | 301 > 200 | `/ar/videos/2` | 200 | حضرموت الامتداد الجغرافي وذاكرة المكان – |

### 5.2 Unmigrated ids (7 cases)

These ids exist on the legacy listings but their pages are empty shells there (see [CONTENT_MIGRATION_PLAN.md](CONTENT_MIGRATION_PLAN.md) section 3.3).

| # | Legacy URL | Statuses | Final URL | Final status |
|---|---|---|---|---|
| U1 | `/news/1472` | 302 > 200 | `/ar/news` | 200 |
| U2 | `/news/1538` | 302 > 200 | `/ar/news` | 200 |
| U3 | `/news/1640` | 302 > 200 | `/ar/news` | 200 |
| U4 | `/news/10300` | 302 > 200 | `/ar/news` | 200 |
| U5 | `/articles/2544` | 302 > 200 | `/ar/articles` | 200 |
| U6 | `/articles/3350` | 302 > 200 | `/ar/articles` | 200 |
| U7 | `/articles/4262` | 302 > 200 | `/ar/articles` | 200 |

### 5.3 Edge cases (17 cases)

| # | Case | Request | Statuses | Final URL | Final status |
|---|---|---|---|---|---|
| E1 | trailing slash | `/news/10337/` | 308 > 301 > 200 | `/ar/news/387` | 200 |
| E2 | query string | `/news/10337?utm_source=x&page=2` | 301 > 200 | `/ar/news/387` | 200 |
| E3 | uppercase section | `/News/10337` | 307 > 404 | `/ar/News/10337` | 404 |
| E4 | non-numeric id | `/news/abc` | 307 > 404 | `/ar/news/abc` | 404 |
| E5 | unknown id | `/news/5000` | 302 > 200 | `/ar/news` | 200 |
| E6 | id zero | `/news/0` | 302 > 200 | `/ar/news` | 200 |
| E7 | leading zero | `/news/010337` | 301 > 200 | `/ar/news/387` | 200 |
| E8 | extra segment | `/news/10337/extra` | 307 > 404 | `/ar/news/10337/extra` | 404 |
| E9 | list | `/news` | 308 > 200 | `/ar/news` | 200 |
| E10 | list page 2 | `/news?page=2` | 308 > 200 | `/ar/news?page=2` | 200 |
| E11 | list forum | `/forum` | 308 > 200 | `/ar/forum` | 200 |
| E12 | about | `/about` | 308 > 200 | `/ar/about` | 200 |
| E13 | contact | `/contact` | 307 > 200 | `/ar/contact` | 200 |
| E14 | magazine singular | `/magazine` | 307 > 404 | `/ar/magazine` | 404 |
| E15 | root | `/` | 307 > 200 | `/ar` | 200 |
| E16 | new canonical | `/ar/news/387` | 200 | `/ar/news/387` | 200 |
| E17 | new canonical en | `/en/news/387` | 200 | `/en/news/387` | 200 |


### 5.4 Summary of the matrix

| Group | Cases | Pass | Notes |
|---|---:|---:|---|
| Migrated items, one hop 301 then 200 | 37 | 37 | all 7 types; 0 chains over 1 hop; 0 404; 0 5xx |
| Unmigrated ids | 7 | 7 behave as coded | 302 to listing; no 404/410 (MIG-006) |
| Edge cases | 17 | 17 observed, none 5xx | E1 takes 2 hops; E3, E4, E8, E14 redirect and then 404; E5, E6 soft-redirect; see section 4 |
| 5xx seen anywhere | 0 | | across 121 requests |

Not covered by this matrix (NOT VERIFIED): the other 1,417 migrated ids; other languages as the starting point; behaviour behind the final production domain; Cloudflare caching of redirects after a deploy; redirects of `files.hadramout.center` URLs (those are not redirected by this site at all).

## 6. How to extend or re-run the matrix

1. Rebuild the legacy id list with the crawler in [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) step 1.2.
2. Run the sweep in step 3.2 (all ids, one request each, 300 ms apart, about 8 minutes for 1,461 ids). Expected output: 1,454 lines `301` with a `Location` matching `/ar/{section}/{n}`, 7 lines `302` (the known empty ids), and no other status.
3. Compare every `Location` id with the database export in section 2 above; any difference is a defect.

## 7. Tasks

| ID | Task | Status | Acceptance criteria | Verification |
|---|---|---|---|---|
| T-RED-01 | Make `/{section}/{id}/` a single-hop 301; return 404 directly for non-numeric ids; optionally lowercase the section | BACKLOG | E1 returns `301` straight to `/ar/news/387`; E4 returns `404` without a redirect | rerun cases E1, E3, E4 from section 5.3 |
| T-RED-02 | Give the 7 known empty ids a deliberate answer (`410 Gone`, or a `noindex` stub built from the listing-card metadata) and return `404` (not `302`) for ids that never existed | BACKLOG | U1 to U7 return the chosen status; E5 and E6 return 404 | rerun U1 to U7, E5, E6 |
| T-RED-03 | Polish: add `/contact` and `/magazine` to the 308 list; decide the language policy for R1; decide listing `?page=` handling | BACKLOG | E13 returns 308; E14 returns 308 to `/ar/magazines` | rerun E13, E14 |
| T-RED-04 | Add the exported id map (section 2 SQL) as a regression fixture and test the handler against it | BACKLOG | Unit test passes for 1,454 pairs and fails if one pair changes | `npm test` |
