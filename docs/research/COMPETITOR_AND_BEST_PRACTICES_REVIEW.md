# Comparable-Site and Best-Practice Review

| | |
|---|---|
| **Purpose** | Compare the Hadramout Center platform with comparable digital archives, research centres, publishers and editorial sites, and with the official standards that apply (Google Search Central, WCAG 2.2, Core Web Vitals, Open Graph, Next.js 16). Turn the comparison into a ranked adopt / adapt / skip list tied to what the platform already does. |
| **Scope** | Catalogue and facet UX, citation tools, Arabic/RTL handling, article layout, accessibility, metadata and schema patterns. Content types in scope: news, article, book, magazine issue, event, forum event, video (see `src/lib/content-types.ts`). |
| **Status** | Research complete. All tasks below are `BACKLOG`; nothing has been implemented. |
| **Last updated** | 2026-10-18 |
| **Extends** | [`../01-audit/03-benchmark-and-best-practices.md`](../01-audit/03-benchmark-and-best-practices.md) (Arabic, decisions by topic). That file is not superseded except where section 7 below says so. Also read [`../08-review/01-site-review-old-vs-new.md`](../08-review/01-site-review-old-vs-new.md) (old vs new, Lighthouse). |
| **Evidence base** | Live production `https://hadramout-center.novixa.dev` (GET only, about 25 requests), the local `master` source (10 commits ahead of `origin`), and the pages listed in section 9. Every "production" statement below was observed on 2026-10-18 and every "source" statement was read from the working tree. Where they differ it is stated. |

## 0. Reading guide and honesty notes

1. **Production vs source.** Production is older than the working tree. Example: production article JSON-LD has no `@id`, `mainEntityOfPage`, `isPartOf` or `dateModified`, while `src/lib/jsonld.ts:44-55` emits them. Production `robots.txt` prints `Host:` and `Sitemap:` lines for `https://hadramout.center` while the sitemap `<loc>` values use `hadramout-center.novixa.dev` (observed; the SEO audit owns this). Each finding below says which of the two it was confirmed in.
2. **How peer sites were observed.** The only fetch tool available returns a text conversion of the page, not raw HTML. It therefore cannot show `<head>` metadata or JSON-LD of peer sites, and several sites answered HTTP 403 or 429 to it. Peer findings are limited to what was actually returned and are marked. Anything not returned is marked `NOT VERIFIED`. No peer is recommended for copying; each row says what to adapt and why it fits this platform.
3. **No invented numbers.** Counts quoted for peers (for example 149 Europeana results) are what the page returned on 2026-10-18 and change daily.

## 1. Where the platform already stands (so we do not re-propose it)

Verified in source (file:line) and, where noted, in production.

| Capability | Evidence | Peer practice it matches |
|---|---|---|
| Faceted archive lists with exact counts, removable chips, year / topic / author / PDF-only / upcoming-past facets, sort incl. relevance | `src/components/Listing.tsx:84-126`, `src/lib/facets.ts`, `src/lib/facet-core.ts:93-96` | Internet Archive, DLME, Sana'a Center (year only) |
| Unified Arabic-normalised full-text search (FTS5) with per-type counts | `src/lib/search-page.ts:30-60`, `src/db/search.ts` | Library of Congress format chips, Persee |
| Citation panel: APA, MLA, Chicago, Harvard, BibTeX, RIS, CSL-JSON, plus "save" and print | `src/app/(site)/[locale]/[section]/[id]/page.tsx:143,208-211`, `src/lib/citations.ts:80-198` | Arabic Wikisource "cite this page"; Persee "Identifiants et citations" |
| Google Scholar `citation_*` (Highwire) tags on article, book, magazine | `src/lib/citations.ts:204-221`; production `articles/690` shows `citation_title/author/publication_date/journal_title/issue` | Zotero reads these as "Embedded Metadata" |
| JSON-LD per type (ScholarlyArticle, NewsArticle, Book, PublicationIssue, Event, VideoObject, BreadcrumbList, ResearchOrganization, WebSite, CollectionPage, ProfilePage) | `src/lib/jsonld.ts:38-208` | Google structured-data gallery |
| hreflang (page, sitemap, `x-default`), self canonical, `?page=n` own canonical, noindex for incomplete translations and customised lists | `src/lib/seo.ts:55-90`, `src/app/sitemap.xml/route.ts:20-30` | Google localized-versions and pagination docs |
| Open Graph incl. `article:*` and `book:*`, generated 1200x630 cards, `max-image-preview:large` | `src/lib/seo.ts:76-97` | ogp.me |
| Hijri date shown for day-precision Arabic dates | `page.tsx:184`, `src/lib/dates.ts:68-75` | DLME offers a Hijri calendar option |
| Latin digits in Arabic UI, no letter-spacing on Arabic, `dir=auto` for mixed names | `src/lib/dates.ts:74`; `src/styles/*.css` grep: `letter-spacing` only on Latin badges and a decorative rule; commit `31eb25b` | W3C Arabic layout requirements (letter-spacing warning), W3C `dir=auto` guidance |
| RSS 2.0 per language and per type | `src/app/feeds/[lang]/[file]/route.ts:11-31` | OpenEdition publishes three RSS feeds |

The Google Scholar rules listed in the older benchmark (section 2) are correctly followed for the tag set. Section 5 lists the two places where output deviates (journal title, PDF location).

## 2. Comparable sites reviewed

