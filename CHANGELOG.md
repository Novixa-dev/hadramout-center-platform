# Changelog

## [5.11.0] - 2026-10-25
### Undated bucket in the year facet, social cards v3, parity and peer review
- **Year facet:** an "Undated" option (with its count) so documents without a reliable date no longer vanish from the filter (RES-011); `?year=undated`.
- **Social cards v3:** over a photo the title is confined to the lower two or three lines so the picture stays visible; card URLs carry the design revision (`?d=3`) so 30-day edge caches fetch the new look.
- **Docs:** [parity and peer review](docs/research/PARITY_AND_PEER_REVIEW_2026-10-24.md) — legacy-site parity, what peers do, guard rails, next ideas.

## [5.10.0] - 2026-10-24
### Clearer social cards, loading feedback, responsive guard, dead-code clean-up
- **Social cards (OG):** photos are no longer blurred or dimmed (only the header and the title area are shaded) and the title sits at the bottom so the picture stays visible; book and issue covers are larger (318×477).
- **Loading feedback:** every busy button (contact, newsletter, review forms) shows a spinner and `aria-busy`.
- **Responsive guard:** a browser journey checks 20 pages at 320, 360, 768 and 1024 px for horizontal overflow; it found and fixed the English header at 320 px.
- **Clean-up:** knip (configured entry points) finds no unused files or dependencies; 17 dead exports/types and their imports removed (language negotiation duplicate, engine factory, unused date/html helpers…); `npm run knip` runs in CI.
- **Tooling:** `scripts/sync-branches.sh` fast-forwards every `claude/*` branch to `master` and refuses to touch unmerged work.

## [5.9.0] - 2026-10-24
### Books list view, "About" sections, light-theme review, footer and 404 polish
- **Books:** a list view (rows with cover, author, year, PDF badge and the first lines of the description) next to the grid; book and issue pages get an "About this book / issue" section heading.
- **Light theme:** every page type reviewed at 390 and 1440 px; no changes needed.
- **Footer:** the two WhatsApp numbers show their city so they are told apart; the 404 page's English line is quieter.

## [5.8.0] - 2026-10-24
### Search and filters in every section, modern sidebar, loading states, UI review fixes
- **Search inside every section:** a prominent search bar above the results of news, articles, books, issues, events, forum and videos (issues and videos had no search at all). Enter or the button applies it, a chip and a clear button show it, `/` and the global search are unchanged.
- **Filters panel:** a card with an active-filter badge and a "clear" link, highlighted selected options, count pills, find-as-you-type inside long lists (authors, now the top 40), phone bottom sheet unchanged. Fix: the sort menu and search box live outside the filter form and are now handled through their `form` attribute (clean URLs, no `sort=newest`).
- **Motion and loading:** result cards rise in with a short stagger, a progress bar at the top while a page or filter loads (disabled by the reduced-motion rule). A `loading.tsx` skeleton was tried and rejected: streaming sends status 200 before `notFound()` runs, which made missing pages soft 404s (caught by the smoke tier).
- **UI review of 26 page types (390/1440 px):** article byline icons, centred reading column, videos list layout, contact form width, theme-aware cover placeholder, authors index, topics card, hero skyline, `/en` phone overflow.
- **SEO/OG:** per-author social card; sitemap without `<priority>` (tested builder); video pages `og:type video.other`.
- **Tests and CI:** browser journeys (52 checks incl. section search) and a sitemap sweep run in CI; a live-check workflow after every deploy and daily.
- Books still have no category facet: none of the 52 books has a category yet (editorial input needed).

## [5.7.0] - 2026-10-21
### Browser tests run in CI
- CI's smoke tier now runs `scripts/e2e.mjs` (41 checks in real Chrome) and `scripts/site-sweep.mjs` (77 sampled pages, 120 links) against the built server; server logs are uploaded when it fails. Locally: `RUN_E2E=1 npm run smoke`.
- e2e page loads allow a cold server 45 s and retry once on a timeout (the first request to a page renders and caches it).

