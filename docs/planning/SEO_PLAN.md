# SEO, social cards and discoverability — audit and plan

**Audit date:** 2026-11-20, live staging `hadramout-center.novixa.dev` (26 routes: home ar/en, every listing, a book, an article, the platforms, about/support/contact) plus the code (`src/lib/seo.ts`, `src/lib/jsonld.ts`, `src/app/sitemap.xml`, `src/app/og`).
**Related:** [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md) · [move runbook](../05-deploy/03-move-to-new-host-and-domain.md) · `scripts/seo-audit.mjs` (runs in `npm run smoke`, 0 errors) · `scripts/cutover-check.mjs`.

## 1. What is already right (verified)

| Area | State |
|---|---|
| Indexing switch | Staging sends `X-Robots-Tag: noindex` + meta robots and a robots.txt without sitemap; `SITE_ENV=production` on the final host flips all of it (asserted in smoke and cutover-check) |
| Titles and descriptions | One `<h1>` and one description on every audited route; titles "page \| مركز حضرموت" |
| Canonical and languages | Canonical on every page; `hreflang` ar, en and `x-default` (→ ar). Only ar and en are indexable (`INDEXABLE_LANGS`): machine translations into other languages are served to people but not offered to search engines as duplicates |
| Social cards | Server-made 1200 × 630 PNG per page and per document (Arabic shaping correct), `og:image:alt`, `og:locale` + alternates, `twitter:card=summary_large_image`, `twitter:site`; articles use their own illustration when they have one |
| Structured data | `ResearchOrganization` + `WebSite` with `SearchAction` (home); `ScholarlyArticle`, `Book`, `Person`, `Event` (with a start date), `CollectionPage`/`ItemList`, `ContactPage`, `BreadcrumbList`; `citation_*` meta for Google Scholar and Zotero |
| Crawl hygiene | Sitemap with every indexable page and language alternates; `noindex` on search, saved list, account, filtered listings and empty sections; list pages past the last page are 404; 1,603 legacy URLs 301 to their new pages; RSS per section, topic and author; IndexNow |
| Speed | Lighthouse CI median mobile 90–94, desktop 100, SEO 100 (2026-10-29) |

## 2. Fixed in this pass (2026-11-20)

| Finding | Fix |
|---|---|
| `/announcements`, `/partners`, `/testimonials`, `/audio` had no `BreadcrumbList` while every sibling listing did | `src/components/CrumbsJsonLd.tsx` on all four |
| Home `og:image:alt` repeated the site name ("… — أرشيف رقمي مفتوح — مركز حضرموت …") | a title that already names the site is not suffixed again (`src/lib/seo.ts`) |
| Promotions could hurt rankings if done the usual way | no interstitial on arrival, bottom sheet on phones, no layout shift (CLS 0 measured), partner links `rel="sponsored"`, crawlers see the same page ([PROMOTIONS_DESIGN](PROMOTIONS_DESIGN.md)) |

## 3. Plan

### Launch (blocks indexing; owner and Center)
1. Final domain and host, then `SITE_ENV=production` and `SITE_URL` on that host only; recreate the container; `node scripts/cutover-check.mjs https://<domain>`.
2. Google Search Console and Bing Webmaster: set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`, submit `/sitemap.xml`, request indexing of the home page and the main sections.
3. 301 from the old domain (`hadramout.center`) keeps working on the new host (redirect matrix in smoke).
4. Cloudflare HTML cache rule + purge token (PERF-T4): the main real-world speed gain.

### After launch (first month)
5. Watch Search Console coverage, Core Web Vitals (field data is the only valid LCP judge) and the zero-result searches in `npm run quality`.
6. Editorial: alt text for the 4,004 images in article bodies (list in the quality report); summaries for the documents that still use generated excerpts.

### Improvements we can build (no outside input)
7. `Event` structured data for dated announcements with a venue (eligible for event rich results). Small.
8. `Book` → `offers` (price, availability) for books sold in the store, once the Center sets prices. Small.
9. `ItemList` of `Organization` on `/partners`. Small, low value.

### Decisions for the Center
10. **AI crawlers** (GPTBot, ClaudeBot, Google-Extended…): today all are allowed. Allowing helps the archive appear in AI answers (the meeting asked for AI visibility); blocking keeps the texts out of model training. Recommended: allow, since the mission is access to Hadhrami history.
11. A short `/llms.txt` describing the archive's sections for AI tools: cheap, optional, not a ranking factor.
