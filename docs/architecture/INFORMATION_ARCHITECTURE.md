# Information Architecture (verified, as built)

| | |
|---|---|
| **Purpose** | Describe the site's real structure (routes, navigation, hubs, URL scheme, breadcrumbs, related content, facets, legacy URL mapping), measure it against the actual content, and list concrete IA gaps with testable fixes. |
| **Scope** | Source at `master` HEAD `d8ed733` (`src/app`, `src/components/{Shell,PageHead,Listing,Cards}.tsx`, `src/lib/{content-types,list-query,facets,facet-core,seo}.ts`, `src/proxy.ts`, `src/app/sitemap.xml/route.ts`), a read-only copy of `data/payload.db`, and GET-only probes of production and the legacy site. Visual design, copy, accessibility scoring and SEO scoring are other audit areas; where IA and SEO overlap (canonical, noindex, sitemap) only the structural facts are stated. |
| **Status** | Draft for review. Tasks in section 11 are `BACKLOG`. |
| **Last updated** | 2026-10-18 |
| **Finding prefix** | `DATA-` (shared with [`DATA_MODEL_AND_TAXONOMY.md`](./DATA_MODEL_AND_TAXONOMY.md); IA-relevant findings are repeated here with their IDs) |
| **Sources / evidence** | See tags below. Production observations were made on 2026-10-18 and describe the **previous release**, not HEAD. |

Related: [Data model and taxonomy](./DATA_MODEL_AND_TAXONOMY.md) · [System architecture](./SYSTEM_ARCHITECTURE.md) · [Legacy site inventory and parity matrix](../audit/LEGACY_SITE_INVENTORY.md) · [Competitor and best-practice review](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) · [Redesign baseline (Arabic)](../09-redesign/00-baseline-and-plan.md) · [Docs index](../00-INDEX.md)

**Tag legend.** **[src]** repository at HEAD. **[db]** measured on the database copy. **[prod]** live host (previous release). **[legacy]** `hadramout.center`. **[sim]** replay of repository migrations on a throw-away copy.

**Which build did I observe?** Production does **not** run HEAD: `GET /ar/topics`, `/ar/topics/54`, `/ar/topics/18` return **404** on production while the route exists in source (`src/app/(site)/[locale]/topics`). `/ar/authors`, `/ar/authors/26`, `/ar/timeline`, `/ar/about`, `/ar/articles?category=18` and `/ar/search?q=سمهرم` return 200 on production. Everything about topics, the redesigned header and the sitemap additions below is therefore **[src]** only until HEAD is deployed.

---

## 1. Executive summary

* The IA is simple and consistent: 7 content hubs, one detail template, a shared URL scheme `/{lang}/{section}/{id}`, one canonical per page, state in the query string, `noindex` on any customised list (section 6). It is a clear improvement over the legacy site, which had 6 nav items [legacy header of `GET /magazines/89`], no author index or topic pages (listed as local-only features in the parity matrix), a `/about` that returned a soft-404 and a `/magazine` sitemap entry that never worked (see the matrix in [`../audit/LEGACY_SITE_INVENTORY.md`](../audit/LEGACY_SITE_INVENTORY.md)).
* The weak points are about **discovery by subject** and **linking**: no place, period or theme browse (DATA-003); 15.6% of articles have no topic and 18 of the 48 topic columns have 2 articles or fewer (DATA-004); 487 of 1,454 items (34%) get no related content and no cross-type link exists (DATA-009); public URLs have no readable slug and rely on autoincrement ids (DATA-008).
* Navigation puts the redesign's best discovery tools (Topics, Authors, Timeline) under "More" (DATA-024) and the article breadcrumb skips the parent topic (DATA-015).
* The Events hub is stale (last event 2024-11-26) while news continues to 2026-10-04 (DATA-007); the home page copes (it switches the block title to "Events" when there is nothing upcoming), but the hub gives no explanation to a visitor.

---