"Method" says what the tool actually returned. Platform column compares against the current state, not an ideal.

| # | Site | Type | Method / limits | What was observed | Platform today | Takeaway |
|---|---|---|---|---|---|---|
| 1 | Qatar Digital Library, qdl.qa | Gulf historical archive | Direct fetch HTTP 403 (site and item pages). Only search-engine titles and a 2016 QNL news item were readable | Item URLs/titles carry the folio position, e.g. `File 1740/1915 ... 'Arabia: Policy in Hadramaut, Yemen' [front-i] (7/846)`; catalogue records show reference number and language; launch note says descriptions are provided in Arabic and English and 475,000+ pages were published. Facets, viewer, citation UI: `NOT VERIFIED` | Magazine issues are PDF links, no page-level addressing | Page-level addressing only matters if issues are ever split per article; already covered by articles linking to their issue |
| 2 | Library of Congress, loc.gov | National library | Home page fetched; collections/item pages 403. API doc fetched | Material-type chips beside the search box (Everything, Books/Printed Material, Maps, Newspapers, Periodicals ...), "Skip to main content", trending searches. API: JSON and YAML, faceting recommended, no key, rate-limited, "paging past the 100,000th item is not supported" | Type tabs with counts exist on `/search` | Facet in preference to deep paging; document a read-only JSON surface (finding RES-016) |
| 3 | Internet Archive, archive.org | Universal archive | `advancedsearch.php` fetched; details/texts pages 404/blank | Field-scoped search (title, creator, description, collection, mediatype), Lucene syntax, output as JSON, XML, CSV, RSS, user-chosen fields and sort | Single query box + facets | Bulk/machine export (RES-016); advanced field syntax is not worth it for 1.4k items |
| 4 | Persee, persee.fr | French open scholarly portal | Home fetched | fr/en switch, "Parcourir les collections" by discipline, "Outils" with "Identifiants et citations" and "Références bibliographiques", DOI prefix 10.3406 shown on cards. Search facets and citation modal: `NOT VERIFIED` (not in captured text) | Cite panel in-page | Citation is a first-class, discoverable tool; platform already has it |
| 5 | Gallica, gallica.bnf.fr | BnF digital library | HTTP 403 | `NOT VERIFIED` | n/a | none |
| 6 | Europeana, europeana.eu | Aggregator | Search for "hadramaut" fetched | 149 results, 24 per page, 7 pages; grid / list / mosaic icon links; each card names the contributing institution; Previous/Next only. Facets and rights labels were not in the captured (script-rendered) text: `NOT VERIFIED` | Grid / list view toggle exists (`VIEWS` in `list-query.ts`) | Showing the source of each record on the card is irrelevant for a single-publisher site; rights labelling is relevant (RES-015) |
| 7 | OpenEdition Journals | Francophone journal platform | Home fetched | 676 journals; fr/en switch; search with scope choice ("all OpenEdition" or "Journals"); three RSS feeds; an accessibility page declared "non conforme" (an honest statement) | One RSS feed link in `<head>` (`seo.ts:93`); feeds served per language and type via `/feeds/{lang}/{file}.xml` | Honest accessibility statement (the platform has `/accessibility`, in the sitemap); richer feeds (RES-009) |
| 8 | Sana'a Center for Strategic Studies | Yemen-focused research centre | Publications page fetched | Reverse-chronological list, 62 pages, **only** a year filter (with per-year counts), type via category nav, link to the Arabic edition, card shows category, date, reading time, title, linked author; no cite/PDF on the list; mailing-list box | Facets are a superset (topic, author, PDF, year) | Platform is already ahead on filtering; keep the reading-time and author-link card pattern (already present: `page.tsx` "31 دقيقة قراءة") |
| 9 | Al Jazeera Centre for Studies (Arabic) | Gulf research centre, Arabic editorial | `/ar` fetched | Navigation is by publication type (analytical papers, policy briefs, media studies, research files, books, two magazines, theses, e-books); no list filters visible; `/ar` and `/en` toggle; skip link | Types are collections (`/articles`, `/books`, `/magazines` ...) | Type-first navigation matches the platform; filters are an advantage |
| 10 | Digital Library of the Middle East (dlmenetwork.org/library; dlme.clir.org 301s there) | Arabic-region aggregator | Fetched after redirect | Facets Type (Object 103,394; Text 86,614), Language, **Date range with Gregorian and Hijri options and a "View distribution" link**, a count of **83,026 items with missing dates**, holding institution, collection; Arabic version link. Record pages not captured: `NOT VERIFIED` | Year list with counts; undated items silently drop out of the year facet (`facet-core.ts:96`); Hijri only displayed | Surface undated items and offer Hijri-aware dates (RES-011) |
| 11 | Arabic Wikisource | Open Arabic texts | Main page fetched | About 94.7k pages; organised by genre/subject (poetry, historical texts, Islamic books ...), author pages, alphabetical index; per-page "cite this page", permanent link, short URL, PDF download, printable version | Cite panel, copy-link, print, topics tree | Stable permanent link and a printable view are both present on the platform |
| 12 | Wellcome Collection | Museum/library | Search page 403; developer docs fetched | Open catalogue API, no key, IIIF links for digitised works, own data CC0, daily snapshot recommended for bulk harvest | none | Bulk snapshot instead of scraping (RES-016); rights stated per dataset (RES-015) |
| 13 | Rijksmuseum | Museum | Collection page fetched | Facets not in the captured text (`NOT VERIFIED`); image URLs on an `iiif.micr.io` host (IIIF-style serving not confirmed); accessibility statement linked in footer | Accessibility statement exists | none |
| 14 | Hindawi, hindawi.org (books) | Arabic open-books publisher | `/books/` returned 301 to safahat.org/books; destination 403 | Redirect observed 2026-10-18; catalogue UX `NOT VERIFIED` | n/a | none |
| 15 | Brill, Darah (darah.org.sa), Jadaliyya, Met Museum, HathiTrust, British Library EAP, ACO (NYU) | Publisher / Gulf foundation / editorial / museum / library | 403, 429 or empty page, or host not found (aco.nyu.edu) | `NOT VERIFIED`. The older benchmark lists Darah and Al Owais as references; this review could not re-confirm them | n/a | The older benchmark's claims about Darah, Al Owais and Brill remain unverified here |

