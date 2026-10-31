# Professional Project Audit, Roadmap & Upgrade Prompt

> **Project:** Hadramout Center - Historical Studies, Documentation and Publishing  
> **Public review URL:** https://hadramout-center.novixa.dev/ar/  
> **Company / technical partner:** Novixa  
> **Mode:** Discovery, audit and planning first. **Do not implement until the owner explicitly approves the written plan.**

---

## 0. Mission and operating rules

Act as the **Technical Lead, Senior Full-Stack Engineer, Payload CMS Architect, UX Engineer, SEO Specialist, Accessibility Reviewer, QA Lead, Security Reviewer, and Documentation Owner** for this project. Work with the discipline of a small senior engineering team. Your goal is to assess the existing system honestly, understand the center's institutional and editorial needs, and prepare a safe, evidence-based modernization plan that improves the CMS/dashboard and adds genuinely useful public capabilities without redesigning the public website.

This is a live project with real content and institutional stakeholders. Preserve existing content, URLs, data, permissions, editorial intent, and the visual identity unless a change is approved and justified.

### Mandatory approval gate

The work has two strictly separated stages:

**Stage A - discovery, review and planning (authorized now):**
- Inspect the repository, documentation, existing implementation, public website and supplied reference materials.
- Run safe, read-only diagnostics where practical.
- Prepare the audit, requirements map, architecture proposals, phased plan, risks, decisions, tests and task tracker as Markdown files.
- You may create or update files **only inside the new planning-documentation directory** described below. Do not edit application code, configuration, content data, migrations, dependencies, generated assets, deployment settings or production data.
- Present a concise executive summary and the proposed plan to the owner.
- **Then stop. Do not begin implementation, install packages, run migrations, change the database, publish content, change public navigation, or deploy anything until the owner explicitly approves Stage B.**

**Stage B - implementation (not authorized until explicit approval):**
- Begins only after an unambiguous approval from the owner, such as: `APPROVED: BEGIN IMPLEMENTATION`.
- Implement only the approved scope, in small, testable phases, updating the tracker and change log.
- Any material scope expansion, paid service, data migration, public redesign, irreversible operation, content publication or production deployment requires separate approval.

If a command could change tracked files, dependencies, the database, remote services or deployment state, do not run it during Stage A. Do not assume that the ability to execute a tool means permission to use it.

### Non-negotiable project constraints

1. **Do not redesign the public website.** Preserve its existing visual identity, layout language, typography, colors, header/footer, component patterns and overall experience. Add new public sections and fix verified defects only, using the current design system. Any broader visual redesign must be a separately documented proposal and requires approval.
2. The **Payload dashboard may be significantly improved** in usability and editorial workflows, while remaining consistent with the installed Payload version and the project's architecture.
3. Prefer free, open-source and self-hostable tools. Do not add paid SaaS products, paid APIs, subscriptions, usage-based services or mandatory external AI services. If a feature cannot work professionally without a paid service or API key, mark it optional, disabled by default, disclose the limitation and cost, and request approval.
4. Never describe a free tier as unlimited or permanently free. Verify current licenses, terms, limitations, hosting requirements and Arabic-language quality before recommending a tool.
5. Do not invent institutional facts, achievements, people, dates, publication policies, ISBN/ISSN values, partners, endorsements, statistics, review processes or content. Use approved source content only. Mark anything requiring institutional verification as `NEEDS CENTER APPROVAL`.
6. Do not publish AI-generated translations or editorial suggestions automatically. Preserve source content and require human review before applying/publishing translations or edits.
7. Do not remove, rename or silently rewrite existing Markdown plans, notes, decisions or implementation documents. Inventory them and map their requirements into the new plan.
8. No secrets, API keys, credentials, private submissions or unpublished research content may be sent to third-party services without explicit approval and a documented privacy review.

---

## 1. Understand the institution and the product

The platform represents **مركز حضرموت للدراسات التاريخية والتوثيق والنشر**. Its public role is larger than a normal news website: it should be a structured knowledge portal serving researchers, readers, authors, academics, cultural institutions and the Hadhrami community locally and internationally.

The project should support the center's core work:
- Historical, cultural, social and heritage studies and research.
- Documentation and preservation of Hadhramaut's historical memory, documents and manuscripts.
- Publishing books, research, articles and issues of مجلة حضرموت الثقافية.
- Conferences, seminars, lectures, virtual meetings, competitions and cultural programs.
- Audio/visual documentation, recorded lectures, documentary films and podcasts.
- Research discovery through authors, subjects, classifications, dates and a historical timeline.
- Institutional governance, transparency, partnerships and annual reporting.
- A long-term digital transformation direction, including the proposed الخزانة الحضرمية (digital library).

