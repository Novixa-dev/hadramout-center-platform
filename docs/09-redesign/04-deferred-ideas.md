# Deferred ideas — ranked by impact ÷ cost (none of these is implemented)

| # | Idea | Impact | Cost | Blocker / note |
|---|---|:--:|:--:|---|
| 1 | **Cloudflare Cache Rule for HTML** (cache `/ar/*` list/detail pages at the edge, purge on deploy) | very high (TTFB for first visit from Yemen/Gulf, Lighthouse mobile) | low | needs a Cloudflare API token with Cache Purge (TRACKER #3). The Critical-CH header that would have fragmented the cache is already removed |
| 2 | **Extract text from the magazine/book PDFs** and add it to the FTS index (and a "search inside issues" facet) | very high for researchers | medium | scanned PDFs need OCR; per the audit, *unreviewed OCR must not be published as authoritative text* — index it for search only, show nothing until reviewed |
| 3 | Editorial quality dashboard in the admin (missing authors/dates/covers, duplicate titles, broken PDF links, timeline entries awaiting review, pending reader reviews) | high | medium | pure read-only queries over existing data |
| 4 | Book classification (subjects) | medium | medium | needs the Center's cataloguers — no classification data exists, none was invented |
| 5 | Per-topic and per-author RSS/Atom feeds | medium | low | feeds code already supports sections; add two route variants |
| 6 | Saved list: export BibTeX/CSL-JSON (RIS exists), optional sync via a shareable link (no accounts) | medium | low–medium | stay browser-local unless the Center wants accounts |
| 7 | Privacy-preserving analytics view (searches with no results, popular topics, failed PDF links) | medium | low | the tables already exist (`search_queries`, `not_found_log`, `pageviews`); needs an admin view and a disclosure sentence |
| 8 | Image alt-text audit: list legacy images whose alt equals the title or is empty, fix in bulk with editors | medium (a11y) | medium | human writing |
| 9 | Related-work graph using co-citation inside article bodies | low–medium | high | needs reference parsing; current rules (column → author → issue) are transparent |
| 10 | PWA offline for *saved* articles only (not PDFs) | low | medium | repeat readers on poor connections; do not cache the whole archive |
| 11 | IIIF viewer for manuscripts | low now | high | no verified manuscript content exists in the archive |

**Explicitly not recommended:** public comments, user accounts, AI summaries of scholarly texts, public uploads (high moderation/accuracy cost for a scholarly archive). Reader *reviews* were built only because they are moderated, rate-limited and can be switched off.
