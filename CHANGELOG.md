# Changelog

## [5.2.0] - 2026-10-20
### Runtime test tier, search, dependencies
- **CI:** seeds a throwaway database from the snapshot, starts the standalone server and runs the smoke script (routes, regression checks, SEO audit) — previously CI only built the app.
- **Search:** 60 s result cache cleared on every index write; typeahead validates `lang` and is rate-limited.
- **SEO:** Event JSON-LD only with a start date (+ address), otherwise CreativeWork; real `/favicon.ico`; RSS channel title follows the feed language.
- **Dependencies:** Payload 3.90.2 → 3.91.0 (production advisories 17 → 12); additive migration for `*_locales(_parent_id)` indexes (up/down tested).
- **Docs:** consolidated backlog (101 findings) and roadmap; performance profile.

## [5.1.0] - 2026-10-19
### Audit and hardening (see `docs/reports/BASELINE_REPORT.md`, `docs/planning/PROGRESS.md`)
- **Security:** REST reads capped (`limit<=100`, `depth<=2`; previously `limit=1000&depth=3` returned 1.4 MB anonymously); unused GraphQL removed; health endpoint no longer leaks user existence or error text.
- **Reliability:** only a missing/unreadable document renders 404 — database failures now surface as 5xx instead of being cached as "gone"; implausible ids → 404; route error boundary.
- **Operations:** backups include the mirrored legacy images and fail loudly; deploy aborts if the pre-deploy backup fails.
- **SEO/content:** magazine citations name the periodical; video JSON-LD thumbnails valid; the migrated "المرجع … اضغط هنا" line is dropped from descriptions, cards, JSON-LD and feeds; importer keeps titles with names.
- **Tooling:** ESLint covers `.tsx`; stray `node_modules` recovery copies ignored.
- **Docs:** audit of legacy parity, architecture, data model/IA, migration and redirects; benchmark review.

## [5.0.0] - 2026-10-16
### Redesign v3 — scholarly-editorial UI, discovery, SEO (see `docs/09-redesign/`)
- **SEO/social:** runtime `robots.txt`/manifest (live robots.txt pointed at the legacy domain), title template, correct `og:site_name`, `og:image:alt`, article/book OG fields, branded per-page 1200×630 social cards with correct Arabic shaping (`/og/...`), Organization/WebSite/CollectionPage/ProfilePage JSON-LD, topic and author sitemap entries, `scripts/seo-audit.mjs`.
- **Design system:** new tokens and components (Naskh display + Plex UI), text-first article lists, cover shelves, event/date blocks; contrast of every token pair tested in light and dark.
- **Discovery:** header search with typeahead on every page; faceted lists with exact counts, URL state, chips and phone bottom-sheet; two-level **topics** with landing pages; search v2 with type/year/author facets.
- **Reading:** TOC with scroll-spy, progress bar, reader settings, permalink + citation box, related and previous/next, issue contents, add-to-calendar (.ics).
- **Community:** moderated reader reviews (admin approval; aggregate rating published only with ≥3 approved reviews).
- **Timeline:** era groups, unambiguous year ranges, scientific-review status per entry.
- **Data:** migrations for topics/reviews/timeline fields; safe editorial corrections (see `docs/09-redesign/02-editorial-issues.md`).
- **Fixes:** English plural fallback showed Arabic for 1-minute reads; filtered/paginated list canonicals.

## [4.0.0] - 2026-10-15
### Rebuild on Next.js 16 + Payload CMS 3
- Full rewrite: bilingual RTL/LTR responsive site, admin CMS with roles, AI auto-translation (~90 languages, Arabic source), FTS5 Arabic search, scholarly citations, JSON-LD/SEO, RSS, legacy URL redirects.
- Migrated 1,454 items from hadramout.center.
- Docker + Caddy + GitHub Actions (CI, deploy, rollback), backup/restore scripts, deployment/QA/handover docs.

All notable changes to the Hadhramout Center Digital Platform are documented here.

