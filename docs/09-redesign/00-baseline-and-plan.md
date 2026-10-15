# Redesign v3 — baseline audit and implementation plan

**Date:** 2026-10-16 · **Live:** https://hadramout-center.novixa.dev · **Branch:** `claude/hadramout-redesign-refactor-52667b`
**Inputs:** the repository (all `.md` docs read), the live site, `hadramout_center_website_audit_and_claude_prompt.md`, the installed design skills (`.claude/skills/{frontend-design,ui-ux-pro-max,design-system,design-review,ui-styling,brand}`).

Evidence rule: every finding below was measured on the live site or read in the code on this date. Raw SEO data: `docs/09-redesign/evidence/seo-baseline.json` (`node scripts/seo-audit.mjs <url>`).

## 1. Architecture (verified)

| Layer | Fact |
|---|---|
| Runtime | Next.js 16.4 (App Router, RSC, ISR `revalidate=300`) + Payload CMS 3.90 + SQLite (libSQL) — `payload.db`; second SQLite `extras.db` for FTS5 index, counters, rate limits (schema created with `IF NOT EXISTS`, no migrations needed) |
| i18n | Arabic source, ≈90 languages machine-translated on demand; `hreflang`/index only for complete translations |
| Styling | Hand-written layered CSS (`src/styles/*.css`, `@layer reset,tokens,base,layout,components,pages,utilities,print`), logical properties, `light-dark()` tokens, self-hosted Plex Arabic + Naskh |
| Content | 909 articles, 52 books, 40 issues, 387 news, 53 events, 11 forum, 2 videos, 274 authors, 6 timeline entries, 53 article categories (flat), 0 book categories |
| Deploy | merge to `master` → CI (typecheck, lint, unit tests) → image built in CI → SSH → `deploy.sh` (pre-deploy backup, health check, rollback). Payload `prodMigrations` applies migrations at boot |
| Baseline QA | `npm run check`: typecheck ✔, ESLint ✔, 50/50 unit tests ✔ (2026-10-16) |

## 2. Baseline findings

### SEO / social (live, `scripts/seo-audit.mjs`) — 10 errors, 29 warnings on 25 URLs

| # | Finding | Severity | Evidence |
|---|---|---|---|
| S1 | `robots.txt` advertises `Sitemap: https://hadramout.center/sitemap.xml` and `Host: https://hadramout.center` — the **legacy domain**. Cause: `robots.ts`/`manifest.ts` are prerendered at build time with the Docker build placeholder `SITE_URL` | P0 | audit |
| S2 | `og:site_name` is the subtitle «للدراسات التاريخية والتوثيق والنشر», not the institution name | P0 | `seo.ts:59` |
| S3 | No `<title>` template: inner pages are titled «أخبار المركز», «المقالات والدراسات» with no brand suffix; news/video titles reach 87–106 chars | P1 | audit |
| S4 | Missing meta/OG description on `/news`, `/events`, `/videos`, `/search`; 20–36 char descriptions on `/timeline`, `/authors` | P1 | audit |
| S5 | No `WebSite` (+SearchAction) / `Organization` JSON-LD anywhere (the `orgJsonLd` helper exists but is unused); no `CollectionPage`/`ItemList` on listings; no `Person` on author pages | P1 | audit |
| S6 | No `og:image:alt`; every non-cover page shares one generic OG image (news without cover, events, authors, listings) | P1 | audit |
| S7 | `og:type` is `website` for magazine issues/events/videos (should be `book`-like/`video.other`/`website` as appropriate) and no `article:*` tags | P2 | audit |
| S8 | Sitemap: no `<lastmod>` for list pages, authors absent, no image entries; no category/topic URLs | P2 | sitemap |

### UX / information architecture
- Header search is an icon that navigates to `/search` — no persistent field, no typeahead in the shell (the `/api/hc/suggest` endpoint exists but is unused outside `/search`).
- Listing filters are four plain `<select>`s + submit button; categories exist only for articles; no author, PDF, text-in-section filters; no facet counts; no active-filter chips; no sub-categories; no taxonomy landing pages.
- Search: single-column hit list, type chips without counts, no year/author filters, no sort, zero-result page is just a sentence.
- Detail templates: toolbar is crowded (cite/share/save/print/font size in one row), meta is a bare `dl`, the TOC lives only in a sticky sidebar, no previous/next, no reading progress UI on the page (CSS exists), no citation/permalink block, no reader reviews.
- Home: seven alternating tinted sections of identical cards, HTML 134 KB (uncompressed), 6,729 px tall at 1440 px, 15 scripts.
- Timeline: 6 entries, ranges rendered without units (the audit example «800 ق.م – 300»), no review status shown beyond a banner.

