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
- **Dynamic CMS Navigation, AI Auto-Fill, Admin Home Nav & Live Preview Fixes (`ADM-002`, `NAV-003`, `PRV-001`):**
  - **Dynamic CMS Navigation Integration (`NAV-003`):**
    - Added `listNavPages(locale)` in `src/lib/data.ts` to fetch published CMS pages with custom placement.
    - Updated `src/components/Shell.tsx` and `src/app/(site)/[locale]/layout.tsx` so pages configured with `navPlacement: 'dropdown'` automatically display under the "المزيد" dropdown menu and in mobile navigation, `navPlacement: 'primary'` in the main header bar, and footer placements in their respective columns, sorted by `navOrder`.
  - **Admin Home Sidebar Navigation Link (`ADM-002`):**
    - Created `src/admin/components/NavHomeLink.tsx` and registered it in `src/payload.config.ts` via `admin.components.beforeNavLinks` to provide a dedicated, styled "الرئيسية (لوحة التحكم)" / "Dashboard (Home)" link at the top of the admin sidebar.
  - **Live Preview & Framing Resolution (`PRV-001`):**
    - Configured `preview` function and improved `livePreview.url` handling in `src/collections/Pages.ts`.
    - Added conditional CSP and `X-Frame-Options: SAMEORIGIN` headers for `?preview=1` requests in `src/proxy.ts`, allowing same-origin framing so Live Preview renders without CSP blocks.
  - **AI Content Auto-Fill & Smart Editorial Tools:**
    - Expanded `src/app/api/hc/editorial-assist/route.ts` with dedicated actions: `auto-fill-seo`, `auto-fill-lead`, `academic-template`, and `translate`.
    - Created `src/admin/fields/AiEditorialBar.tsx` client component integrated into page editing with 4 instant actions (Auto-Fill SEO, Extract Lead, Academic Template, Translate Draft).
    - Added academic template inserter (`📜`) and editor translation tool (`🌐`) to `HtmlField.tsx` toolbar.
- **Modernized Editorial Experience, Dashboard, Page Builder & SEO Controls (`ADM-001`, `PAG-001`, `SEO-001`):**
  - **Pages Collection & Form Modernization:**
    - Upgraded `src/collections/Pages.ts` with structured tabs (`Content & Hero`, `SEO & Social`, `Navigation & Placement`) and comprehensive sidebar controls (`slug`, `status`, `publishedAt`, `scheduledPublish`, `editorialNotes`).
    - Added localized `lead` (prominent hero subtitle/overview) and `badge` (hero category badge).
    - Added `heroLayout` (`standard`, `centered`, `banner`, `split`, `minimal`) and `heroImage` (`upload` relation to `media`).
    - Added `schemaType` (`WebPage`, `AboutPage`, `ContactPage`, `ItemPage`, `CollectionPage`) for semantic rich snippet indexing.
    - Added `showBreadcrumbs` toggle with frontend integration in `src/components/StaticPage.tsx` and `src/components/PageHead.tsx`.
    - Created and applied SQLite migration `src/migrations/20261031_070000_enhance_pages_schema.ts`.
  - **Live Search & Social Card Preview (`SerpPreview.tsx`):**
    - Developed reactive client component `src/admin/fields/SerpPreview.tsx` displaying real-time Google SERP preview (Desktop/Mobile viewports) and OpenGraph 1200×630 social card preview.
    - Integrated dynamic character counter bars with color status feedback for SEO title (0-60 chars) and meta description (0-155 chars).
  - **Enhanced Scholarly Rich-Text Editor (`HtmlField.tsx`):**
    - Integrated live editorial statistics footer: word count, character count, and estimated reading time.
    - Added traditional scholarly quotation helper (`« »`) for automatic wrapping or insertion.
    - Added sequential scholarly footnote / citation inserter (`[1]`).
    - Added fullscreen distraction-free focus mode (`⛶`).
    - Added visual feedback alerts upon normalizing scholarly typography.
  - **Modernized Admin Dashboard (`EditorialDashboard.tsx` & `custom.scss`):**
    - Added animated Quick Actions creation bar (`+ صفحة جديدة`, `+ مقال أو دراسة`, `+ حلقة بودكاست`, `+ إعلان رسمي`, `+ خبر صحفي`).
    - Expanded overview table to include all 11 content collections (`news`, `articles`, `books`, `magazines`, `events`, `forum-events`, `audio`, `videos`, `announcements`, `partners`, `pages`).
    - Built interactive `ScholarlyNormalizerWidget.tsx` for one-click Arabic text and punctuation auditing and clipboard copying directly from the admin dashboard.
    - Implemented modern micro-interactions, subtle hover card lifts, refined status tags, and dark mode parity.
  - **Admin Bilingual String Tables (`src/admin/i18n.ts`):**
    - Added 31 new translation keys across `EDITOR` and `DASHBOARD` with 100% Arabic and English parity.
- **Navigation Integration & Discoverability (`NAV-002`):**
  - Integrated public routes for Audio Archive (`/audio`) and Research Submissions (`/submit`) into the secondary ("المزيد") navigation menu and footer explore/research columns in `src/components/Shell.tsx`.
  - Added bilingual keys `nav.audio` and `nav.submit` across `messages/ar.json` and `messages/en.json`.
- **Fast-Forward Branch Synchronization Utility:**
  - Added cross-platform Node script `scripts/sync-branches.mjs` with batched atomic git pushes to fast-forward all `claude/*` branches to `master` in a single network pass.
  - Updated `scripts/sync-branches.sh` to delegate to `scripts/sync-branches.mjs`.
- **Novixa Technical Partner Page Seed Defaults:**
  - Added `novixa` static page definition to `DEFAULT_PAGES` in `src/seed/defaults.ts` to ensure clean throwaway databases in CI environments have all linked footer pages available.
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