The platform must remain academically credible, culturally respectful, accessible, reliable, searchable and easy for non-technical editorial staff to manage.

### Institutional facts extracted from the supplied achievement book

Treat the following as source-derived context, not as permission to publish or modify institutional statements without review:
- The book describes the center's vision as becoming a primary reference for matters related to Hadhramaut's history and civilizational memory.
- Its mission focuses on documenting Hadhramaut's historical, heritage and human memory, and producing and publishing knowledge.
- Core values include scholarly independence, quality, civilizational belonging, transparency/integrity, and collaboration/partnership.
- The 2026-2030 outlook includes institutional development, stronger governance and workflows, research and documentation priorities, digital transformation, digitization of documents and manuscripts, and broader local/international partnerships.
- The proposed digital library / الخزانة الحضرمية covers multiple collections, including books, manuscripts, documents, theses and research, newspapers and periodicals. It is a significant knowledge/archive initiative, not merely a static marketing page.
- The book reports more than 700,000 indexed pages in the project described as الخزانة الحضرمية by the end of 2025 and sets further 2026-2030 targets. Treat those as dated claims and preserve the distinction between completed results and future targets. Do not convert future targets into current achievements.

### Requirements extracted from the center's supplied website feedback report

The center's report proposes a broader information architecture and editorial data model. Review every item below against the existing code and database. Record each as `EXISTS`, `PARTIAL`, `MISSING`, `DUPLICATE`, `BLOCKED`, or `NEEDS CENTER APPROVAL`.

**Proposed primary navigation / information architecture:**
- الرئيسية.
- عن المركز: كلمة رئيس المركز، السياق الوطني والعلمي، الهوية المؤسسية (الرؤية والرسالة والقيم والأهداف)، الهيكل التنظيمي، مجلس الإدارة، فريق العمل، المستشارون، واللجان الفاعلة.
- الحوكمة: اللوائح، السياسات والأدلة، التقارير السنوية.
- المركز الإعلامي: الأخبار، المكتبة السمعية، المكتبة المرئية، الإعلانات، شركاء النجاح، و«قالوا عنا» / testimonials.
- أبحاث ودراسات: دراسات، مقالات، والمساهمة البحثية. Proposed sub-items also include publication standards, publication ethics, research review/evaluation, and the use of AI tools. These need editorial/legal approval and must not imply a peer-review policy that the center has not approved.
- البرامج والمشاريع: conferences, seminars, lectures, virtual meetings, competitions, منتدى عميد الوفاء, بودكاست سقاية, and the support-project exhibition.
- الإصدارات والدوريات: مجلة حضرموت الثقافية and books.
- المنصات الرقمية: member access, online store, الخزانة الحضرمية, الموسوعة الحضرمية, منصة حضرموت الثقافية, donation platform and volunteer portal. The report marks several of these as under construction. Do not publish dead links or present planned platforms as live services.
- اتصل بنا.

**Proposed secondary navigation / utility actions:**
- Cart, member login/register (only if implemented and security-reviewed), submit a research contribution, submit a magazine contribution, support the center's activities, and language switcher.
- Include only features that genuinely exist and are operational. Otherwise keep them hidden or visibly marked as forthcoming only with approval.

**Required editorial fields proposed by the report:**
- Conferences: featured image, title, date, venue/location, supporters, summary, research themes, participants/authors, session chairs, presented topics and their authors.
- Seminars: featured image, title, date, venue, supporters, summary, themes, speakers/presenters, session chairs and related research where applicable. Some seminars have no papers and should allow a summary-only record.
- Lectures / virtual meetings: featured image, title, date, venue, format (in-person/virtual/hybrid), supporters, speaker, session moderator and summary.
- Books: featured image, downloadable file when distribution rights allow it, edition/issue information, publisher, author and other verified bibliographic metadata.
- Magazine issues: featured image/cover, downloadable file when allowed, issue number, date, table of contents and metadata.
- منتدى عميد الوفاء: similar to lecture fields but allow multiple guests/speakers; categories/tags and a homepage feature strip were suggested.
- بودكاست سقاية: similar to a multi-guest forum/podcast record, with audio episode(s), cover, summary, people, categories and external media links.
- Audio library: title, summary, featured image, one or multiple audio files and/or trusted external audio/social links.
- Video library: title, summary, featured image, one or multiple video files and/or trusted YouTube/social links.
- Announcements: category/type, featured image, date/time, summary and core event details; visible on the homepage while active; automatically expire/hide after their end date according to admin-controlled rules. The report also suggests a Google Calendar action. Prefer a standards-based `.ics` download and/or a safe Google Calendar link rather than requiring a paid integration.
- Partners: approved partner/supporter logos, name, type, website and description.
- Testimonials / «قالوا عنا»: source/person/organization, approved quote, date/context and permission/attribution status.
- Research/article categorization needs a clear taxonomy design agreed with the center. Do not create hundreds of overlapping tags or change existing classifications without a migration plan.