## 2. Content inventory by hub [db, prod sitemap]

| Hub | Public route | Items | Date range (display date) | With cover image | With PDF | Facets offered [src: `list-query.ts:12-20`] | Per page / views |
|---|---|---:|---|---:|---:|---|---|
| News | `/{lang}/news` | 387 | 2015-12-21 to 2026-10-04 | 387 | n/a | `q`, `year` | 12 / grid, list |
| Articles and studies | `/{lang}/articles` | 909 | 2023-10 to 2025-12 (issue-derived, **unreliable**, DATA-001) | n/a (no image field) | n/a | `q`, `topic`, `year`, `author` | 20 / list, compact (40) |
| Books | `/{lang}/books` | 52 | 2015 to 2025 (+4 undated) | 52 | 21 | `q`, `year`, `author`, `pdf` | 18 / grid |
| Magazine issues | `/{lang}/magazines` | 40 (issues 1-41, 24-25 combined) | 2023-10 to 2026-10 (upload-derived for issues 1-29) | 40 | 40 | `year`, `pdf` | 18 / grid |
| Conferences and seminars | `/{lang}/events` | 53 | 2016-01-17 to 2024-11-26 | **0** | n/a | `q`, `when`, `year` | 12 / list |
| Ameed Al-Wafa Forum | `/{lang}/forum` (collection `forum-events`) | 11 | 2024-05-12 to 2024-10-12 (6 of 11 dates estimated) | **0** | n/a | `q`, `when`, `year` | 12 / list |
| Videos | `/{lang}/videos` | 2 | 2026 (estimated) | 1 | n/a | none | 12 / grid |
| Topics | `/{lang}/topics`, `/topics/{id}` | 8 topics + 48 columns + 2 loose = 58 [sim] | n/a | n/a | n/a | inherits article facets minus `topic` | 20 |
| Authors | `/{lang}/authors`, `/authors/{id}` | 274 | n/a | n/a | n/a | name search, letter index | n/a |
| Timeline | `/{lang}/timeline` | 6 | -800 to 1990 | n/a | n/a | none | n/a |
| Static pages | `/{lang}/{about,privacy,terms,accessibility}` | 4 CMS pages | n/a | n/a | n/a | none | n/a |
| Contact, Search, Saved | `/{lang}/contact`, `/search`, `/saved` | code routes | n/a | n/a | n/a | search has its own page | n/a |

News has no category, author or tag of any kind; events, forum and videos neither. Only articles (topic, author, issue) and books (author) have relational metadata.

---

## 3. Route map [src: `find src/app`]

| Route | File | Purpose | Indexed? | In sitemap (HEAD) |
|---|---|---|---|---|
| `/` | `src/proxy.ts` | Redirect to negotiated language (307) | n/a | no |
| `/{lang}` | `(site)/[locale]/page.tsx` | Home: hero with latest issue, stats, news, events (upcoming or recent), forum, topics, articles, authors, timeline, issues, books, videos | yes | yes |
| `/{lang}/{section}` | `[section]/page.tsx` | Content hub for the 7 types **or** a CMS page when `section` is not a type (slug lookup in `pages`) | plain page 1 yes; any filter, sort, view other than default: `noindex` | yes |
| `/{lang}/{section}/{id}` | `[section]/[id]/page.tsx` | Detail page for the 7 types (7 layouts), related, neighbours, reviews | yes | yes (ids) |
| `/{lang}/topics`, `/topics/{id}` | `topics/` | Topic hub and topic/column landing page (article list with fixed category) | yes (filtered variants `noindex`) | yes, Arabic only |
| `/{lang}/authors`, `/authors/{id}` | `authors/` | A-Z author index and author page | yes | yes, Arabic only |
| `/{lang}/timeline` | `timeline/page.tsx` | Chronology | yes | yes |
| `/{lang}/search` | `search/page.tsx` | Cross-type search | `noindex` | no |
| `/{lang}/saved` | `saved/page.tsx` | Visitor's saved items (client-side) | `noindex` | no |
| `/{lang}/contact` | `contact/page.tsx` | Contact form | yes | yes |
| `/feeds/{lang}/{file}` | `feeds/` | RSS | n/a | no |
| `/legacy/{section}/{id}` | `legacy/` | Internal target of the legacy rewrite; 301 to the new URL | n/a | no |
| `/legacy-media/...` | `legacy-media/` | Mirror of `files.hadramout.center` images and PDFs | n/a | no |
| `/og/...`, `/api/hc/*`, `/admin`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | | utility | n/a | n/a |

