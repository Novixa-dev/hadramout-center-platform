# Performance baseline and plan

**Purpose:** measured performance state and a prioritised plan. **Scope:** public pages. **Last updated:** 2026-10-19
**Method caveat:** Lighthouse lab runs from one Windows machine, one run per page, simulated mobile throttling. They are indicative, not field data (no CrUX/Search Console data was available). Desktop runs returned no performance metrics (see "Tool issues").
**Related:** [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md) (ARCH-001/002/015) · [PROGRESS](../planning/PROGRESS.md) · [TRACKER](../03-tracking/TRACKER.md) items 3, 4, 7

## 1. Measured baseline — production (`hadramout-center.novixa.dev`, older build than `master`)

Lighthouse mobile, 2026-10-19:

| Page | Perf | FCP | LCP | TBT | CLS | Transfer | A11y | SEO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/ar` | **53** | 2.9 s | 3.5 s | **2.0 s** | 0.002 | 479 KB | 100 | 100 |
| `/ar/articles` | 79 | 1.9 s | 2.1 s | 0.7 s | 0 | 319 KB | 100 | 100 |
| `/ar/articles/894` | 83 | 1.7 s | 1.9 s | 0.6 s | 0 | 421 KB | 100 | 100 |
| `/ar/books/37` | 86 | 1.6 s | 2.2 s | 0.5 s | 0 | 452 KB | 100 | 100 |
| `/ar/search?q=…` | 64 | 1.8 s | 2.1 s | 1.4 s | **0.138** | 323 KB | 100 | 61 (intentional `noindex`) |

Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (INP cannot be measured in the lab). **Home LCP (3.5 s), home TBT (2.0 s) and search CLS (0.138) miss.** Detail pages are within the LCP target.
The search CLS did not reproduce on the current source (0 on a local production build); it is expected to be fixed by the already-merged redesign and must be re-measured after deploy.

## 2. Structure of the home page (current source, local production build)

| Measure | Value | Reading |
|---|---|---|
| HTML | 195 KB, of which **97 KB is inline RSC flight data** | Half the document is serialized component props; hydration cost scales with it |
| Scripts | 11 files, 602 KB raw / 188 KB gzip | Includes a 38 KB-gzip `noModule` polyfill chunk that modern browsers do not execute, so about 150 KB gzip actually runs |
| Links / images | 174 links, 25 `<img>` (22 lazy) | Home renders many cards |
| Fonts | Arabic fonts preloaded | Fine |

Likely cause of TBT: hydrating a large RSC payload plus 174 links on a 4× throttled CPU. **This is a hypothesis from the structure, not a profiled result.**

## 3. Verified facts that constrain the plan

- Production HTML for the home page is served with `s-maxage=300, stale-while-revalidate`, but content and list pages are `no-store` and Cloudflare reports DYNAMIC (ARCH-002). No edge HTML caching rule exists (TRACKER item 3, owner credentials needed).
- Search and typeahead run synchronous SQLite FTS on the event loop: 222–1,403 ms blocking per search on a developer machine (ARCH-001, measured by the architecture audit on a database copy).
- Images go through `next/image` with `legacy-media` as the source; covers are lazy except above the fold.

## 4. Plan

| ID | Task | Priority | Acceptance | Verification |
|---|---|---|---|---|
| PERF-T1 | Profile the home page (Chrome performance trace, mobile throttling) and record the top 5 long tasks before changing anything | high | Written list of long tasks with their sources | Trace summary committed under `docs/` |
| PERF-T2 | Reduce the home RSC payload: fewer cards above the fold, pass only the fields cards display (no `body`, no unused relations) | high | Home HTML ≤ 120 KB, inline flight data ≤ 50 KB | `curl` size; Lighthouse TBT ≤ 600 ms |
| PERF-T3 | Move search/typeahead FTS off the event loop (worker thread) or cap concurrent searches (ARCH-001) | high | p95 search ≤ 150 ms with 10 parallel requests; other pages stay responsive | Parallel `curl` benchmark on a copy |
| PERF-T4 | Cloudflare cache rule for anonymous HTML plus purge on publish (needs the owner's token) | high | `cf-cache-status: HIT` on `/ar`, TTFB under 200 ms | `curl -I` twice |
| PERF-T5 | Re-run Lighthouse on the deployed build, 3 runs per page, take the median | medium | Home mobile perf ≥ 80; search CLS ≤ 0.1 | `scripts/lighthouse.mjs` |
| PERF-T6 | Collect field data: Search Console Core Web Vitals report and Cloudflare Web Analytics (already allowed by the CSP) | medium | INP, LCP, CLS at p75 recorded | Console screenshots |

## 5. Tool issues found

- `scripts/lighthouse.mjs`: under Git Bash, arguments starting with `/` are rewritten to `C:/Program Files/Git/...`. Run with `MSYS_NO_PATHCONV=1` or from PowerShell.
- Lighthouse intermittently fails with `NO_NAVSTART` (trace not recorded) on a loaded machine, and the desktop preset returned `performance: null` for every page. Treat missing numbers as "not measured", never as zero.