Result: 10 sites gave usable observations (2, 3, 4, 6, 7, 8, 9, 10, 11, 12); 5 rows are limited or blocked. A manual pass in a real browser on QDL, Gallica, Brill and Darah is the one gap left (task RES-T01 below).

## 3. Official standards checked

All pages accessed 2026-10-18.

| Standard | URL | What it says (as read) | Platform status |
|---|---|---|---|
| Google structured-data gallery | https://developers.google.com/search/docs/appearance/structured-data/search-gallery (updated 2026-10-16) | Article, Breadcrumb, Event, Organization, Video, Dataset, Profile page, Discussion forum are gallery features. Book has no gallery card; it appears only through Review snippet and Book actions. No deprecation notices on that page | Types in use are all still listed |
| Event | https://developers.google.com/search/docs/appearance/structured-data/event | Required: `name`, `startDate`, `location`, `location.address`. Recommended: `endDate`, `eventStatus`, `image`, `offers`, `organizer`, `performer`. Multi-day events need both dates | Gap: RES-003 |
| Video | https://developers.google.com/search/docs/appearance/structured-data/video | Required: `name`, `thumbnailUrl`, `uploadDate`. Recommended `contentUrl` / `embedUrl`, `duration`, timezone on dates | Gap: RES-002 |
| Article | https://developers.google.com/search/docs/appearance/structured-data/article | No required properties; recommended `headline`, `image`, `datePublished`, `dateModified` (ISO 8601 with timezone), `author.name`/`url`. "Author name should contain only the author's name": no honorific or job title | Gap: RES-005 |
| Review snippet | https://developers.google.com/search/docs/appearance/structured-data/review-snippet | Book is a supported rich-result type. `aggregateRating` needs `ratingValue` plus `ratingCount` or `reviewCount`; ratings must be visible on the page; no incentivised or fake reviews | Compliant in design: only approved reader ratings above a minimum count are emitted (`page.tsx:178`). Visibility on the page: `NOT VERIFIED` (no book had enough ratings in the sample) |
| Book actions | https://developers.google.com/search/docs/appearance/structured-data/book | Limited to book providers with a wide selection; requires an interest form; ISBN-13 only | Skip (section 8) |
| Organization | https://developers.google.com/search/docs/appearance/structured-data/organization | No required properties; recommends `name`, `alternateName`, `url`, `logo` (at least 112x112), `sameAs`, `address`, `contactPoint`; place on home or About page | `orgJsonLd` covers these (`jsonld.ts:132-146`) |
| Breadcrumb | https://developers.google.com/search/docs/appearance/structured-data/breadcrumb | At least two `ListItem`s; `item` optional on last; should reflect a typical user path | Compliant (production `articles/690`: 3 items) |
| Sitemaps | https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap | 50 MB / 50,000 URLs per file; sitemap index recommended for tracking; Google ignores `priority` and `changefreq`; `lastmod` used only if consistently accurate; image/video extensions exist | Single file, 1,487 `<loc>`, 542,506 bytes; emits `priority`. RES-007 |
| Pagination | https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading | Own canonical per page, no `#` page numbers, `rel=prev/next` ignored by Google, noindex or robots for filter variants | Compliant (`seo.ts:65`; `?page=n`) |
| Faceted navigation | https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation | Robots disallow is preferred when filtered URLs need no indexing; canonical and nofollow are weaker; return 404 for empty combinations | Platform uses noindex on customised lists (`[section]/page.tsx:44`) rather than robots. Acceptable at 1.4k items; revisit if Search Console reports crawl waste |
| hreflang | https://developers.google.com/search/docs/specialty/international/localized-versions | Return links mandatory; self reference; `x-default`; region-only codes invalid; sitemap method allowed | Compliant in sitemap and page head (production `books/37` has `ar` and `x-default` only because the English version is incomplete) |
| Sitelinks search box | https://developers.google.com/search/blog/2024/10/sitelinks-search-box and https://searchengineland.com/google-to-drop-sitelinks-search-box-447682 | Removed from results starting 2024-11-21; existing markup causes no errors | `SearchAction` still emitted (`jsonld.ts:161`): harmless, RES-014 |
| Google Scholar inclusion | https://scholar.google.com/intl/en/scholar/inclusion.html | `citation_pdf_url` must be in the same subdirectory as the abstract page; PDFs must have searchable text and be 5 MB or less; dates as `2010/5/12` or year alone; one `citation_author` tag per author; Dublin Core only as a last resort | Gaps: RES-001, RES-006 |
| Zotero metadata | https://www.zotero.org/support/dev/exposing_metadata | Reads Embedded Metadata (Highwire/Dublin Core), COinS, unAPI | Highwire tags suffice; COinS not needed (RES-012) |
| Core Web Vitals | https://web.dev/articles/vitals | LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1, at the 75th percentile, mobile and desktop separately; INP replaced FID in 2024 | Targets already adopted in older benchmark section 5; field data not collected here (NOT VERIFIED) |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | New AA: 2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum, 24x24 CSS px), 3.3.8 Accessible Authentication (Minimum); 4.1.1 Parsing removed | Older benchmark states a 44 px target, which is stricter than AA 2.5.8 (24 px); keep 44 px as house rule, cite 24 px as the conformance bar. Accessibility audit owns testing |
| Open Graph protocol | https://ogp.me/ | Required: `og:title`, `og:type`, `og:image`, `og:url`; `article:published_time`, `article:author`; `book:isbn`, `book:release_date`, `book:author`; repeatable `og:locale:alternate` | Compliant (`seo.ts:76-106`) |
| Next.js 16 `generateMetadata` | https://nextjs.org/docs/app/api-reference/functions/generate-metadata (lastUpdated 2026-08-19) | Metadata streams after the shell for bots that run JS; HTML-limited bots (e.g. `facebookexternalhit`) still receive it in `<head>`; `htmlLimitedBots` can be overridden | Pages use `generateMetadata` with `force-dynamic` search page; OG crawlers are covered by default |
| Next.js 16 caching | https://nextjs.org/docs/app/getting-started/caching (lastUpdated 2026-10-06) | Cache Components (`cacheComponents: true`), `use cache`, `cacheLife`, `cacheTag`, Partial Prerendering as the default model | `next.config.ts` does not set `cacheComponents`; the platform uses its own 5-minute row cache (`facets.ts:12-30`) and revalidate hooks (`hooks/revalidate.ts`). Skip for now (section 8) |
| W3C Arabic Layout Requirements | https://www.w3.org/TR/alreq/ | Extra line height; kashida (tatweel) only as controlled justification; do not letter-space joined letters; numeral families should be a user/locale choice; isolate embedded Latin | Followed (section 1). Gap: stray tatweel in migrated text, RES-008 |
| W3C `dir` guidance | https://www.w3.org/International/questions/qa-html-dir | `dir="auto"` for unknown-direction content, `bdi` for isolated labels, no CSS base direction | Followed (commit `31eb25b`) |
| IIIF | https://iiif.io/get-started/how-iiif-works/ | Image API (deep zoom) + Presentation API (manifests) for digitised images | Skip (section 8) |

