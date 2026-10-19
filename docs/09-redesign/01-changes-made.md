# Changes made — redesign v3 (2026-10-16)

Branch `claude/hadramout-redesign-refactor-52667b`. Each group is a commit; the unit suite grew from 50 to 100+ tests.

## 1. SEO, social previews and structured data
| Change | Files |
|---|---|
| `robots.txt` and the web manifest are rendered per request. They were prerendered at `docker build` with the build placeholder host, so the live robots.txt advertised the **legacy domain** as sitemap/host | `src/app/robots.ts`, `src/app/manifest.ts` |
| Title template «صفحة \| مركز حضرموت»; page part clipped so the whole `<title>` stays ≈60–70 characters; descriptions cleaned and clipped to ≈158 characters, never empty; `og:site_name` is the institution name (was its subtitle); `og:image:alt`; `article:*`/`book:*` Open Graph fields; `twitter:site` when an X profile is configured; RSS autodiscovery; paginated pages get their own canonical and a "page N" title; filtered/sorted lists are `noindex,follow` and a list narrowed to one topic canonicalises to the topic page | `src/lib/seo.ts`, `src/lib/seo-text.ts`, layout `generateMetadata` |
| **Branded 1200×630 social card for every page** — `/og/{lang}/{kind}/{id}.png` (document) and `/og/{lang}/{page}.png`. Rendered with sharp/Pango, which shapes Arabic correctly (Satori/`next/og` lays Arabic words out left-to-right, tested). Three layouts: text, portrait cover (books/issues), photo background (news). Rate-limited, LRU-cached, falls back to the static image on any error; scripts the font cannot draw fall back to the Arabic title | `src/lib/og*.ts`, `src/app/og/**`, `public/fonts/og-plex-*.ttf` (IBM Plex Sans Arabic, OFL) |
| JSON-LD: `ResearchOrganization` + `WebSite` with `SearchAction` (home); `CollectionPage`/`ItemList` on every listing, topic page and the timeline; `ProfilePage`/`Person` on author pages; `ContactPage`; richer `ScholarlyArticle`/`Book`/`PublicationIssue`/`Event`/`VideoObject` (author URLs, publisher, issue, PDF, `dateModified`). Unknown facts are omitted: no guessed attendance mode, dates or ratings; `aggregateRating` only for books with ≥3 approved reader reviews | `src/lib/jsonld.ts` |
| Google Scholar `citation_*` tags kept; sitemap now lists authors and topics via the same rules; `scripts/seo-audit.mjs` validates a running site | `scripts/seo-audit.mjs` |

## 2. Design system
Scholarly-editorial direction kept inside the Center's identity (teal `#2A836E`, gold `#C49952`, warm paper). Skills applied: `frontend-design`, `ui-ux-pro-max`, `design-system`, `design-review` (installed in `.claude/skills/`).
- Tokens: Naskh display + IBM Plex Sans Arabic UI + Source Serif 4 for Latin headings; spacing scale, three radii, two elevations, z-index scale; reader preferences (`data-fs/lh/rw`). Every text pair verified ≥4.5:1 in light **and** dark by `tests/unit/contrast.test.ts`.
- Components: list entries (articles are text-first, not boxed cards), image tiles, book/issue covers with spine shading, event rows with date blocks, video tiles, topic cards, chips, badges, segmented controls, empty/skeleton/notice states, pagination, breadcrumbs, reviews/stars.
- `content-visibility:auto` on below-the-fold home sections; no blur/backdrop effects in the header.

## 3. Shell and navigation
- **Search on every page**: header button opens a typeahead panel (WAI-ARIA combobox, arrow keys, recent searches, `/` shortcut, polite live region). Also used on home, search and 404.
- Six primary sections + «المزيد» menu (topics, forum, authors, timeline, about, contact); focus-trapped mobile drawer with theme toggle; language picker unchanged.
- Footer: newsletter band, research tools, contact, social icons.

## 4. Discovery
- **Facet engine** (`src/lib/facet-core.ts`, `facets.ts`): one compact in-memory row per document (5-minute cache, cleared on every admin save). Counts next to filters are exact — a test asserts that selecting an option returns exactly the advertised number of results.
- List pages: sidebar filters (text-in-section, topic tree, year, author, PDF, when), active-filter chips with remove links, sort, view toggle (list/compact, grid/list), URL state for everything, bottom-sheet filters on phones, no-JS fallback.
- **Topics**: two-level taxonomy (8 topics → the magazine's columns), `/topics` hub and `/topics/[id]` landing pages. Admin: parent, order, description.
- **Search v2**: type/year/author facets with counts, relevance/newest/oldest, highlights, zero-result help (popular searches, topics); exact totals.

## 5. Content templates
- Article/study: TOC with scroll-spy (desktop) and collapsible TOC (mobile), reading progress, reader settings (size, line spacing, width; remembered in the browser), permalink + APA citation box, related by transparent rules (same column → author → issue), previous/next, more by author, last-updated.
- Book/issue: cover hero, facts table, *Read PDF* and *Download PDF*, request copy, issue contents list, previous/next issue.
- Events/forum: date block, facts, **add to calendar (.ics)**, video facade. News: lead image, related news.
- **Reader reviews** (books, studies, issues): moderated (pending → approved in the admin), honeypot, rate limits, one review per item per day per client, can be switched off in site settings.
- Authors: A–Z index with letter navigation (titles such as «أ.د.» ignored for the letter), counts; author pages list books then articles with links to the filtered archive.
- Timeline: era groups, unambiguous year ranges («800 ق.م – 300 م»), per-entry **scientific review status**, source, related-study link.

## 6. Data
Migrations (applied automatically at boot by `prodMigrations`; the deploy script backs up first):
`taxonomy_reviews_timeline` (additive), `curate_topics`, `editorial_fixes` — see `02-editorial-issues.md`.

## 7. Quality gates added
`messages.test.ts` (every UI key exists), `contrast.test.ts`, `seo.test.ts`, `facets.test.ts`, `list-query.test.ts`, `timeline.test.ts`; `npm run check` = typecheck + lint + all unit tests.
