# Feature plan — everything we said we would do

**Purpose:** one list of every idea, feature and improvement promised across the project documents, with its *verified* status and the order of work. Findings (defects) live in [BACKLOG](BACKLOG.md); this file is about features and product decisions.
**Last updated:** 2026-10-20 · **Status legend:** DONE (verified in code or live) · TODO (we can build it without outside input) · BLOCKED (needs the Center, an editor, or owner credentials) · REJECTED (decided against, with the reason) · DECISION (needs the owner)
**Sources read:** [feature catalog](../02-plan/05-feature-catalog.md) · [master plan](../02-plan/01-master-plan.md) · [deferred ideas](../09-redesign/04-deferred-ideas.md) · [old-vs-new review](../08-review/01-site-review-old-vs-new.md) · [redesign plan](../09-redesign/00-baseline-and-plan.md) · [launch plan](../07-marketing/01-launch-campaign-plan.md) · [design system](../02-plan/03-design-system.md) · [editorial issues](../09-redesign/02-editorial-issues.md) · [TRACKER](../03-tracking/TRACKER.md) · [ROADMAP](ROADMAP.md)

## 1. Owner requests in force

| Request | State |
|---|---|
| Arabic is the default language | DONE — verified live: `Accept-Language: en/fr/none` all redirect to `/ar`; only a saved language cookie changes it; guarded by the CI smoke test |
| Dark theme is the default | DONE (PR #16) — `<html data-theme="dark">` rendered by the server, no flash, no JS needed; explicit visitor choice persists; theme-color, manifest and print follow |
| Everything planned gets built, tested and documented; GitHub always in sync | In progress — see sections 2–4; every change goes through a PR with CI |

## 2. Feature catalog status (F-xx)

| ID | Feature | State | Evidence / next step |
|---|---|---|---|
| F-01 | Machine translation ar → any language | DONE | live, Cloudflare Workers AI; budget cap exists (ARCH-009/010 open) |
| F-02 | Arabic admin | DONE | roles, WYSIWYG, sanitising |
| F-03 | Full import + 301 redirects | DONE | counts verified; PDFs still hot-linked (BLOCKED, LEG-001) |
| F-04 | Arabic search, suggestions, filters | DONE | result cache added; worker thread open (PERF-T3) |
| F-05 | Real URLs, hreflang, sitemaps | DONE | slugs in URLs are an option (DATA-008) |
| F-06 | Server-generated OG cards | DONE | Arabic shaping verified |
| F-07 | Responsive, dark mode, RTL/LTR | DONE | dark is now the default |
| F-08 | Security headers, admin protection | DONE | CSP still has `unsafe-inline` (SEC-1) |
| F-10 | Scholarly citation (7 formats) | DONE | |
| F-11 | Scholar/Zotero metadata | DONE | `citation_*` + JSON-LD; **COinS is claimed in older docs but not emitted** (RES-012: fix the doc, not needed) |
| F-12 | Author pages | DONE | author identity clean-up needs editors (DATA-006) |
| F-13 | Issue page with contents | DONE | issues 38–41 lack a table of contents (DATA-012) |
| F-14 | Reading experience | DONE | |
| F-15 | Copy with attribution | **TODO** | not implemented |
| F-16 | Related content | DONE | 34% of items have none (DATA-009) |
| F-17 | Saved list | DONE | RIS + JSON export exist; **BibTeX/CSL-JSON** to verify/add (deferred #6) |
| F-18 | Hijri dates | DONE | Arabic, day precision only (`formatHijri`) |
| F-19 | Open catalogue export (CSV/JSON) | **TODO** | not implemented |
| F-20 | Sharing | DONE | WhatsApp, Telegram, X, Facebook, Web Share |
| F-21 | Events calendar `.ics` | DONE | event data after 2024-11 missing (DATA-007, BLOCKED) |
| F-22 | Contact + book request | DONE | `kind=book_request` flow + WhatsApp link |
| F-23 | Newsletter | PARTIAL | subscribe/export/unsubscribe done; **sending needs a mail provider** (BLOCKED, F-46) |
| F-24 | RSS per section and language | DONE | per-topic and per-author feeds **TODO** (deferred #5) |
| F-25 | YouTube facade, no cookies | DONE | |
| F-30 | PWA | PARTIAL | manifest only; **offline page + saved articles offline TODO** |
| F-31 | Anonymous analytics | PARTIAL | tables exist; **no admin view — TODO** (deferred #7) |
| F-32 | Audit log, roles, backups, health | PARTIAL | roles, nightly backup, health done; **no audit log** (Payload `versions` not enabled) — DECISION |
| F-33 | Smart 404, friendly errors, maintenance mode | PARTIAL | 404 with search and the new error boundary exist; **maintenance mode TODO** |
| F-34 | Timeline | DONE | 6 entries need the Center's scientific review (DATA-018, BLOCKED) |
| F-35 | Image pipeline (sizes, WebP/AVIF, LQIP) | PARTIAL | `next/image` with responsive widths; LQIP not done; fewer widths rejected (see PERFORMANCE_PLAN) |
| F-36 | Accessibility: statement, shortcuts, high contrast | PARTIAL | statement done; **keyboard shortcuts and a high-contrast mode TODO** |
| F-40 | YouTube channel sync | BLOCKED | needs `channel_id` |
| F-41 | TOTP 2FA for admin | DECISION | not built into Payload; see section 5 |
| F-42 / deferred #11 | IIIF viewer | REJECTED for now | no verified manuscript content exists |
| F-43 / deferred #2 | Search inside PDFs | BLOCKED | needs PDF hosting decided first (LEG-001), then text extraction; OCR output must not be shown as authoritative |
| F-44 | Semantic search | REJECTED for now | cost/complexity; FTS5 with Arabic normalisation is adequate |
| F-45 | AI summaries | REJECTED | accuracy risk in a scholarly archive |
| F-46 | Newsletter sending | BLOCKED | needs a provider account |

## 3. Deferred ideas ([04-deferred-ideas](../09-redesign/04-deferred-ideas.md))

| # | Idea | State |
|---|---|---|
| 1 | Cloudflare HTML cache rule + purge | BLOCKED (owner token) |
| 2 | Text from magazine/book PDFs in the index | BLOCKED (see F-43) |
| 3 | Editorial quality dashboard | **TODO** — as a read-only report script first (`npm run quality`), admin view later |
| 4 | Book classification | BLOCKED (Center cataloguers) |
| 5 | Per-topic / per-author RSS | **TODO** |
| 6 | Saved list: BibTeX/CSL-JSON, shareable link | **TODO** (export part) |
| 7 | Analytics view (zero-result searches, popular topics, 404s) | **TODO** — included in the quality report |
| 8 | Image alt-text audit | **TODO** — included in the quality report (list only; the writing is editorial) |
| 9 | Co-citation graph | REJECTED for now (high cost) |
| 10 | PWA offline for saved articles only | **TODO** — see F-30 |

## 4. Marketing and launch ([launch plan](../07-marketing/01-launch-campaign-plan.md))

| Item | State |
|---|---|
| Launch assets: press release (ar/en), newsletter text, first posts, one-page profile | **TODO** — drafts built only from verified facts; the Center must approve before use |
| Search Console registration and sitemap submission | BLOCKED (owner/domain) |
| Newsletter provider | BLOCKED |
| Citation guide page ("how to cite Hadhrami sources") | **TODO** — content page, needs the Center's review |
| Novixa case study | BLOCKED — requires the Center's written approval; no invented numbers |

## 5. Decisions the owner should make

| Decision | Options | Recommendation |
|---|---|---|
| Admin audit trail | Enable Payload `versions` (history + restore per document) vs nothing | Enable for the content collections: cheap, gives restore-after-mistake; adds DB size |
| Admin 2FA | Build TOTP on top of Payload, or protect `/admin` with Cloudflare Access | Cloudflare Access (no code, works with the existing proxy) |
| Theme default | Dark for everyone (current) vs follow the visitor's OS | Keep dark default as requested; revisit with analytics after launch |
| Home page weight | Fewer cards vs current editorial density | Decide after a quiet-machine profile (PERFORMANCE_PLAN) |

## 6. Build order (this pass)

1. DONE — dark default + guards.
2. F-15 copy with attribution; F-19 catalogue export; F-17 BibTeX/CSL-JSON export; per-topic/author feeds.
3. F-36 keyboard shortcuts + high-contrast; F-33 maintenance mode.
4. F-30 offline page and saved-articles offline (conservative service worker: no caching of normal content).
5. Quality report script (deferred #3/#7/#8).
6. Launch assets drafts.
7. After each batch: `npm run check`, build, smoke (extended), PR with green CI, docs updated here and in BACKLOG/PROGRESS/CHANGELOG.