Sitemap at HEAD adds `/authors/{id}` (274) and `/topics/{id}` (58 with at least one item) to the 1,487 URLs that production lists today [src: `sitemap.xml/route.ts:65-68`; prod: 1,487 `<url>`]. Expected total after deploy: 1,487 + 274 + 58 = 1,819 (arithmetic from the above; **not observed**).

**Section/slug collision [src].** `/{lang}/{section}` serves a CMS page for any unknown section, but static routes (`authors`, `topics`, `timeline`, `search`, `saved`, `contact`) and the 7 content routes always win. The admin hint on `pages.slug` lists `contact` as a CMS slug although `/contact` is a code route; a page created with a reserved slug would never render (DATA-019).

---

## 4. Navigation

### 4.1 Header and menus [src: `src/components/Shell.tsx:18-35`]

| Level | Items (in order) | Behaviour |
|---|---|---|
| Primary (6) | News, Articles and studies, Books, Magazine, Conferences and seminars, Videos | `PriorityNav`: shows as many as fit, the rest collapse into "More" |
| Secondary (6), under "More" | **Topics**, Forum, **Authors**, **Timeline**, About, Contact | |
| Mobile menu | Home + all 12 above + Saved | single list |
| Footer "Explore" | the 6 primary + Topics + Forum | |
| Footer "Research" | Search, Authors, Timeline, Saved, RSS | |
| Footer "About" | About, Contact, Privacy, Terms, Accessibility | |
| Utility in header | Search toggle, language picker (98 languages), theme toggle | |

Observations: (1) the three subject-discovery pages (Topics, Authors, Timeline) are only reachable from "More" or the footer, although the home page promotes them (DATA-024); (2) the nine legacy-parity items are all in the first level; (3) "Forum" sits in the secondary group although it is a distinct programme of the Center (11 items, all 2024).

### 4.2 Home page order [src: `[locale]/page.tsx`]

Hero (latest issue) > stats (articles, books, issues, events+forum, news) > latest news (4) > upcoming events or recent events (3) > forum (3) > topics > latest articles (6) + top authors (14) + timeline teaser > issues (8) > books (10) > videos (3). The home page does not use the `featured` flag (DATA-011) and the "upcoming" call returns nothing today because the newest event is dated 2024-11-26.

---

## 5. URL scheme

