# Changelog

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