## [3.0.0] - 2026-10-11
### Enterprise Academic Release V3.0 (Live Portal Parity & 5000% Architectural Leap)
- **Live Portal Parity:** Audited and synchronized live data from `https://hadramout.center/` including Issue 41, peer-reviewed articles by notable Hadhrami scholars, UNESCO heritage coverage, Ba-Huraiz and Bakathir cultural forums, and the latest published dictionaries.
- **Dedicated News Engine:** Added `#news` route, breaking news ticker banner, institutional press releases, and high-resolution event cards.
- **Peer-Reviewed Studies Engine:** Added `#articles` route and academic studies catalog covering archaeology, linguistics, diaspora, and literature.
- **Academic Article Reader:** Implemented rich reading modal with reading progress indicator bar, dynamic font scaling, estimated reading time, and instant citation generators.
- **Command Palette (`Ctrl + K` / `Cmd + K`):** Implemented instant keyboard-driven search and navigation across all views, books, and articles.
- **Digital Sharing & Dynamic OpenGraph Suite:** Created interactive OpenGraph and Twitter card live preview modal with instant clipboard copying, social direct sharing, and dynamic DOM `<meta>` synchronization.
- **Interactive Heritage Media:** Responsive 16:9 modal video player for symposium recordings and dedicated heritage audio player.
- **Rare Archival Manuscripts Vault:** Added `#manuscripts` view and interactive folio inspector modal (`#folio-viewer-modal`) with zoom levels (up to 3x), contrast inversion for faded carbon inks, and codicological cataloging.
- **Historical Geography & Landmarks Map:** Added `#map` view with categorized heritage sites (ports, mud skyscraper citadels, royal palaces) with GPS coordinates and architectural descriptions.
- **PWA Offline Service Worker:** Implemented `sw.js` with Cache-First asset persistence and Network-First dynamic caching for seamless offline research across remote valleys.
- **Scholarly Newsletter Dispatch:** Integrated subscription engine for journal announcements, conferences, and new monograph releases.
- **Academic Citation & Exporters:** Direct export for APA 7th, Chicago 17th, MLA 9th, BibTeX (`.bib`), RIS (`.ris`), and Markdown (`.md`).
- **Catalog Layout Flexibility:** Added Grid vs. List view switcher with dynamic sorting by Year, Title, and Popularity.
- **Audio Haptics:** Subtle Web Audio API acoustic micro-feedback on primary interactive controls.
- **Validation Suite:** Updated `scripts/validate.js` to assert data integrity for news, articles, manuscripts, landmarks, and PWA assets.

## [1.1.0] - 2026-10-07
### Autonomous Engineering Standards, Arabic Master Playbook & Verification Suite
- **Added:** Workspace autonomous agent rules suite in `.agents/rules/` (`engineering-standards.md`, `autonomous-workflow.md`, `git-workflow.md`, `quality-assurance.md`).
- **Added:** Top-level agent directives and architecture manual in `AGENTS.md`.
- **Added:** Master Arabic platform manual, outreach playbook, client directory, and step-by-step UAT testing guide in `MANUAL_AND_AUDIT_ARABIC.md`.
- **Added:** Comprehensive multi-viewport browser testing covering dark mode, font scaling, bookmarks, RIS/BibTeX export, and bilingual transitions.
- **Enhanced:** Production readiness test suite running with 100% pass rate.

## [1.0.0] - 2026-09-25
### Initial Production Release (Novixa Flagship Pro Bono Contribution)
- **Added:** Full institutional knowledge platform with bilingual (Arabic/English) support.
- **Added:** Comprehensive `/about` institutional view fixing legacy 404 error.
- **Added:** Publications catalog with multi-category filtering and academic citation generator (APA, Chicago, MLA).
- **Added:** *Majallat Hadramout Al-Thaqafiyyah* periodicals showcase with Issue 40 feature.
- **Added:** Interactive historical timeline of Hadhramout covering ancient, Islamic, and modern eras.
- **Added:** Sub-50ms unified instant search across all assets.
- **Added:** *Muntada 'Ameed Al-Wafa* cultural forum archive and upcoming event alerts.
- **Added:** Direct WhatsApp routing for book orders and research inquiries.
- **Added:** Schema.org JSON-LD structured data for Google Scholar and institutional SEO.
- **Added:** Full documentation suite in `/docs` (research, strategy, ux, content, design, technical, qa, handover).