### Data quality (local snapshot = production seed)
- 53 article categories are the magazine's *columns* with typos and mash-ups: «حديث الباية» (≡ حديث البداية), «درايسات» (≡ دراسات), «أضو» (≡ أضواء), «40» (an issue number), and three names containing bylines/case-specific text. 142 articles have no category. Books have no categories.
- Author labels, magazine issue-41 description and the «عن بعنوان» event title from the audit file are checked in `docs/09-redesign/02-editorial-issues.md`.

## 3. Design direction (after reading the skills)

Keep the institution's identity (ADR-09: teal `#2A836E` + gold `#C49952` on warm paper) and evolve it from "SaaS card kit" to a **scholarly editorial** system:

- **Structure over decoration** (frontend-design): fewer tinted bands; sections separated by whitespace and rules that carry meaning; one memorable element — the *issue cover shelf* and the lattice header — everything else quiet.
- **Type** (ui-ux-pro-max, typography): IBM Plex Sans Arabic for UI; Noto Naskh for long reading; display headings use the same Plex at a tighter scale; line-height 1.9–2.0 for reading, 65–70ch; no letter-spacing on Arabic.
- **Components with one language**: 8px-based spacing, three radii (6/12/20), two elevations, one icon set (SVG, 1.75 stroke), 44 px targets, 3 px focus ring.
- **Navigation**: all primary sections visible ≥1100 px, persistent search with typeahead, mega "المزيد" for secondary, bottom-sheet filters on mobile.
- **Accessibility** (WCAG 2.2 AA): skip links, landmark order, `aria-current`, focus not obscured by the sticky header (`scroll-padding`), reduced motion, no colour-only meaning, `dir="auto"` for mixed content.

## 4. Implementation plan

| Phase | Scope | Acceptance |
|---|---|---|
| A — SEO foundation | runtime `robots`/`manifest`; title template; site-name OG; per-page descriptions; Organization+WebSite+CollectionPage+Person JSON-LD; `og:image:alt`; **dynamic branded OG images** (`/og/…`, sharp + Pango, Arabic-correct); sitemap lastmod/authors/topics; `noindex` rules for filtered/paginated | `scripts/seo-audit.mjs` 0 errors; unit tests for metadata builders |
| B — Design system | tokens, type scale, buttons, chips, cards (article/news/book/issue/event/video/author), page head, breadcrumbs, pagination, forms, empty/error/skeleton states, footer, print | visual check at 360/390/768/1280/1440, light+dark, RTL+LTR; axe 0 serious |
| C — Shell | header with persistent search + typeahead, mega-menu, mobile drawer, language/theme controls, top utility bar | keyboard + screen-reader pass; no overflow ≤360 px |
| D — Discovery | facet index (cached), list pages with sidebar filters, chips, counts, sort, view toggle, URL state, pagination; **topics** (categories → sub-categories) with landing pages `/topics`, `/topics/[id]`; search v2 (type facets with counts, year/author filters, sorting, highlight, zero-result help) | unit tests for facet logic + Arabic normalisation; URL-state tests |
| E — Content templates | article/study, book, issue (table of contents), news, event/forum, video, author; reading tools; citation block + permalink; related + prev/next; reader reviews (moderated) with aggregate rating only when real | metadata completeness per template; JSON-LD valid |
| F — Home & institutional pages | new home composition; timeline with eras, review status and filters; authors A–Z; saved; contact; 404 with search; accessibility statement updated to measured facts | axe + Lighthouse |
| G — Data & governance | taxonomy migration (parents + safe typo merges), data-quality script, editorial issue report | report in docs; migration tested on a copy of the DB |
| H — Verify & ship | `npm run check`, `npm run build`, axe, Lighthouse, SEO audit on local build; PR → CI → merge → deploy; live re-audit | final QA report with before/after numbers |

Out of scope (documented, not built): logins, public uploads, AI summaries, PWA offline caching of PDFs, Cloudflare cache rule (needs the owner's token — see TRACKER).
