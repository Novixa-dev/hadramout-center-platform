# Parity with the legacy site and peer comparison — status on 2026-10-24

**Purpose:** one place that answers "is everything the old site had also here, and what do comparable archives do that we should (not) copy?" It refreshes the verified work in [LEGACY_SITE_INVENTORY](../audit/LEGACY_SITE_INVENTORY.md) and [COMPETITOR_AND_BEST_PRACTICES_REVIEW](COMPETITOR_AND_BEST_PRACTICES_REVIEW.md) with the state after the 2026-10-21…24 work. Nothing here is invented: every "DONE" has a test or a live check named next to it.

## 1. Legacy site parity (hadramout.center → hadramout-center.novixa.dev)

| Legacy feature | Here | Evidence |
|---|---|---|
| 7 content types (news, articles, books, events, issues, videos, forum) | DONE, plus topics, authors, timeline | 1,454 of 1,461 items migrated; 7 missing items are listed in LEGACY_SITE_INVENTORY §2 (4 news, 3 articles) |
| Home with latest issue, news, events, books, articles | DONE (redesigned) | e2e journeys, screenshots |
| About, contact, footer address, 2 WhatsApp numbers, email | DONE; WhatsApp numbers now show their city | smoke, e2e |
| Old URLs keep working | DONE (301 map for all 7 types) | smoke redirects; a full matrix test is still open (NEXT_PLAN) |
| `manifest.json` | DONE, upgraded to a PWA with offline saved articles | `sw.test.ts`, e2e offline journey |
| Arabic only, RTL | DONE, plus 100+ languages (Arabic default, dark default) | e2e language journey |
| What the legacy site did **not** have and we added | search (FTS5, typeahead, per-section search), filters + sort + counts, citations (7 formats), RSS, hreflang, sitemap, OG cards, JSON-LD, accessibility modes, saved list + exports, `.ics`, real 404/410 status codes | tests named in CHANGELOG |
| Legacy defects we did **not** copy | soft 404 (HTTP 200 for unknown pages), 8-URL sitemap, no robots rules for staging | smoke asserts 404 for unknown pages |

**Open parity items:** the 63 PDFs are still served from the legacy file host (owner decision, G4); the forum brochure PDF and the source of video 2 must come from the Center (LEG-004/009).

## 2. Peer sites and what we take from them

Peers reviewed earlier (see the research doc §2): Qatar Digital Library, Europeana, DLME, Internet Archive, Gallica, Persée, OpenEdition, Wellcome Collection, Library of Congress. The practices that matter for this content (text and PDF, not image collections):

| Practice seen at peers | State here |
|---|---|
| Search that is always one click away and also scoped to a collection | DONE — global search with typeahead, and a search bar in every section (2026-10-24) |
| Faceted browse with counts, removable chips, shareable URLs | DONE — year, topic tree, author (with find-in-list), PDF, upcoming/past, **undated bucket** (2026-10-25, RES-011) |
| Grid and list views for catalogues | DONE — grid + list for books and news, compact list for articles |
| Citation export (BibTeX/RIS/CSL) and Scholar metadata | DONE |
| Open catalogue export | DONE — `/api/hc/catalog` CSV/JSON |
| Per-collection RSS | DONE — section, topic and author feeds |
| Large, clear preview images when a page is shared | DONE — OG cards: sharp photo with title at the bottom, or the cover at 318×477 beside the title; card URLs carry a design revision so edge caches refresh |
| Progressive loading feedback | DONE — top progress bar on navigation/filtering, spinner on busy buttons. A route-level skeleton (`loading.tsx`) was **rejected**: it makes missing pages return 200 (soft 404) |
| Rights/reuse statement per item | BLOCKED — the Center must decide the policy (RES-015) |
| Full text of PDFs in search | BLOCKED — needs PDF hosting decided first (RES-013) |
| IIIF viewer, DOI registration, semantic search, AI summaries | SKIP — no image collections / cost / accuracy risk (reasons in the research doc §8) |

## 3. Guard rails added so quality does not drift

| Guard | Where |
|---|---|
| Real-Chrome journeys (55 checks): defaults, search, article tools + offline, mobile menu, keyboard, language switch, forms, section search/sort/facets, list view, responsive overflow at 320/360/768/1024 px on 20 pages | `scripts/e2e.mjs` (CI smoke tier) |
| Sitemap sample sweep: status, title, description, canonical, one h1, lang/dir, alt text, JSON-LD, og:image, leaked text, links | `scripts/site-sweep.mjs` |
| SEO/OG audit: tags per template, card images are 1200×630 PNG, og:type per template | `scripts/seo-audit.mjs` |
| Live URL checks after every deploy and daily; an issue opens on failure | `.github/workflows/live-check.yml` |
| Dead code, unused files and dependencies | `npm run knip` (CI) |
| Branches never drift from `master` | `scripts/sync-branches.sh` |

## 4. Next ideas, ordered by value for researchers

1. Typeahead inside the section search bar (suggest titles of that section only).
2. "Saved searches" in the browser (local) with a one-click alert-free re-run.
3. Related-content rules for the 34% of items that have none (same author → same category → same period).
4. Per-item "cite this page" for events and videos (needs a citation convention).
5. Rights statement and `license`/`copyrightHolder` markup once the Center decides (RES-015).