## [5.6.0] - 2026-10-21
### Browser tests, search fix, social previews, book page
- **Fix:** pressing Enter or the button in the header search panel did nothing (the panel closed and unmounted the form before its native submit). The form now navigates explicitly. Found by the new browser journeys.
- **Browser tests:** `scripts/e2e.mjs` (puppeteer-core, real Chrome): defaults and theme, search, article tools and offline reading through the service worker, mobile menu focus, skip link, language switch, contact and admin login pages, clean console on 12 pages. `scripts/site-sweep.mjs`: stratified sitemap sample (status, title, description, canonical, one h1, lang/dir, alt text, JSON-LD, og:image, leaked text) plus a link check.
- **Social previews:** video pages are `og:type video.other` with `og:video` (privacy-friendly embed) only when the item really has a YouTube id. `scripts/seo-audit.mjs` now verifies that generated cards are real 1200x630 PNGs, og:type per template, twitter:image and article:modified_time.
- **Book pages:** a labelled WhatsApp request button, a plain "publication year not stated" text instead of the bibliographic "د.ت." on cards and in the facts list (citations keep "n.d."), smaller cover on phones.

## [5.5.0] - 2026-10-21
### Deploy hardening, honest performance reporting, review notices
- **Fix:** the Docker image build failed because the new `prepare` hook script needed repo files that the `deps` stage does not have (staging was never affected: the build failed before shipping). `prepare` is now self-contained; CI builds the production image on every PR so Docker-only failures are caught before merge.
- **Preview notices:** About, privacy and terms say they await the Center's approval (preview only).
- **Workflow:** `CLAUDE.md`, pre-commit gate (`npm run check`), `security-reviewer` and `arabic-ux-reviewer` subagents, `hadramout-release` skill, research note on official Claude Code and Google guidance.
- **Performance:** Lighthouse workflow on a clean runner (median of 3). Finding: the site scores 92–95 with TBT < 100 ms; the "LCP ≈ 3 s" is Lighthouse's model (observed ≈ 0.2 s) — the report now shows both and judges only measured values. A font-preload experiment was A/B tested and rejected.
- **Roadmap:** launch gates G1–G11 with owners and verification.

## [5.4.0] - 2026-10-21
### Staging safety and the move to a new host/domain
- **Staging-safe by default:** `SITE_ENV` (unset = staging) → `X-Robots-Tag: noindex, nofollow, noarchive` on every response, meta robots noindex, robots.txt without sitemap and without `Disallow`, visible "preview version" banner. `SITE_ENV=production` is the explicit launch switch. Both modes are asserted in the smoke tests.
- **`scripts/cutover-check.mjs`:** verifies a deployment from outside (host consistency of canonical/hreflang/OG/sitemap/RSS, indexing mode, redirects, headers, health, REST cap); runs in CI against the production-mode server.
- **Docs:** move runbook (Arabic) with decisions, couplings, phases, rollback; `deploy/standalone-host/` Caddy templates (untested until the first real host); client requirements checklist and meeting agenda (Arabic).
- **Tooling:** the smoke script clears runtime page caches before running.

## [5.3.0] - 2026-10-20
### Dark default, researcher tools, offline, quality tooling
- **Defaults:** dark theme rendered by the server (no flash, works without JS; visitor choice persists); Arabic stays the default regardless of the browser language.
- **Researchers:** copy with attribution, open catalogue export (`/api/hc/catalog`, CSV/JSON), saved list exports RIS/BibTeX/CSL-JSON, per-topic and per-author RSS.
- **Accessibility:** high-contrast mode (`prefers-contrast: more`, AAA tokens) and forced-colors support.
- **Operations:** maintenance mode (`MAINTENANCE_MODE=1`), offline support for saved articles (service worker), `npm run quality` editorial report.
- **Fix:** `/api/hc/catalog?type=constructor` returned a 500 (now 400).
- **Docs:** feature plan, security review, launch asset drafts.

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