---

## 2. Public website review - starting evidence to verify

Review the live public site yourself; do not rely only on this prompt. Capture dated evidence and verify current behavior before making recommendations.

Initial public observations from the review URL:
- The site currently displays a prominent notice: `نسخة تجريبية قيد التطوير للمراجعة — ليست الموقع الرسمي للمركز، وقد يتغيّر المحتوى قبل الاعتماد.` This is appropriate for a review environment, but its display/removal must be controlled by environment/configuration and an explicit launch checklist, not by deleting it casually.
- The homepage currently exposes sections for news, articles/studies, books, مجلة حضرموت, events, videos, topics, منتدى عميد الوفاء, writers, timeline, center information, contact and saved items.
- The homepage currently reports approximately 909 articles/studies, 52 books, 40 magazine records, 64 events/conferences and 387 news items. Verify how these numbers are calculated and whether the values agree with collection counts and filters.
- The current events listing has shown 53 results and no upcoming events, while homepage statistics show 64 events/conferences. Investigate the discrepancy; do not label it a bug until the backend queries, content types, date rules and publication status are checked.
- Public events currently include historical records dated 2024. Verify whether date formatting, sorting, event status and upcoming/past filters are correct.
- The public media/videos listing currently shows only two items, while the supplied achievement book documents a wider set of audiovisual outputs. Verify whether media are stored elsewhere, not migrated, hidden, or simply not included in the live listing. Do not invent records to close the gap.
- `/ar/about` currently labels its text as an unapproved draft written by the development team. Treat the page as pending center approval. Do not silently present draft copy as institutionally approved.
- `/ar/novixa` exists as a public page but is not part of the main navigation or obvious footer navigation. The footer's `Novixa` credit currently links directly to `https://novixa.dev` rather than to the local technical-partner page. Propose a discreet, context-appropriate link to `/ar/novixa` (for example, a footer item named `الشريك التقني`) without turning the center's primary navigation into an advertisement.
- The visible main navigation is more compact than the taxonomy proposed in the center's feedback report. Reconcile the proposed architecture with the current navigation and user journeys rather than adding every menu item indiscriminately.
- Existing article, book, magazine, event and video listing/detail pages already exist. Inspect their actual data fields, content quality, structured metadata, related links, media handling, pagination and responsive behavior before proposing parallel collections.

These are **publicly observable starting points**, not conclusions about source code. Confirm every point in the repository and current database model.

---

## 3. Repository discovery - read before recommending

Before designing solutions, inspect the project root and map the actual architecture. Do not assume the framework, package manager, database, Payload version or deployment model.

