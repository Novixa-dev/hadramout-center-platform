# سجل التعديلات والتحديثات للمشروع
## Project Modernization Changelog (Stage A & Beyond)

All notable changes to the Modernization Initiative for the Hadhramout Center Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to Semantic Versioning.

---

## [Stage B — Implementation: Foundation, Page Builder & SEO] — 2026-10-31

### Phase Status
- **`STAGE B IN PROGRESS — OWNER AUTHORIZED`**
- All changes verified locally with `npm run check` (210 unit tests passing across 38 suites, 0 TypeScript errors, 0 ESLint warnings, `knip` clean).

### Added
- **Author Honorifics & Clean Data Pipeline (`DAT-001`):**
  - Added localized `honorific` field to `Authors` collection schema in `src/collections/Authors.ts`.
  - Created and applied SQLite migration `src/migrations/20261031_025843_add_author_honorific.ts`.
  - Developed and executed non-destructive migration script `scripts/clean-authors-honorifics.mjs` separating academic prefixes (`أ.د.`, `د.`, `الشيخ`, `الباحث`, `القاضي`, `م.`) across 73 author records, restoring author 159 (`عبدالله عبدالرحمن بكير`) from article 424 metadata, and preserving foreign patronymics (`م.أ. رودينوف`).
  - Updated frontend presentation (`Cards.tsx`, `[section]/[id]/page.tsx`) to show honorifics, while keeping alphabetical facets and citations clean.
  - Added Schema.org Person `honorificPrefix` property to `src/lib/jsonld.ts`.
  - Added unit test suite `tests/unit/author-honorifics.test.ts`.
- **Partners & Testimonials System (`PRT-001`):**
  - Created `Partners` and `Testimonials` collections with `hasWrittenConsent` privacy safeguard.
  - Applied SQLite migration `src/migrations/20261031_024246_add_partners_and_testimonials.ts`.
  - Built `src/components/PartnersSection.tsx` and integrated it into `/about` via `src/components/StaticPage.tsx` using `listApprovedPartners` and `listApprovedTestimonials`.
  - Added unit test suite `tests/unit/partners.test.ts`.
- **Submissions Policy & Guidelines Page (`SUB-001`):**
  - Created scholarly submission guidelines page at `src/app/(site)/[locale]/submit/page.tsx` with full bilingual parity.
  - Documented publishing standards for *Hadhramout Cultural Magazine*, double-blind peer review rules, citation guidelines (APA/Chicago), word counts, and research ethics.
  - Added transparent staging notice explaining direct digital file upload status under DEC-09.
- **Conference Tracks, Chairs & Papers (`EVT-002`):**
  - Expanded `eventFields` in `src/collections/content.ts` with `tracks` (array of title and description), `chairs` (localized session chairs text), and `papers` (array of paper title, researcher, abstract, fileUrl, and media upload).
  - Generated and applied SQLite migration `src/migrations/20261031_014604_add_event_tracks_and_papers.ts`.
  - Added frontend rendering in `src/app/(site)/[locale]/[section]/[id]/page.tsx` with styled track cards and research paper download buttons.
  - Added unit test suite `tests/unit/event-tracks.test.ts`.
- **Scholarly Arabic Assistant & Punctuation Normalizer (`I18N-001`, `I18N-003`):**
  - Created `src/lib/arabic-assist.ts` with `normalizeScholarlyArabic` and `auditScholarlyArabic` (handling space attachment for Arabic punctuation, curly brackets « », duplicate mark deduplication, and Latin punctuation normalization).
  - Created API route `src/app/api/hc/editorial-assist/route.ts` for asynchronous editorial suggestions.
  - Added scholarly typography assistant button (« » Clean) to `HtmlField.tsx` toolbar for rich-text editing in the admin panel.
  - Added unit test suite `tests/unit/arabic-assist.test.ts`.
- **Stale Translation Tracking & Warnings (`I18N-002`):**
  - Updated `trackManualEdits` in `src/hooks/content.ts` to automatically flag existing translations as `stale: true` when the Arabic source text is updated.
  - Enhanced `trInfo` in `src/lib/data.ts` to expose `stale: boolean`.
  - Added alert banner in `src/components/client/TrBanner.tsx` and bilingual messages (`tr.stale`) notifying readers when viewing a translation whose Arabic source was subsequently modified.
- **Audio & Podcast Archive Collection (`MED-002`):**
  - Created `src/collections/Audio.ts` with fields for audio file upload, external streaming URL, presenter, series/program, duration, cover, and transcript.
  - Added audio MIME types (`audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/wav`, `audio/webm`) to `src/collections/Media.ts`.
  - Generated and applied SQLite migration `src/migrations/20261031_020508_add_audio_and_announcements.ts`.