| Aspect | As built | Evidence | Assessment |
|---|---|---|---|
| Structure | `/{lang}/{section}/{id}` with `lang` = ISO code of 98 languages, `id` = Payload autoincrement id | `content-types.ts:10-18`; `GET /ar/articles/690` 200 | Predictable and short; no keywords in the URL. |
| Slug | none; no `slug` field on any content type (only on `pages`) | `src/collections/*` | DATA-008. Titles are Arabic and long; an Arabic slug would be percent-encoded and long, a Latin slug needs an editor field. |
| Stability | ids are database row ids. Content ids match production for all 10 sampled pages. Topic ids (54-61) are created by migration 4 at deploy time and differ if the category table has other ids | `[db, prod, sim]` | Risk on re-seed or restore into an empty database (DATA-008). |
| Magazine ids | `/magazines/{id}` where id is the row id, not the issue number: `/magazines/24` = issue 24-25, `/magazines/25` = issue 26, `/magazines/40` = issue 41 | `[db]`; `GET /ar/magazines/24` title "العدد 24-25" | Confusing for readers who edit URLs by issue number (DATA-012). |
| Case, trailing slash | not tested here | | SEO area. |
| Query state | all list state in the query string: `q, category, year, author, pdf, when, sort, view, page`; defaults never appear | `list-query.ts:88-102` | Good: shareable, back-button safe. |
| Canonical | `/{lang}/{section}`; a list narrowed to a single topic points to `/topics/{id}` | `[section]/page.tsx:39-47` | Good. |
| Legacy URLs | `/{section}/{legacyId}` (no language) rewritten to `/legacy/...` and answered with 301 to `/{lang}/{section}/{newId}`; `/{section}` list URLs 308 to `/{lang}/{section}`; unknown legacy id 302 to the list | `proxy.ts:18-33`, `legacy/[section]/[id]/route.ts` | Good. Production probes in the inventory document confirm 301s for 14 ids. 4 news and 3 articles were not migrated and fall back to the list (see inventory section 7). |
| Language prefix for untranslated pages | topic and author pages exist only in Arabic (`readyLangs: ['ar']`) | `topics/page.tsx:17`, `sitemap.xml/route.ts` | Intentional. |

---

## 6. Hubs, listing behaviour and indexing rules

| Rule | Implementation | Evidence |
|---|---|---|
| Page 1, default view and sort, no filter = indexable | `isCustomised()` false | `list-query.ts:124-127` |
| Any facet, non-default sort or view = `noindex` and canonical to the base list | `noindex: isCustomised(...)` | `[section]/page.tsx:44` |
| Pagination | `?page=N`, title suffix "page N" via `withPage` | `seo-text.ts` |
| Facet counts | exact and disjunctive (each facet counted on the rows matching all other filters) | `facet-core.ts:92-107`; unit tests assert counts equal result sizes |
| Search inside a hub | `q` facet uses the FTS index in `extras.db` and keeps the other filters | `facets.ts:190-193` |
| Year facet | uses `year` of the row; excludes `estimated` and `none` dates; for books uses the printed year | `facets.ts:48-62` |
| Empty facet options | topic facet hides options with 0 in the current selection except the selected one | `Listing.tsx:36-44` |

**Year facet reliability.** For articles and magazines the year is derived from the issue (DATA-001): `/ar/articles?year=2023` returns 713 of 909 results [prod]. Until T1 is done, the facet gives readers a false picture of when material was published.

**Empty and thin hubs [db].**

* Events "upcoming" is empty (no event after 2024-11-26) and Forum "upcoming" is empty.
* Videos has 2 items and no facet; it is in the primary navigation.
* 18 of 48 topic columns hold 2 articles or fewer (12 hold 1) and are indexable landing pages with auto-generated descriptions (`topics.auto`) [sim].
* No topic is completely empty (every category has at least 1 article).

---

## 7. Breadcrumbs and in-page structure

| Template | Trail [src] | Notes |
|---|---|---|
| Hub (`/news`) | Home > Hub | JSON-LD `BreadcrumbList` on topics and authors; hubs via `PageHead` |
| Article (categorised) | Home > Articles and studies > **Column** > Title | `[id]/page.tsx:165`; links the **leaf column** (`/topics/{leaf id}`), the parent topic is skipped, although `/topics/{leaf}` itself shows Topics > Parent > Leaf (DATA-015) |
| Article (uncategorised, 15.6%) | Home > Articles and studies > Title | no topic link, no kicker |
| Book, magazine, news, event, forum, video | Home > Hub > Title | |
| Topic page | Home > Topics > [Parent] > Topic | `topics/[id]/page.tsx` |
| Author page | Home > Authors > Name | |

Detail pages also provide: previous/next neighbours by date (newer/older), up to 4 related items, the author byline linking to the author page, the issue link for articles, the table of contents for magazine issues (articles of that issue, up to 200), citation panel and reader reviews (books, articles, issues).

---

