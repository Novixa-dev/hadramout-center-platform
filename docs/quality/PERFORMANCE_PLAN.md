# Performance baseline and plan

**Purpose:** measured performance state and a prioritised plan. **Scope:** public pages. **Last updated:** 2026-10-19
**Method caveat:** Lighthouse lab runs from one Windows machine, one run per page, simulated mobile throttling. They are indicative, not field data (no CrUX/Search Console data was available). Desktop runs returned no performance metrics (see "Tool issues").
**Related:** [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md) (ARCH-001/002/015) · [PROGRESS](../planning/PROGRESS.md) · [TRACKER](../03-tracking/TRACKER.md) items 3, 4, 7

## 0. Latest evidence — read this first (2026-10-21)

Measured on a clean GitHub runner by `.github/workflows/lighthouse.yml` (build + seeded DB + standalone server, **median of 3 runs**, mobile preset). Weekly, on demand, and on any change to the Lighthouse scripts.

| Page | Performance | TBT (ms) | CLS | FCP modeled (ms) | LCP modeled (ms) | **LCP observed (ms)** | A11y |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/ar` | 93 | 79 | 0 | 926 | 3112 | **≈ 200** | 100 |
| `/ar/articles/894` | 94 | 50 | 0.001 | 1232 | 2864 | **≈ 210** | 100 |
| `/ar/books/37` | 92 | 67 | 0 | 1384 | 3351 | **≈ 180** | 100 |

What this changes:
- **The site is fast in the lab.** The earlier numbers in §1–§2 (home performance 53, TBT ≈ 2 s) came from a loaded developer laptop and the previous build; on a clean runner TBT is under 100 ms and performance is 92–95. The "heavy hydration" hypothesis in §2 is **withdrawn**.
- **"LCP ≈ 3 s" is a model, not a measurement.** Lighthouse's mobile LCP simulates a slow phone on slow 4G (150 ms RTT, 1.6 Mbps, 4× CPU); Chrome itself measures about 0.2 s. The report shows both and judges neither; the real LCP target (≤ 2.5 s at the 75th percentile) can only be judged on **field data**.
- **Run-to-run noise is ±150–300 ms** (the unchanged home page measured 3112 and 2977 ms in two runs). Differences smaller than that are not evidence.
- **Experiments rejected on evidence:** fewer `next/image` widths (−7.6 % HTML, but stale cached pages would 400), moving the skyline SVG to a file (negligible), and preloading the Naskh 400 reading font on detail pages — an A/B on the runner gave FCP −160…−300 ms on article/book pages but a **worse** modeled article LCP (2864 → 3513 ms), i.e. no proven gain.
- **What can still matter to real visitors in Yemen and the Gulf** is network latency to the server and whether Cloudflare caches HTML (today pages are `no-store`/DYNAMIC except the home page; see [ARCH-002](../planning/BACKLOG.md)). That is the next lever, and it needs the owner's Cloudflare access plus field data.

Revised plan: PERF-T1 (profile on a quiet machine) **done**; PERF-T5 (repeat on CI) **done** by the workflow; PERF-T2 (shrink the RSC payload) **demoted** — no measured benefit; PERF-T3 (search off the event loop) and PERF-T4 (Cloudflare HTML cache + purge) stay **high**; PERF-T6 (field data: Search Console Core Web Vitals, Cloudflare Web Analytics) is the way to judge LCP.

## 1. History — baseline measured on production and a laptop (older build; superseded by §0)

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

## 2b. First profile and experiments (2026-10-20, local production build, single run, noisy host)

Lighthouse mobile on `/ar`: performance 57, FCP 1.2 s, LCP 4.4 s, TBT 1.7 s, CLS 0. Main-thread work 6.2 s under 4× throttling: **Style & Layout 2.6 s**, Script evaluation 1.8 s (the two largest chunks: 0.9 s and 0.75 s), Other 1.2 s, HTML/CSS parse 0.3 s; 9 long tasks. Lighthouse warned the host CPU is slower than expected, so absolute numbers are inflated; only the ranking is informative.

Structure: 813 elements, DOM depth 8, 62 KB minified CSS (about 620 rules, one `:has`, 5 `content-visibility` sections), 9 `@font-face`.

Tried and **rejected** with evidence:

| Idea | Measured | Decision |
|---|---|---|
| Fewer `next/image` widths (15 → 8) | `srcset` text 40 KB → 25 KB, home HTML 200 KB → 185 KB (-7.6%), inline RSC data unchanged (100 KB) | Rejected: small gain, and Cloudflare serves stale HTML (`stale-while-revalidate`) whose old widths would return 400 from `/_next/image` |
| Move the 7.8 KB decorative skyline SVG to a file | Appears twice (HTML + RSC data) but compresses to almost nothing | Rejected: negligible transfer gain, needs CSS mask (older-browser risk) |

Conclusion: the RSC data is the serialized React tree (191 links, 317 class names), i.e. proportional to the number of rendered cards, and cannot be shrunk without showing less. Next steps are therefore (a) repeat the profile on a quiet machine or a CI runner, three runs, (b) look at what forces 2.6 s of style/layout (font swap re-layouts, `content-visibility` sections, large grids) with a Chrome trace, and (c) decide with the Center how many cards the home page needs.

## 3. Verified facts that constrain the plan

- Production HTML for the home page is served with `s-maxage=300, stale-while-revalidate`, but content and list pages are `no-store` and Cloudflare reports DYNAMIC (ARCH-002). No edge HTML caching rule exists (TRACKER item 3, owner credentials needed).
- Search and typeahead run synchronous SQLite FTS on the event loop: 222–1,403 ms blocking per search on a developer machine (ARCH-001, measured by the architecture audit on a database copy).
- Images go through `next/image` with `legacy-media` as the source; covers are lazy except above the fold.

## 4. Plan

| ID | Task | Priority | Acceptance | Verification |
|---|---|---|---|---|
| PERF-T1 | Profile the home page (Chrome performance trace, mobile throttling) and record the top 5 long tasks before changing anything | high | Written list of long tasks with their sources | Trace summary committed under `docs/` |
| PERF-T2 | Reduce the home RSC payload: fewer cards above the fold, pass only the fields cards display (no `body`, no unused relations) | high | Home HTML ≤ 120 KB, inline flight data ≤ 50 KB | `curl` size; Lighthouse TBT ≤ 600 ms |
| PERF-T3 | Move search/typeahead FTS off the event loop (worker thread). **Partly done:** a 60 s result cache (invalidated by index writes) makes repeats cheap (query "حضرموت": >1 s of blocking → ~0.2 s page time); typeahead is rate-limited. Cold queries still block (1.2 s measured for the slowest) | high | p95 search ≤ 150 ms with 10 parallel requests; other pages stay responsive | Parallel `curl` benchmark on a copy |
| PERF-T4 | Cloudflare cache rule for anonymous HTML plus purge on publish (needs the owner's token) | high | `cf-cache-status: HIT` on `/ar`, TTFB under 200 ms | `curl -I` twice |
| PERF-T5 | Re-run Lighthouse on the deployed build, 3 runs per page, take the median | medium | Home mobile perf ≥ 80; search CLS ≤ 0.1 | `scripts/lighthouse.mjs` |
| PERF-T6 | Collect field data: Search Console Core Web Vitals report and Cloudflare Web Analytics (already allowed by the CSP) | medium | INP, LCP, CLS at p75 recorded | Console screenshots |

## 5. Tool issues found

- `scripts/lighthouse.mjs`: under Git Bash, arguments starting with `/` are rewritten to `C:/Program Files/Git/...`. Run with `MSYS_NO_PATHCONV=1` or from PowerShell.
- Lighthouse intermittently fails with `NO_NAVSTART` (trace not recorded) on a loaded machine, and the desktop preset returned `performance: null` for every page. Treat missing numbers as "not measured", never as zero.