- **Official Announcements & iCalendar Generation (`MED-003`):**
  - Created `src/collections/Announcements.ts` supporting `pinned` announcements, `expiresAt` auto-dismissal, event deadlines, and attachments.
  - Created `src/lib/ical.ts` generating RFC 5545 compliant `.ics` calendar events with escaped text, UIDs, and UTC timestamps.
  - Implemented `.ics` download endpoint at `/api/hc/ics/[section]/[file]` (and `/api/hc/calendar/[type]/[id]`).
  - Added unit test suite `tests/unit/ical.test.ts`.

### Added
- **Page Builder Schema (`CMS-001`):** Added `PAGE_BLOCKS` supporting 11 reusable block types in `src/collections/page-blocks.ts`:
  - `hero`, `richText`, `sectionHeading`, `textWithImage`, `cardGrid`, `quoteCallout`, `mediaEmbed`, `fileDownload`, `statsStrip`, `accordionFaq`, `ctaBox`.
  - Added `tabs` to `src/collections/Pages.ts`: Content & Blocks, SEO & Social, Navigation & Placement.
  - Implemented SQLite migration `src/migrations/20261031_011621_add_page_blocks.ts` and registered it in `src/migrations/index.ts`.
- **Frontend Block Renderers (`CMS-002`):** Created accessible, responsive React components in `src/components/blocks/`:
  - `HeroBlock.tsx`, `RichTextBlock.tsx`, `HeadingBlock.tsx`, `TextWithImageBlock.tsx`, `CardGridBlock.tsx`, `QuoteBlock.tsx`, `MediaEmbedBlock.tsx` (utilizing `VideoFacade` for cookie-free YouTube loading), `DownloadBlock.tsx`, `StatsBlock.tsx`, `AccordionBlock.tsx`, `CtaBlock.tsx`, and the master dispatcher `PageBlocks.tsx`.
  - Updated `src/components/StaticPage.tsx` to render page blocks when present, while retaining backwards compatibility for legacy text bodies.
- **Navigation Placement (`CMS-003`):** Added `navPlacement`, `navOrder`, and `navLabel` to `Pages.ts` schema and database.
- **Live Preview (`CMS-004`):** Configured Payload live preview with responsive breakpoints (mobile 390px, tablet 768px, desktop 1440px) and draft querying in `src/lib/data.ts` and `src/components/StaticPage.tsx`.
- **Custom SEO & Social Metadata (`SEO-001`):** Added `metaTitle`, `metaDescription`, `ogImage`, and `noindex` fields to `Pages.ts`, integrated into `src/app/(site)/[locale]/[section]/page.tsx`.
- **Dynamic Social Card Generation (`SEO-002`):** Enhanced `staticPageCard` in `src/lib/og-data.ts` to load custom `ogImage` buffers with Sharp and reflect customized `metaTitle` / `metaDescription`.
- **Interactive Quote Share (`SEO-003`):** Enhanced `ShareMenu` in `src/components/client/Tools.tsx` to automatically capture highlighted text quotations when sharing to WhatsApp, Telegram, and X with attribution.
- **IndexNow Protocol Client (`SEO-004`):** Built `src/lib/indexnow.ts` and `src/app/api/indexnow/key/route.ts` for instant search engine indexing pings on production launches.
- **Unit Tests:** Added `tests/unit/page-blocks.test.ts` (4 new tests) and `tests/unit/indexnow.test.ts` (2 new tests), raising test suite total to 191 unit tests.

### Changed
- **Local Environment (`ENV-001`):** Ran `npm ci` cleanly, seeded local database (1,454 items) and rebuilt full-text index.
- **Novixa Partner Link (`NAV-001`):** Changed footer external link to internal route `/ar/novixa` with contextual labels (`الشريك التقني (نوفكسا)` / `Technical Partner (Novixa)`) in `Shell.tsx` and i18n message catalogs.
- **Events Count Parity (`EVT-001`):** Decoupled `nForum` from homepage events card in `src/app/(site)/[locale]/page.tsx`, so it displays 53 events, perfectly matching `/ar/events`.
- **Local Media Streaming (`MED-001`):** Routed PDF downloads through `/legacy-media/...` in `src/app/(site)/[locale]/[section]/[id]/page.tsx`, raised streaming limit to 100MB in `src/app/legacy-media/[...path]/route.ts`, and updated `scripts/import-images.ts` to pre-cache PDFs.
- **Reviewer Field Access (`src/collections/shared.ts`):** Enhanced `lockForReviewers` to safely recurse into `tabs`.

---

## [Stage A — Discovery & Planning] — 2026-10-31

### Phase Status
- **`STAGE A COMPLETE`**
- All 20 comprehensive planning and auditing deliverables created in `docs/modernization/`.