## 8. Related content and cross-linking

**Rule [src: `facet-core.ts:160-169`].** Score = 4 for the same category + 3 for a shared author + 2 for the same issue; items with score 0 are dropped; the best 4 by score then date are shown. It is transparent and never random, but it only knows three relations.

| Type | Items | Items that get at least one related entry [db, computed with the same rule] |
|---|---:|---:|
| Articles | 909 | 909 (every article has an issue or a category) |
| Books | 52 | 18 (34 have no related entry: no category, and unique or no author) |
| News | 387 | **0** (no category, author or issue exists) |
| Events | 53 | **0** |
| Forum | 11 | **0** |
| Videos | 2 | **0** |
| **Total without related** | **487 of 1,454 (33.5%)** | |

Cross-type links that exist: article to its issue and issue to its articles; article and book to authors; timeline entry to one article (`relatedArticle`, one direction, not set on any of the 6 entries in the local copy). Cross-type links that do not exist: news to the event it announces (25 news items since 2025 are seminar or lecture announcements, DATA-007), article to book by the same author, book to the issue that reviewed it, topic or place to events, author to events. See T9.

---

## 9. IA versus the Center's content

| Question | Answer from the data | Verdict |
|---|---|---|
| Can a reader find all journal articles of one column? | Yes, via topic or column page (84.4% of articles) | Good; 15.6% missing (DATA-004) |
| Can a reader find articles about a place (Tarim, Shibam, Mukalla, Doan...)? | Only through free-text search; place names occur in 160 to 350 of 909 article bodies | Gap (DATA-003) |
| Can a reader browse by period (ancient, Islamic, sultanate, modern)? | No facet; the timeline has 6 entries and links no articles | Gap |
| Can a reader find all works of an author? | Yes; author page, plus author facet in articles and books | Good, with duplicate/fragment authors (DATA-005, DATA-006) |
| Can a reader find a specific journal issue and its contents? | Yes for issues 1-37 (table of contents); issues 38-41 have no listed articles; double issue 24-25 has no entry under number 25 | Mostly good (DATA-012) |
| Can a reader cite a source properly? | Citation panel (APA, MLA, Chicago, Harvard, BibTeX, RIS, CSL-JSON); year taken from the derived date for articles and magazines | Wrong years for 713 articles (DATA-001) |
| Can a reader see upcoming activities? | Not today; events end in 2024, 2025-2026 activities are only news | Gap (DATA-007) |
| Can a reader reach documents, photographs, manuscripts? | No such content type | NOT VERIFIED whether wanted (DATA-021) |

Benchmarks and what comparable institutions offer are in [`../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md`](../research/COMPETITOR_AND_BEST_PRACTICES_REVIEW.md); this document does not duplicate them.

---

## 10. Findings that affect IA

| ID | Sev | Title | One-line evidence |
|---|---|---|---|
| DATA-001 | high | Year and date shown for articles and magazines are upload months | `/ar/articles?year=2023` = 713 [prod]; JSON-LD `datePublished` `2023-10-01` on `/ar/articles/128` [prod] |
| DATA-003 | medium | No place/period/theme browse; history topic is 4.6% of articles | counts in [`DATA_MODEL_AND_TAXONOMY.md`](./DATA_MODEL_AND_TAXONOMY.md) §7 |
| DATA-004 | medium | 142 uncategorised; 18 of 48 columns with 2 articles or fewer | `[db, sim]` |
| DATA-007 | medium | Events hub stale since 2024-11-26 | `max(event_date)` = 2024-11-26 [db] |
| DATA-008 | medium | Id-only URLs, environment-specific topic ids | no `slug` field; topic ids 54-61 created by migration [src, sim] |
| DATA-009 | medium | 487 of 1,454 items have no related content | rule in `facet-core.ts:160-169`, computed on [db] |
| DATA-011 | low | `featured` flag has no reader effect | no read of `featured` outside the row mapper [src] |
| DATA-012 | low | Magazine URL id differs from issue number; issue 25 unreachable by number | `/ar/magazines/24` title "العدد 24-25" [prod] |
| DATA-015 | low | Article breadcrumb skips parent topic | `[id]/page.tsx:165` [src] |
| DATA-019 | low | CMS slug can collide with code routes | `Pages.ts` slug field has no validation; hint lists `contact` [src] |
| DATA-024 | info | Topics, Authors, Timeline under "More" | `Shell.tsx:18-35` [src] |