## 4. Findings (RES-)

Severity is `info`, `low` or `medium` only. "Seen in" says production (P), source (S) or both. All tasks `BACKLOG`.

### RES-001 (medium) Magazine-article citations and `citation_journal_title` use the issue title as the journal name
- **Evidence.** P: `/ar/articles/690` has `<meta name="citation_journal_title" content="مجلة حضرموت الثقافية العدد 6"/>` and `citation_issue` = 6. The APA string rendered in the page reads `... . مجلة حضرموت الثقافية العدد 6، العدد 6. https://...`, and MLA `... مجلة حضرموت الثقافية العدد 6، ع6، 2023`. S: `page.tsx:56` sets `containerTitle: magazine.title` (the issue document's title), while `jsonld.ts:95` already hard-codes the periodical name `مجلة حضرموت الثقافية`.
- **Why it matters.** The journal title is the key Scholar and Zotero use to group articles. Issue 6 and issue 7 become two "journals", and every exported citation repeats the issue number.
- **Recommendation.** Add a periodical name constant (or a Site global field) and use it as `containerTitle`; keep `issue` for the number. Use the same constant in `jsonld.ts:95`.
- **Effort.** S. **Dependencies.** None.

### RES-002 (medium) VideoObject markup has a malformed image URL and misses a required property
- **Evidence.** P: `/ar/videos/1` JSON-LD has `"image":"https://hadramout-center.novixa.devhttps://i.ytimg.com/vi/8mLzjsj-kw0/hqdefault.jpg"` and the same value in `thumbnailUrl`; no `uploadDate`, `duration` or `contentUrl`. P also: `<meta property="og:image" content="https://hadramout-center.novixa.devhttps//i.ytimg.com/...">`. S: `page.tsx:172` does `absolute(cover.src)` and `coverOf()` returns the absolute `https://i.ytimg.com/...` stored by the importer (`src/importer/legacy.ts:411`); `jsonld.ts:114-121` only sets `uploadDate` when the date is precise; the `duration` field exists in the collection (`content.ts:124`) but is never emitted. The OG case appears fixed in source (generated card), the JSON-LD case is not.
- **Impact.** Google requires `name`, `thumbnailUrl`, `uploadDate`; an invalid thumbnail URL makes the video ineligible and produces Search Console errors. Only 3 videos exist in the sitemap, so the effect is small but the bug applies to every future video.
- **Recommendation.** Pass absolute URLs through unchanged (`/^https?:/`), always emit `uploadDate` (use the video's date at its true precision, see RES-004; if the date is unknown, do not emit `VideoObject` rather than invent one), emit `duration` as ISO 8601 when the free-text field parses, and keep `embedUrl` (already there).
- **Effort.** S.

### RES-003 (low) Event and forum JSON-LD misses `location.address` and sometimes `startDate`
- **Evidence.** Source `jsonld.ts:103-112`: `location` is `{ '@type': 'Place', name }` with no `address`; `startDate` is conditional. P: `/ar/forum/1` JSON-LD has `"@type":"Event"` with no `startDate` and no `location`; `/ar/events/1` has `startDate` but no `location`, and `eventAttendanceMode` = `MixedEventAttendanceMode` (production code is older than the source, which omits the mode when neither venue nor link exists). Google lists `location`, `location.address`, `name`, `startDate` as required.
- **Impact.** Search Console "Event" items would be invalid. Past events do not get rich results anyway, so the real loss is noise, not traffic.
- **Recommendation.** Emit `Event` only when `startDate` exists; add `location.address` (text) from the venue, or `VirtualLocation` for online ones; add `eventStatus: EventScheduled` (or `EventCancelled`) only if editors can set it. Otherwise use the `CreativeWork`/`Article` form for dateless forum reports.
- **Effort.** S. **Dependencies.** Editor field for venue address (optional).

### RES-004 (low) JSON-LD dates claim more precision than the content has
- **Evidence.** P: `/ar/articles/690` page shows "أكتوبر 2023" (month precision) but JSON-LD has `"datePublished":"2023-10-01T00:00:00.000Z"`; `/ar/magazines/6` is the same month. S: `jsonld.ts:40-41` builds `date` from `isoOrUndefined(doc.publishedAt)` for every precision except estimated/none, whereas OG already limits `article:published_time` to day precision (`[id]/page.tsx:87`).
- **Recommendation.** Emit `YYYY`, `YYYY-MM` or `YYYY-MM-DD` according to `datePrecision` (all valid ISO 8601); keep full timestamps only for `dateModified`.
- **Effort.** S.

### RES-005 (low) JSON-LD `author.name` includes honorifics
- **Evidence.** P: `/ar/articles/690` JSON-LD author `"أ.د. عبدالله حسين البار"` while `citation_author` is the cleaned `عبدالله حسين البار`. S: `jsonld.ts:42` uses `a.name` directly; `cleanPersonName` (`arabic.ts`, applied in `citations.ts:38`) is used only for the Scholar tags. Google: "Don't add ... an honorific prefix or suffix" to `author.name`.
- **Recommendation.** Use `cleanPersonName` for `name`, move the stripped title into `honorificPrefix`.
- **Effort.** S.

### RES-006 (low) `citation_pdf_url` points to another host, which Scholar ignores
- **Evidence.** P: `/ar/magazines/6` has `citation_pdf_url` = `https://files.hadramout.center/media/2023/10/...`; Scholar requires the PDF "in the same subdirectory as the HTML abstract" and searchable text up to 5 MB. S: `citations.ts:220` copies `doc.pdf` as is; PDFs are free-text links (`content.ts:81,92`).
- **Impact.** The tag is silently useless, and the issues depend on a legacy host that is being retired. Whole issues and books are likely over 5 MB, so Scholar would index only the abstract page anyway (`NOT VERIFIED`: file sizes were not measured).
- **Recommendation.** Decide per type: for items under 5 MB serve the PDF from the platform at `/ar/<section>/<id>/<slug>.pdf` and point `citation_pdf_url` at it; for larger files drop the tag and keep `citation_abstract_html_url`. Coordinate with the migration plan for `files.hadramout.center`.
- **Effort.** M. **Dependencies.** PDF hosting decision (migration track).

### RES-007 (low) Sitemap hygiene
- **Evidence.** P `/sitemap.xml`: 542,506 bytes, 1,487 `<loc>`, every entry has `<priority>` (Google ignores it); `/ar/search` and `/en/search` are listed although `robots.txt` has `Disallow: /*/search` and the page is `noindex` (`search/page.tsx:29`); home and hub entries have no `lastmod`. Counts by type under `/ar/`: articles 910, news 388, events 54, books 53, magazines 41, forum 12, videos 3.
- **Recommendation.** Remove `priority`; drop the search URLs; split into a sitemap index with one file per content type so Search Console shows indexation per type; give hub pages a `lastmod` from the newest child; keep hreflang annotations.
- **Effort.** S.

### RES-008 (low) Kashida (tatweel) runs survive in migrated text
- **Evidence.** P: `/ar` (home) HTML contains `التاريخيـــة` and `المراكـــــــز` (20 runs of three or more U+0640 in the page); `/ar/articles/690` and `/ar/magazines/6` both contain the title text `سفر النجوم .. من روايـــة (العَنِيْن ) (1 ...` (a related or contents entry). The older review already noted the legacy site had this defect. S: tatweel is stripped only for search (`arabic.ts:6,25`) and in one topic migration (`20261015_222500_curate_topics.ts:19`); no display-time or import-time clean-up.
- **Impact.** Breaks copy/paste, text-to-speech and machine translation input, and shows uneven colour (alreq on kashida).
- **Recommendation.** Idempotent migration that removes runs of U+0640 of length 2+ in titles, excerpts and prose (keep single tatweel and anything inside quoted verse if editors flag it); keep the original in a revision.
- **Effort.** S-M.

### RES-009 (low) RSS feeds are not language-aware and carry little metadata
- **Evidence.** S: `feeds/[lang]/[file]/route.ts:30` hard-codes the Arabic channel title and the English description for every language; items have no `dc:creator`, `category` or PDF `enclosure`; capped at 50. OpenEdition exposes three feeds (featured, news, articles).
- **Recommendation.** Use the site name for `lang`; add `dc:creator` and `category`; add per-author and per-topic feeds only if demand shows in analytics.
- **Effort.** S.

### RES-010 (info) Show file type, size and page count on PDF buttons
- **Evidence.** S: `page.tsx:199-203` renders "read" and "download" buttons with no size; `pdf` is a plain text URL (`content.ts:81,92`) so no size is stored. Context: the older benchmark sets a 4G-slow budget for Yemen (section 5).
- **Recommendation.** At import/save time `HEAD` the PDF and store `pdfBytes`; render "PDF, 12.4 MB" next to the buttons. Peers' behaviour here was not observed.
- **Effort.** S-M. **Dependencies.** RES-006 hosting decision.

### RES-011 (info) Undated and Hijri-aware date facets
- **Evidence.** S: `facet-core.ts:96` counts a year only `if (r.year)`, so estimated/undated rows vanish from the year facet with no "undated" entry; `Row.year` is null for them (`facets.ts:46`). DLME shows an explicit count of items with missing dates and a Gregorian/Hijri switch. The platform already formats Hijri (`dates.ts:68-75`) but only on detail pages.
- **Recommendation.** Add an "undated (n)" option to the year facet. A Hijri year facet is a candidate only if editors record Hijri dates; do not derive it for pre-modern items (conversion drift). Ask the Center whether Hijri filtering is wanted before building.
- **Effort.** S (undated), L (Hijri).

### RES-012 (info) Older benchmark promises COinS; the code has none
- **Evidence.** `docs/01-audit/03-benchmark-and-best-practices.md:24` says every item ships "بيانات COinS". A source-wide search for `coins`, `z3988`, `unapi`, `opensearch`, `oai-pmh`, `iiif` and `dublin` in `src`, `scripts` and `public` finds no match. Zotero documents Embedded Metadata (Highwire/Dublin Core) as the preferred method, and the platform already emits Highwire tags.
- **Recommendation.** Amend that document line instead of adding COinS. Verify once with the Zotero Connector on an article and a book (`NOT VERIFIED` here: no browser session).
- **Effort.** S.

### RES-013 (info) Index PDF text so issues and books are searchable
- **Evidence.** S: search indexes only `title`, `excerpt`, `body`, `authors` (`src/db/search.ts:18-24`); no PDF extraction library or script exists (search of `src`, `scripts`, `package.json`). P: `/ar/magazines/6` description holds the issue's table of contents as text, which is why issues are findable today. Gallica, Persee and Internet Archive are full-text collections by design; Scholar requires searchable-text PDFs.
- **Recommendation.** Extract text at import/save time into a hidden `fullText` field feeding FTS only (not rendered, to avoid thin duplicate pages). Validate quality on Arabic PDFs before indexing: if a PDF is a scan without a text layer, skip it and record it (`NOT VERIFIED`: no PDF was sampled).
- **Effort.** L. **Dependencies.** RES-006.

### RES-014 (info) `SearchAction` markup is dead weight
- **Evidence.** S: `jsonld.ts:161` emits `potentialAction: SearchAction`; Google removed the sitelinks search box from 2024-11-21 and the search page is `noindex` and `Disallow`ed. Google says leftover markup is harmless.
- **Recommendation.** Remove it at the next SEO-touching change, or keep it; no ranking effect either way. Not worth a dedicated release.
- **Effort.** S.

### RES-015 (info) No rights or reuse statement per item
- **Evidence.** S: the only rights text is `footer.rights` "جميع الحقوق محفوظة" (`messages/ar.json:208`); JSON-LD sets `isAccessibleForFree: true` but no `license`, `copyrightHolder` or `copyrightYear` (`jsonld.ts`). Europeana, Wikisource, Wellcome (CC0 for its own data) and LoC make reuse terms explicit.
- **Recommendation.** The Center must decide the policy first (this review does not infer one). Then: a short "Reuse and citation" page, `copyrightHolder` (the Center) on all items, and `license` only where a licence is actually granted. Third-party-authored articles may need per-author permission.
- **Effort.** S (technical) after the policy. **Dependencies.** Institutional decision.

### RES-016 (info) Documented read-only data surface for researchers
- **Evidence.** P: `GET /api/books?limit=1` returns 200 JSON with full documents (Payload REST), while `robots.txt` disallows `/api/` and nothing documents the endpoint. LoC (JSON/YAML, no key, rate-limited), Internet Archive (JSON/CSV/RSS export) and Wellcome (open API, daily snapshot) publish a stable contract.
- **Recommendation.** Decide: either keep the surface private (restrict Payload REST for anonymous clients; the security audit owns this) or publish a small versioned export, e.g. a nightly `catalogue.json`/`catalogue.csv` (id, type, title, authors, date, URL, PDF URL, language, citation fields) under the same rights policy as RES-015. Prefer the snapshot to a public query API, which would need rate limiting and versioning.
- **Effort.** M. **Dependencies.** RES-015, security review of `/api`.

### RES-T01 task (BACKLOG) manual browser pass on blocked peers
Repeat the observations of rows 1, 5, 15 in a normal browser: facets, citation modal, viewer, Arabic UI. Output: append to section 2 with `NOT VERIFIED` removed. Effort S. Acceptance: each of QDL, Gallica, Brill, Darah has facets, citation and RTL notes with date.

## 5. Acceptance criteria and verification (per finding)

| ID | Acceptance criterion | Verification method |
|---|---|---|
| RES-001 | For article 690, `citation_journal_title` is exactly `مجلة حضرموت الثقافية`, `citation_issue` is `6`, and the APA string contains the issue number once | `curl -s /ar/articles/690` and grep the meta and the cite JSON; add a unit test next to `tests/unit` for `formatCitation` with `containerTitle` + `issue` |
| RES-002 | `videos/1` JSON-LD `thumbnailUrl` and `image` start with `https://i.ytimg.com/`; `uploadDate` present or the page's Rich Results Test shows no "required" error | Rich Results Test on the URL; `curl` + `jq` on the JSON-LD block; unit test of `contentJsonLd` for a video with absolute cover |
| RES-003 | No `Event` JSON-LD without `startDate`; every emitted `Event` has `location.address` or `VirtualLocation` | Rich Results Test on `events/1`, `forum/1`, one event with venue; unit test of both branches |
| RES-004 | A month-precision item emits `YYYY-MM`; year-precision emits `YYYY` | Unit test of `contentJsonLd`; spot check `articles/690` |
| RES-005 | JSON-LD author `name` equals the `citation_author` value; honorific is in `honorificPrefix` | grep both on `articles/690` |
| RES-006 | Either `citation_pdf_url` shares the abstract's directory and the file is <= 5 MB with a text layer, or the tag is absent | `curl -I` the PDF (status, size); Scholar inclusion checklist |
| RES-007 | `sitemap.xml` is an index; no `/search` URLs; no `priority`; every child file has `lastmod` | Parse with `xmllint`; submit in Search Console and compare "discovered" vs "indexed" per type |
| RES-008 | Zero U+0640 runs of length 2+ in `/ar`, `/ar/articles/690`, and the migrated titles; search results unchanged | `grep -c 'ـــ'` on the pages; search regression test on 5 queries |
| RES-009 | `/feeds/en/all.xml` channel title is English and items have `dc:creator` | `curl` and xmllint; feed validator |
| RES-010 | PDF buttons show size within 5% of `Content-Length` | Compare with `curl -I` for 3 PDFs |
| RES-011 | Year facet shows "undated (n)" where n equals the count of rows with null year | Compare with a SQL count on the copy of the DB |
| RES-012 | Doc line corrected; Zotero Connector saves an article with title, authors, date, journal | Manual Zotero test on one article and one book |
| RES-013 | A phrase present only in an issue PDF returns that issue; scanned PDFs are listed as skipped | Search test with 5 phrases; skip report |
| RES-014 | `SearchAction` absent or documented as kept | grep the home page JSON-LD |
| RES-015 | A published reuse statement and `copyrightHolder` on item JSON-LD | Page exists; Rich Results Test shows property |
| RES-016 | A documented export file with the schema in docs, or anonymous `GET /api/*` for content returns 401/404 by decision | `curl` as anonymous; schema doc link |

## 6. Task list

| Task | Finding | Status | Effort |
|---|---|---|---|
| T-RES-01 Periodical constant for citations and JSON-LD | RES-001 | BACKLOG | S |
| T-RES-02 Fix absolute-URL handling and required fields for VideoObject | RES-002 | BACKLOG | S |
| T-RES-03 Date-precision and author-name clean-up in JSON-LD | RES-004, RES-005 | BACKLOG | S |
| T-RES-04 Event minimum fields | RES-003 | BACKLOG | S |
| T-RES-05 Sitemap index and clean-up | RES-007 | BACKLOG | S |
| T-RES-06 Decision on PDF hosting vs Scholar tag | RES-006, RES-010, RES-013 | BLOCKED (waiting for the migration plan to settle `files.hadramout.center`) | M |
| T-RES-07 Kashida clean-up migration | RES-008 | BACKLOG | S-M |
| T-RES-08 Feed improvements | RES-009 | BACKLOG | S |
| T-RES-09 Undated facet | RES-011 | BACKLOG | S |
| T-RES-10 Amend benchmark doc (COinS) | RES-012 | BACKLOG | S |
| T-RES-11 Rights policy and data export | RES-015, RES-016 | BLOCKED (institutional decision) | M |
| RES-T01 Manual peer pass | section 2 | BACKLOG | S |

## 7. Corrections to existing documents

- `docs/01-audit/03-benchmark-and-best-practices.md:24` states COinS data is emitted; the code does not (RES-012). Treat this review as the correction.
- Same file, section 6 says target size >= 44 px as WCAG 2.2 AA. AA 2.5.8 requires 24x24 CSS px; 44 px is the AAA criterion 2.5.5 and the platform's own house rule.
- Same file, section 4 lists Darah, Al Owais, Brill as references; they could not be re-observed (blocked). Keep as unverified.

## 8. Ranked adopt / adapt / skip

Ranked by (impact on this platform's actual content) x (cost). "Already" rows are listed so nobody re-opens them.

| Rank | Verdict | Practice | Seen at / source | Platform state | Content types | Next step |
|---|---|---|---|---|---|---|
| 1 | ADOPT | Correct journal container in citations and Scholar tags | Google Scholar inclusion, Zotero | Wrong in production (RES-001) | article (magazine), magazine | T-RES-01 |
| 2 | ADOPT | Valid VideoObject (absolute thumbnail, `uploadDate`, `duration`) | Google Video docs | Broken URL in production and source (RES-002) | video | T-RES-02 |
| 3 | ADOPT | Precision-true dates in JSON-LD | Google Article docs, ISO 8601 | Overstated (RES-004) | article, news, magazine, book | T-RES-03 |
| 4 | ADOPT | Clean author names in `author.name` | Google Article docs | Honorifics present (RES-005) | article, book | T-RES-03 |
| 5 | ADOPT | Event required fields or no Event markup | Google Event docs | Incomplete (RES-003) | event, forum | T-RES-04 |
| 6 | ADAPT | Sitemap index per content type, no `priority`, no search URLs | Google sitemap docs | One 542 KB file (RES-007) | all | T-RES-05 |
| 7 | ADAPT | Strip kashida runs from migrated text | W3C alreq | Present in production (RES-008) | all Arabic text | T-RES-07 |
| 8 | ADAPT | Scholar-compatible PDF location, or omit the tag | Scholar inclusion | Off-host (RES-006) | magazine, book | T-RES-06 |
| 9 | ADAPT | Undated bucket in the date facet (DLME) | DLME | Silent exclusion (RES-011) | all dated types | T-RES-09 |
| 10 | ADAPT | Full-text of PDFs feeding search (Gallica / IA / Persee model) | peers; Scholar | Not indexed (RES-013) | magazine, book | after T-RES-06 |
| 11 | ADAPT | Explicit rights / reuse statement | Europeana, Wikisource, Wellcome | Only "all rights reserved" (RES-015) | all | T-RES-11 |
| 12 | ADAPT | Snapshot export instead of query API | LoC, IA, Wellcome | Undocumented public Payload REST (RES-016) | all | T-RES-11 |
| 13 | ADAPT | Richer, language-aware feeds | OpenEdition | Basic feeds (RES-009) | all | T-RES-08 |
| 14 | ADAPT | PDF type/size label | low-bandwidth rationale, own budget | Absent (RES-010) | magazine, book | after T-RES-06 |
| 15 | SKIP | COinS / unAPI | Zotero docs | Highwire tags already cover Zotero (RES-012) | all | amend doc only |
| 16 | SKIP | IIIF deep-zoom viewer | IIIF; QDL, Wellcome, Rijksmuseum | Content is text and PDF, not image collections. Revisit if manuscripts or photo archives are digitised | none today | none |
| 17 | SKIP | In-page PDF reader (pdf.js) | Gallica / IA style readers | Download + new-tab read exists (`page.tsx:199-203`); CSP has `object-src 'none'`; large PDFs on slow networks | magazine, book | none |
| 18 | SKIP | Cache Components / PPR migration | Next.js 16 caching docs | Not enabled (`next.config.ts`); custom 5-minute row cache and revalidate hooks work; migration risk with Payload and CSP inline scripts. Revisit after launch with field CWV data | all | none |
| 19 | SKIP | DOI / Crossref registration | Persee shows DOIs | A paid membership and an institutional decision; stable canonical URLs and Scholar tags already serve discovery | article, magazine | none |
| 20 | SKIP | Book actions structured data | Google Book docs | Restricted to providers with large catalogues and an interest form; platform has 53 books | book | none |
| 21 | SKIP | Review-style star markup beyond books | Google Review snippet | Already limited to books with enough approved ratings (`page.tsx:178`); Organization self-reviews are ineligible per Google | book | none |
| 22 | SKIP | Keep investing in `SearchAction` | Google blog 2024 | Dead feature (RES-014) | home | optional removal |
| Already | n/a | Faceted lists with counts and chips; unified Arabic search; citation panel (7 formats); Scholar tag set; hreflang; OG cards; Hijri display; RSS; skip links; accessibility statement | section 1 | in place | all | none |

## 9. Source list (all accessed 2026-10-18)

Standards and documentation: URLs in section 3.

Peer pages: https://www.loc.gov/ , https://www.loc.gov/apis/json-and-yaml/ , https://archive.org/advancedsearch.php , https://www.persee.fr/ , https://www.europeana.eu/en/search?query=hadramaut , https://journals.openedition.org/ , https://sanaacenter.org/publications , https://studies.aljazeera.net/ar , https://dlmenetwork.org/library (from dlme.clir.org, 301), https://ar.wikisource.org/wiki/الصفحة_الرئيسية , https://developers.wellcomecollection.org/docs/catalogue , https://www.rijksmuseum.nl/en/collection , https://gcloud.qnl.qa/en/about/news/new-qatar-digital-library-offers-readers-unrivalled-collection-precious-heritage (22 September 2016 article), search-engine listings for qdl.qa archive item titles.

Blocked or empty on 2026-10-18 (not used as evidence): qdl.qa (403), gallica.bnf.fr (403), brill.com (403), darah.org.sa (403), safahat.org (403), babel.hathitrust.org (403), wellcomecollection.org search (403), metmuseum.org (429), jadaliyya.com (no content), eap.bl.uk (empty), aco.nyu.edu (host not found), pro.europeana.eu rights page (403), loc.gov collections and item pages (403).

Production requests made: `/sitemap.xml`, `/robots.txt`, `/ar/books/37`, `/ar/articles/690`, `/ar/magazines/6`, `/ar/events/1`, `/ar/videos/1`, `/ar/forum/1`, `/ar/news/195`, `/api/books?limit=1`. Probes of `/ar/magazines/41`, `/ar/events/54`, `/ar/videos/3` and `/ar/forum/12` returned 404 (guessed ids that do not exist; the sitemap counts, not those ids, are the evidence).