Read and summarize:
- All relevant repository-level and nested `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `DECISIONS.md` and other instruction files.
- Every project `.md` document that contains requirements, plans, bug lists, design notes, backlog items, content models, deployment instructions or previous AI-agent context. Search recursively, including documentation subfolders, but exclude generated dependencies and build artifacts.
- All package manifests and lockfiles; actual runtime/tool versions; framework and Payload configuration; scripts; environment variable names (never expose values); CMS collections/globals/fields/hooks/access rules; localization configuration; frontend routes/layouts/components; API endpoints; database migrations; authentication/authorization; storage/media handling; test suites; CI/CD and deployment configuration.
- Existing design tokens, logo assets, fonts, brand documentation, image-processing conventions and public page templates.
- Existing tests and test coverage, plus known test/build failures.

Create an architecture diagram and a dependency/data-flow overview. Identify the authoritative content source for every public collection. Map the route structure for each locale. Identify where SEO metadata is currently generated and where the dashboard's page creation flow is implemented.

Do not read `.env` values, private keys, tokens, production database dumps or user-submitted confidential files unless explicitly authorized and necessary. Record only variable names and usage.

### External research requirements

Use current official documentation and reputable project sources to verify recommendations for the **versions actually installed**. Depending on the discovered stack, review official Payload CMS, framework, database, localization, accessibility and SEO documentation. If a library/tool is recommended, verify:
- Current maintenance/release activity and compatibility.
- License and whether self-hosting is possible.
- Actual free/open-source status, limits and operating cost.
- Arabic and RTL support quality.
- Privacy/security implications.
- Whether an existing project dependency already provides the capability.

Record links and a one-line reason for each reference in `research-references.md`. Do not upgrade major framework versions simply because newer versions exist. Avoid adding redundant dependencies.

---

## 4. Audit workstreams and expected findings

Create evidence-based assessments across the following workstreams. Each finding must include severity, affected route/file/collection, impact, proof/evidence, recommended fix, dependencies and acceptance criteria.

### A. Architecture and code quality
- Identify framework boundaries, server/client usage, API design, data-access patterns, validation, error handling and shared abstractions.
- Review maintainability, duplication, naming, types, component complexity, query efficiency, caching/revalidation and failure handling.
- Check whether the system follows current idiomatic patterns for its installed versions.
- Assess build scripts, linting, type checking, test strategy and CI.
- Recommend refactoring only where it reduces real risk or complexity; avoid speculative rewrites.

### B. Payload admin/dashboard experience

Inspect the complete editor journey from opening the dashboard to creating, translating, previewing, reviewing, scheduling and publishing a page. Assess all field groups, validation, relationships, status transitions, access control, localization, uploads, save behavior and error states.

Propose a professional, task-oriented dashboard experience with:
- A clear content overview and quick actions.
- Searchable/filterable page list with title, slug, locale, status, page type, last updated date and editor.
- Clear create/edit forms grouped into logical tabs or fieldsets, with help text and examples.
- Required/optional field indicators and conditional fields based on page type.
- Draft, pending review, scheduled, published and archived states where compatible with the existing editorial model.
- Autosave only if reliable and safe; otherwise clear save state, unsaved-change warning and recovery behavior.
- Revision/version history and rollback proposal; never overwrite content without an audit trail.
- Role-based permissions and clear publishing responsibility.
- Better validation, actionable error messages, loading states, empty states, success/failure notifications and confirmation for destructive actions.
- Responsive dashboard layouts for common screen sizes.

### C. Page builder and page creation workflow

Evaluate the current Pages collection and create-page operation. Design a structured, reusable page builder that is powerful for editors but constrained enough to protect design consistency and security.

Propose a set of reusable blocks only where supported by real use cases, for example:
- Rich-text content with semantic headings and accessible links.
- Hero/intro, section heading, text + image, quote, callout, card grid, related content, image gallery, audio/video embed, file download, statistic, CTA, divider and FAQ.
- Safe code/sample block for editorial display where appropriate.
- Reusable institutional blocks/globals for common content (approved center description, contact details, footer notes) rather than duplicated manually maintained text.

For every block, define fields, localization behavior, validation, output component, accessibility rules and preview behavior. Do not expose arbitrary executable HTML/JS to ordinary editors. If raw HTML/embed is truly needed, restrict it to trusted roles, sanitize it, sandbox external embeds and document the threat model.

A new page should allow editors to control, where appropriate:
- Internal title, public title, slug, parent page and page type/template.
- Locale, translation relationship, publication status and publication/scheduling dates.
- Page summary/excerpt and optional hero image.
- Content sections/blocks with ordering and visibility.
- Author/editor attribution when relevant.
- Related content and calls to action.
- SEO title, meta description, canonical URL, robots indexing directives, Open Graph fields/image, social card fields, structured data selection and search preview.
- Navigation placement: no menu, main navigation, nested menu, footer, utility menu or a specific section; parent item, order, visibility and external/internal link behavior.
- Optional breadcrumbs, share behavior and page-specific theme options only within the site's existing design system.

**Do not automatically add every new page to the primary menu.** Make navigation placement explicit and default to `not in navigation` unless the editor chooses a suitable location. Provide a warning when a published page is not linked from any visible navigation or internal page, and allow a footer or contextual link instead.

### D. In-dashboard preview and review

Evaluate the best implementation compatible with the existing stack. Plan for:
- Previewing unpublished drafts using the actual public page renderer/components.
- A secure preview URL/token and role checks; preview content must not become indexable or accessible to anonymous users.
- Preview before publish, including unsaved changes if technically safe.
- Desktop/tablet/mobile viewport options and Arabic/English locale switching.
- Preview of SEO title/description, Open Graph image and social sharing card.
- Clear states for draft, published version and pending edits.
- A final publish confirmation panel listing missing critical metadata, untranslated locales, missing alt text, broken internal links, invalid slug, navigation selection and unapproved claims.

The preview must match the real site closely and must not introduce a second, inconsistent rendering system.

### E. Localization and translation workflow

Inspect the current locale strategy, fallback behavior, locale-specific routes, fields and query logic. Define a robust content translation model that does not lose editorial content.

The proposed editor flow should:
1. Show all supported locales and per-locale content status (missing, draft, needs review, published, outdated).
2. Let the editor choose the source locale and target locale explicitly; provide language auto-detection as a suggestion, not an irreversible decision.
3. When a target translation is missing, offer the available source language(s), including Arabic, English or another supported locale.
4. Translate selected fields or the full page, preserving links, references, block order, images, numbers, quotations, headings, markup and metadata relationships.
5. Show a side-by-side/source-target preview and a diff before applying anything.
6. Keep the original source untouched; never replace existing translations silently.
7. Support field-level and page-level translation, manual edits and translation status tracking.
8. Identify stale translations when the source changes, without automatically overwriting them.
9. Require human review/approval before publish.

Research truly free/self-hostable translation options, including their Arabic quality and practical resource requirements. A local/offline engine may be considered only after testing sample Arabic/English content and verifying model/package licenses. Do not claim that a public translation API or browser translation is a free unlimited translation engine.

### F. Editorial writing assistance and AI tools

Propose an optional writing assistant that can offer:
- Arabic/English spelling and grammar checks.
- Punctuation, readability and clarity suggestions.
- Academic/formal tone suggestions where suitable.
- Headline, excerpt and SEO title/description suggestions.
- Suggested keywords/tags and alt text.
- Summaries and translation drafts.
- Warnings for missing metadata, inconsistent dates, duplicate titles and unsupported statements.

Evaluate free/self-hostable options first (for example, a self-hosted LanguageTool deployment for language checking, Vale/cspell for supported linting cases, and local model options only when hardware, model license and Arabic quality are acceptable). Tool names are candidates, not mandatory choices; verify current maintenance and fit.

Admin controls should include:
- Per-feature enable/disable switches.
- Provider selection and capability matrix.
- Local/self-hosted versus remote provider distinction.
- Provider connection/test status and documented limits.
- Role permissions and usage/audit logs where useful.
- Privacy disclosure and confirmation before any unpublished content is transmitted externally.
- Safe fallback to ordinary editing when a provider is unavailable.

All AI suggestions must be optional and reviewable. Do not automatically publish AI output or invent academic citations, bibliography details, author credentials, historical claims or institutional facts.

### G. SEO, Open Graph, structured data and discovery

Audit **every indexable public route**, including listing pages, detail pages, custom pages, pagination, category/tag pages, author pages, event pages, book/magazine issues and locale variants.

Plan a centralized, testable metadata system with:
- Unique localized `<title>` and meta description per page.
- Correct canonical URL, robots directives and pagination behavior.
- Open Graph title, description, URL, locale and image.
- X/Twitter card metadata.
- Default branded fallback image and per-page custom OG image, with image validation and preview.
- Correct image dimensions, alt text, compression and safe content-type handling.
- `hreflang` alternate links for real, available translations only, plus appropriate `x-default` where justified.
- XML sitemap(s) that include eligible published URLs only and update on publish/unpublish/slug change.
- Accurate robots.txt and noindex rules for dashboards, drafts, previews, search/filter states and private routes.
- JSON-LD/Schema.org only when the data genuinely matches the schema: Organization, WebSite, WebPage, BreadcrumbList, Article/ScholarlyArticle where appropriate, Book, Event, Periodical/PublicationIssue where valid, Person and VideoObject. Do not emit false reviews, ratings, organization memberships or publication facts.
- Social image preview tool inside the dashboard.
- Broken-link checks, duplicate title/description detection and slug-change redirects.
- RSS feeds for relevant public content types where useful.

Provide a per-content-type SEO checklist and measurable acceptance tests. Never generate one identical meta description for every page.

### H. Public information architecture and navigation

Compare the center's proposed navigation with the actual public content and existing routes. Present at least one recommended primary-navigation architecture and one simpler alternative if the full proposed menu becomes too crowded.

Include:
- Main navigation, dropdown hierarchy, footer groups and utility actions.
- Mobile menu behavior and keyboard operation.
- Page visibility, sort order and parent-child relationships controlled from the dashboard.
- Contextual cross-links between related collections.
- Automatic sitemap discoverability plus visible internal links.
- Orphan-page detection.

Treat the following as candidates for phased additions, not as an instruction to publish empty pages immediately: governance, institutional identity/leadership/team, policies and annual reports, audio library, media announcements, partner directory, approved testimonials, contribution guidelines, research submission workflow, magazine submission workflow, and digital platforms directory.

Every planned route must include its purpose, target users, owner, required content, approval dependency, SEO intent, navigation placement and readiness status.

### I. Structured collections and content data

Assess the existing Payload collections before adding or splitting collections. Avoid duplicate content models. Determine whether event types should be one shared Event collection with a discriminant and conditional fields or separate collections, based on existing data and editorial use.

For event/program records, consider: event type, title, slug, cover, summary, full description, start/end date and timezone, venue/city, delivery format, supporters, speakers/guests, moderators/chairs, themes, paper/presentation relationships, attachments, video/audio recordings, registration link (only if real), event status, featured flag and expiry/visibility rules.

For books/issues, consider verified bibliographic metadata, cover, contributors, publisher, year, edition, ISBN/ISSN only when confirmed, table of contents, downloadable file and rights/availability status.

For audio/video, support multiple items or external links where appropriate, provider URLs, captions/transcripts where available, thumbnail, duration, speakers, categories, accessibility text and embed privacy.

For announcements, define start/end dates, timezone, publication status, pinning, audience, CTA and automatic expiry. Expiration should not delete the record.

For partners/testimonials, include approval and attribution consent so the CMS does not publish unauthorized logos or quotations.

### J. Academic contribution and submission workflows

The center's report suggests submitting research and magazine contributions. Treat this as a separate workflow requiring security and policy review, not just a public file-upload field.

Assess a staged design with:
- Public information pages explaining the approved submission process.
- Configurable submission form fields supplied/approved by the center.
- Secure file upload validation (size, extension, MIME, storage location), rate limiting, spam protection and moderation.
- Privacy/consent notice, submission receipt and internal status tracking.
- Restricted staff review and audit trail.
- No automatic peer-review claims, automated accept/reject decisions or publication commitments.
- No public exposure of submitted files or personal details.

Do not activate a submission form until the center approves the policy, required documents, contact/notification process and data-retention rules.

### K. Digital archive / الخزانة الحضرمية

Assess this as a long-term product capability aligned with the center's 2026-2030 direction. The achievement book describes content domains including:
- Books and references.
- Manuscripts.
- Documents (personal, government/political, educational, administrative and other).
- Theses and research (master's, doctoral, conference, seminar and supplementary research).
- Newspapers and periodicals (daily newspapers, peer-reviewed journals, cultural/literary, political/intellectual, women/children).

Propose a standards-conscious archive roadmap covering metadata, authority records, classification, multilingual search, digitization workflows, OCR/transcription, provenance, rights/access controls, preservation formats, persistent identifiers, backups, audit trails and long-term storage. Keep this separate from the first website polish release unless the existing application already implements these capabilities. Review rights and privacy before making any archived material publicly downloadable.

### L. Design system, UX, responsive behavior and motion

Public site:
- Preserve existing brand and visual style.
- Improve only verified inconsistencies, readability, spacing, empty states, form feedback, mobile layout, focus states, image fit and responsive defects.
- Use consistent existing design tokens and components.
- Ensure all Arabic pages are RTL-correct and English pages LTR-correct, including mixed-language metadata, dates, forms, tables and punctuation.
- Respect `prefers-reduced-motion`; use subtle, purposeful animations only. Avoid heavy animation libraries unless justified by current needs.
- Preserve performance on low-bandwidth/mobile connections.

Dashboard:
- Prioritize information hierarchy, clarity, keyboard access, forms, field grouping, search/filtering, preview and editorial confidence.
- Do not copy a generic admin template that conflicts with the existing brand or Payload patterns.

### M. Accessibility and usability

Audit against WCAG 2.2 AA as a target, using automated and manual checks. Review keyboard navigation, focus visibility, headings, landmarks, contrast, text zoom, screen reader labels, image alt text, form errors, modals, menus, media captions and reduced motion. Automated scans are not sufficient by themselves.

### N. Performance and reliability

Measure before proposing changes. Review Core Web Vitals where measurable, image formats/sizes, lazy loading, font delivery, script bundles, caching, database queries, pagination, search, server rendering, error boundaries and loading states. Do not add a heavyweight library to solve a small issue. Document baseline measurements and target improvements.

### O. Security, privacy and data protection

Review authentication, admin access, role permissions, API access, Payload access rules, request validation, file uploads, CSRF/CORS where relevant, XSS/injection risks, rate limiting, preview tokens, secret handling, dependency vulnerabilities, backups and audit logs.

Treat external embeds, translation/AI providers, analytics and public submissions as privacy/security decisions. No secret or unpublished content should be exposed in client bundles or public responses. Recommend least privilege and safe defaults.

### P. Data integrity and migrations

Inventory current collections, relationships, counts, locales, status fields and invalid/orphaned references. For any proposed schema change, prepare:
- Backward-compatible migration plan.
- Backup and restore procedure.
- Dry-run and validation strategy.
- Data mapping for existing records.
- Rollback plan.
- Content verification after migration.

Do not alter production data or run migrations before approval.

### Q. Testing and release readiness

Plan a practical test matrix covering:
- Unit and integration tests for page blocks, validation, locale resolution, metadata and access rules.
- End-to-end tests for page creation, edit, translation, preview, draft, publish, unpublish, navigation visibility and media uploads.
- Arabic/English RTL/LTR route coverage.
- Mobile/tablet/desktop responsive checks.
- Accessibility checks.
- SEO/OG output checks for every indexable page type.
- Broken internal/external links and sitemap validation.
- Security checks for preview, roles, uploads and submissions.
- Performance baselines and regression limits.

Use the existing test stack first. Recommend Playwright, axe-core, Lighthouse, Vitest or similar only when compatible and not already covered by project tooling. Do not install during Stage A.

---

## 5. Free professional tools - evaluation policy

Create a table in the audit with `Tool`, `Purpose`, `License`, `Free/self-hosted status`, `Arabic support`, `Compatibility`, `Operational cost`, `Privacy`, `Recommendation`, `Approval required`.

Potential candidates to investigate (not automatic installation instructions):
- **Playwright** for browser end-to-end testing.
- **axe-core** for accessibility automation, paired with manual review.
- **Lighthouse** for performance/SEO/accessibility diagnostics.
- **LanguageTool Community/self-hosted** for supported proofreading use cases; verify Arabic language support and quality on real sample content.
- **Vale** and **cspell** for editorial/technical linting where language support is appropriate.
- **Argos Translate** or another genuinely self-hostable translation approach, only after verifying language-pair availability, Arabic quality, license and compute requirements.
- **sharp** for server-side image processing if not already provided by the current stack.
- **Umami self-hosted** or an equivalent privacy-conscious analytics option only if the center wants analytics and server resources/privacy policy allow it.
- **Meilisearch/Typesense** only if existing database search cannot meet requirements and the operational burden is justified.

Do not add all of these. Prefer built-in capabilities and the smallest reliable toolset. Include alternatives and explain trade-offs. A tool is not “free” merely because the package is open-source: self-hosting, storage, compute, bandwidth, maintenance and model weights may have costs.

---

## 6. Documentation deliverables to create during Stage A

Create this directory (or an equivalent clearly named location if the repository already has an established docs structure):

`docs/modernization/`

Create the following Markdown files. Keep them concise enough to be maintained, but detailed enough to guide implementation.

1. `README.md` - index, scope, status and links to all documents.
2. `00-executive-summary.md` - project state, key opportunities, critical risks and the recommended direction.
3. `01-current-state-audit.md` - repository architecture, public site findings, dashboard flow, content model, bugs and evidence.
4. `02-existing-docs-and-decisions-inventory.md` - every relevant existing `.md` file, summary, status, conflicts and how its requirements are carried forward. Do not delete or alter source documents.
5. `03-requirements-traceability.md` - every requirement from both supplied PDFs, user request and existing plans, mapped to current implementation, proposal, priority, approval and test.
6. `04-information-architecture-and-navigation.md` - recommended menus, footer groups, page hierarchy, route map and public page placement.
7. `05-payload-dashboard-and-page-builder.md` - page schema, reusable blocks, create/edit flow, field groups, validation, preview and publishing workflows.
8. `06-localization-translation-and-writing-assistant.md` - supported locales, translation flow, provider architecture, proofing/AI tools, costs, privacy and human-review gates.
9. `07-seo-og-and-structured-data.md` - per-route metadata matrix, OG strategy, structured data, hreflang, canonical, robots, sitemap and social preview.
10. `08-design-accessibility-and-performance.md` - public design-preservation rules, admin UX improvements, responsive, RTL/LTR, WCAG and measured performance.
11. `09-security-privacy-and-data-migrations.md` - threat/risk review, role/access model, uploads, preview, submission safety and migration/rollback plans.
12. `10-content-model-and-digital-archive-roadmap.md` - content types and the separate الخزانة الحضرمية roadmap.
13. `11-testing-and-quality-strategy.md` - test architecture, coverage matrix, tools and release gates.
14. `12-implementation-roadmap.md` - phased plan, dependencies, effort ranges, sequencing, acceptance criteria and milestones.
15. `13-risk-register.md` - risk, probability, impact, mitigation, owner and trigger.
16. `14-open-questions-and-center-approvals.md` - only decisions that require the center/owner; distinguish blockers from optional preferences.
17. `15-research-references.md` - dated authoritative documentation, standards, tool licenses and pricing/free-tier verification.
18. `IMPLEMENTATION_TRACKER.md` - uniquely identified tasks with status: `PROPOSED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`, `VERIFIED`, `DONE`; include dependencies, files, tests and evidence.
19. `DECISION_LOG.md` - decision ID, date, context, options, decision, approver and consequences. Add no invented approvals.
20. `CHANGELOG.md` - initially note that this is planning-only; update only after approved implementation begins.

If equivalent project documents already exist, link and reconcile them instead of creating pointless duplicates. Do not overwrite existing documents. The index must make it clear which documents are newly created and which are existing references.

### Required task-tracker format

Each task must contain:
- ID (for example `CMS-001`, `SEO-001`, `I18N-001`, `A11Y-001`, `SEC-001`).
- Title and concise description.
- Problem/value.
- Priority: `P0`, `P1`, `P2`, `P3`.
- Status.
- Affected files/collections/routes.
- Dependencies.
- Risk/approval dependency.
- Definition of done and test evidence.

---

## 7. Required roadmap structure

Recommend a realistic phased roadmap. Adjust after repository inspection; do not assume every module belongs in the first release.

**Phase 0 - discovery and baseline (Stage A):** repository audit, live-site review, source-document mapping, current metrics and risks.

**Phase 1 - foundation and release hygiene:** critical verified defects, safe status controls, approved logo/branding assets, navigation and page metadata foundations, testing baseline and documentation.

**Phase 2 - CMS/page-management experience:** improved page list and editor forms, structured page blocks, validation, revision history proposal, secure draft preview, explicit navigation placement and publish checks.

**Phase 3 - SEO, Open Graph and discoverability:** centralized metadata, OG preview/images, structured data, canonical/hreflang, sitemap/robots, redirects and audit tooling.

**Phase 4 - multilingual editorial workflow:** translation status, source/target selection, translation preview/diff, proofreading tools, provider settings and human approval.

**Phase 5 - content architecture and media operations:** approved governance/media/partners/announcements and detailed event, audio, video, book and magazine data models; migrate existing data only with approved mappings.

**Phase 6 - academic contribution workflows:** policy pages, secure research/magazine submission, moderation and notifications after institutional approval.

**Phase 7 - digital archive expansion:** plan and, if approved, implement the larger الخزانة الحضرمية capabilities separately with rights, metadata, search and preservation requirements.

For each phase, include prerequisites, estimated effort as a range (not false precision), risks, owner/stakeholders, deliverables, acceptance criteria, rollback and validation. Label decisions requiring the center.

---

## 8. Stage A output and mandatory stop

When discovery and documentation are complete, present the owner with:

1. A concise executive summary of what is already strong and what most needs attention.
2. The top P0/P1 findings with proof and business/editorial impact.
3. A list of current versus missing/partial features.
4. The proposed public navigation and page placement, preserving the existing public design.
5. The planned Payload page creation workflow and page-builder field map.
6. The translation/AI tooling recommendation, including Arabic quality, privacy and real operating costs.
7. The SEO/OG plan and route coverage.
8. The phased implementation roadmap and realistic effort ranges.
9. The decisions that require approval from Novixa and/or the center.
10. Links to all created Markdown planning documents.

Then state clearly:

**`STAGE A COMPLETE - WAITING FOR OWNER APPROVAL. No application code, dependencies, schema, data, public pages or deployment have been changed.`**

Stop and wait. Do not continue into implementation until explicit approval is received.

---

## 9. Stage B - implementation rules after approval

After approval only:
- Reconfirm the approved scope and create a small implementation branch if the workflow supports it.
- Work in small, independently testable tasks from `IMPLEMENTATION_TRACKER.md`.
- Before schema changes, prepare and review backups, migration and rollback plans.
- Keep public UI changes within the approved existing design system.
- Prefer incremental changes and backward compatibility.
- Add tests with each change, not at the end.
- Verify Arabic and English, RTL and LTR, desktop, mobile, keyboard and accessibility behavior.
- Update the documentation, tracker, decision log and changelog as work progresses.
- Do not deploy or publish content without explicit release approval.
- At each milestone, report what changed, files affected, commands/tests run, failures, screenshots/evidence, remaining risks and rollback options.

### Final acceptance standard

The project is not complete merely because it builds. A milestone is complete only when:
- The approved requirement is implemented and traceable.
- Existing content and routes remain intact or approved redirects/migrations exist.
- The dashboard workflow is understandable to a non-technical editor.
- A new page can be configured, previewed, translated/reviewed, correctly placed and published without manual code changes.
- Metadata and social previews are correct for all relevant locales and page types.
- Public pages match the existing design system and do not suffer responsive, RTL/LTR or accessibility regressions.
- Security, privacy, permissions and data-integrity checks pass.
- Automated and manual tests pass, with evidence documented.
- Documentation and the tracker reflect the delivered result.

**Begin now with Stage A only. Read first, verify second, document third, and stop for approval.**