---

## 11. Tasks (all `BACKLOG`)

| Task | Finding | Change | Acceptance | Verification | Status |
|---|---|---|---|---|---|
| IA-T1 | DATA-001 | Stop deriving the year facet and citation year from upload-derived dates (see DATA task T1) | `/ar/articles` year facet lists only years backed by editor-verified dates; hub shows a "date not recorded" note instead of a false year | `curl -s '/ar/articles?year=2023'` result count equals the verified count | BACKLOG |
| IA-T2 | DATA-003 | Add `/subjects` hub and `/subjects/{id}` pages (place, period, theme) and a `subject` facet to all hubs | Facet counts equal result counts for every subject; hub reachable from header "More" and from the home page topics block | Extend the facet unit tests; curl a subject page and compare count with the listed items | BACKLOG |
| IA-T3 | DATA-024 | Promote **Topics** (and Subjects when built) to the primary navigation; keep Forum, Authors, Timeline, About, Contact under "More" or move Forum into a "Programmes" group with Events | Topics visible on a 1280 px wide header without opening "More" | Visual check at 1280, 1024 and 390 px | BACKLOG |
| IA-T4 | DATA-015 | Article breadcrumb: Home > Articles > Topic > Column > Title, with JSON-LD parity | Four-level trail for any article whose column has a parent | curl and HTML parse of 5 sample articles, compare `BreadcrumbList` items | BACKLOG |
| IA-T5 | DATA-007 | Events hub: show last event date and a link to related news when nothing is upcoming; add `eventType`; backfill 2025-2026 events from news | When `upcoming` count is 0 the hub states the date of the latest event | Manual check; SQL on `event_date` | BACKLOG |
| IA-T6 | DATA-009 | Extend related rules (shared subject, same year, same type) and add a cross-type "See also" block | At least 90% of items have 1 or more related entries | Script over all ids; spot-check 20 | BACKLOG |
| IA-T7 | DATA-008 | Introduce `slug` and `/{id}-{slug}` canonical URLs with 301 from id-only; stable `key` for categories | 20 sampled old URLs return 301 to the new canonical; sitemap lists canonicals only | curl -I on 20 URLs; sitemap diff | BACKLOG |
| IA-T8 | DATA-004 | Mark topic pages with fewer than 3 articles `noindex` and exclude them from the sitemap until they grow | No sitemap URL for a topic with fewer than 3 items | Parse sitemap, compare with counts | BACKLOG |
| IA-T9 | DATA-019 | Validate `pages.slug` against reserved routes (content routes, `authors`, `topics`, `timeline`, `search`, `saved`, `contact`) and fix the admin hint | Creating a page with slug `topics` is rejected with a clear message | Admin test | BACKLOG |
| IA-T10 | DATA-012 | Resolve magazine URL/issue mismatch with a `/magazines/issue-{n}` alias (redirect) | `/ar/magazines/issue-25` returns 301 to the double issue | curl | BACKLOG |

---

## 12. Not verified

* Navigation behaviour at different viewport widths (visual and accessibility areas).
* Whether Cloudflare or nginx rewrite any of the paths above (system architecture area).
* The post-deploy sitemap count (1,819) is arithmetic, not an observation.
* Search ranking and suggestion quality (search is covered elsewhere).
* Whether the Center wants documentation assets (photographs, manuscripts) online, and whether a "Programmes" grouping matches how the Center thinks of its activities: both need a stakeholder decision.
