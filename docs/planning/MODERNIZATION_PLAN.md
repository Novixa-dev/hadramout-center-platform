# Modernization plan — experience, motion, loading, SEO/OG, accounts and new features

**Date:** 2026-10-27 · **Status:** proposal; items move into [NEXT_PLAN](NEXT_PLAN.md) once their sprint is picked.
**Owner:** lead engineer. Decisions marked **DECISION** need the owner or the Center.
**Reads with:** [design system](../02-plan/03-design-system.md) · [FEATURE_PLAN](FEATURE_PLAN.md) · [BACKLOG](BACKLOG.md) · [ROADMAP](ROADMAP.md) · [PERFORMANCE_PLAN](../quality/PERFORMANCE_PLAN.md) · [test runbook](../04-qa/02-test-runbook.md)

## الملخص بالعربية

هذه خطة التحديث القادمة، مرتبة في ست دفعات عمل. لكل بند فيها: لماذا نفعله، وكيف ننفّذه، وكيف نتحقق منه.

1. **الحركة والتحميل.**
   - انتقالات ناعمة بين الصفحات (View Transitions)، لا تعمل إلا في المتصفحات التي تدعمها، ويمكن إيقافها فوراً.
   - هياكل تحميل (skeleton) للأجزاء البطيئة فقط، بطريقة لا تُرجع صفحة «غير موجودة» بحالة 200.
   - صور بمعاينة ضبابية أثناء التحميل.
   - حركات دقيقة محسوبة تحترم خيار «تقليل الحركة».
2. **التنقل والبحث.** بحث سريع بالاختصار Ctrl+K، واقتراحات داخل بحث كل قسم، وترويسة تنكمش عند التمرير.
3. **SEO وبطاقات المشاركة.** اختبارات وحدوية لكل نوع صفحة، وفحص بأدوات Google وفيسبوك ولينكدإن عند الإطلاق، وبطاقات لمواضيع المجلة، وبطاقة لاقتباس يختاره القارئ، وإعلام محركات البحث فوراً عند النشر (IndexNow).
4. **حسابات القرّاء (اختيارية).**
   - تسجيل دخول بلا كلمة مرور عبر رابط في البريد.
   - تتيح مزامنة «قائمتي» بين الأجهزة، والتنبيهات بالبريد، ومراجعات موثّقة.
   - لا تبدأ قبل ثلاثة أمور: مزوّد بريد، وتحديث سياسة الخصوصية، وحماية من الرسائل المزعجة. إن لم تتوفر يبقى الموقع بلا حسابات للزوار، وهذا مقبول تماماً لأرشيف علمي.
5. **أدوات فريق المركز.** سجل نسخ لكل عنصر، ونشر مجدول، ومعاينة قبل النشر، وتحقق بخطوتين.
6. **ميزات جديدة.** مختارات يعدّها المحررون، وبحث متقدم، و«في مثل هذا اليوم» (بتواريخ دقيقة فقط)، و«استشهد بهذه الصفحة» لكل الأنواع، وصفحة إحصاءات للمحررين.

**ما نرفضه عمداً لأنه يجعل الموقع يبدو «قالباً» أو يضر الأداء والوصول:** تحريك مرتبط بالتمرير يتحكم بالصفحة، وخلفيات زجاجية وتدرجات لامعة، ومؤشرات فأرة مخصصة، وشرائح تتحرك تلقائياً، وشاشة تحميل تحجب الصفحة، ومكتبات واجهة ضخمة، ومحادثة ذكاء اصطناعي.

---

## 1. Guard rails (apply to every item)

| Rule | Why | Enforced by |
|---|---|---|
| Arabic-first, RTL, logical CSS properties only | the audience; mirrored layouts must stay correct | design system; arabic-ux-reviewer subagent |
| **Performance budget:** Lighthouse mobile ≥ 90 on the home, list and article templates; CLS ≤ 0.05; no new client JS above **10 KB gzip per feature** without a written reason | the readers are often on slow mobile networks in Yemen and the diaspora | Lighthouse workflow (median of 3), bundle check in the PR notes |
| Every animation off under `prefers-reduced-motion: reduce` | WCAG 2.3.3; vestibular disorders | the existing global rule in `base.css` + an e2e check (to add) |
| No fabricated data, ever (dates, counts, ratings, people) | scholarly archive | review checklist; `npm run quality` |
| A missing page is a **404 status**, never a 200 with "not found" text | SEO; the reason `loading.tsx` was removed | smoke + redirect matrix |
| No design that reads as a generic template: no glassmorphism, neon gradients, floating blobs, emoji icons or stock illustrations | identity of a heritage institution; the owner's explicit requirement | design review before merge, light and dark |
| Native platform first (CSS, `<dialog>`, Popover API, View Transitions); a library only when the platform cannot do it | bundle size, maintenance | this document, §4 |

## 2. Where we are (verified 2026-10-27)

| Area | State | Evidence |
|---|---|---|
| Navigation feedback | `NavProgress`: a thin bar starts on an internal link click or a GET form submit and ends on URL change (10 s safety stop) | `src/components/client/NavProgress.tsx` |
| Motion | results "rise" in on list pages; drawer, language sheet, spinners on busy buttons; reading progress; back-to-top; all neutralised by reduced motion | `pages.css`, `components.css` |
| Skeleton | a `.skeleton` shimmer class exists; **route-level `loading.tsx` is rejected** (it streamed a 200 before `notFound()` → soft 404s) | NEXT_PLAN §3b |
| Page transitions | the design system asks for View Transitions; **not implemented** | grep finds no usage |
| SEO/OG | 0 errors on the live audit; per-type cards with real covers and photos; `profile`/`book`/`article`/`video.other`; JSON-LD per type; Scholar meta; hreflang; sitemap; redirect matrix in CI | [REVIEW_2026-10-27](../reports/REVIEW_2026-10-27.md) |
| Accounts | staff only (admin, editor, reviewer); readers have a browser-only "saved" list with offline reading | `Users.ts`, `SavedList.tsx` |
| Admin | per-role "what needs attention" dashboard, article lead image, titles tidied on write | CHANGELOG 5.13.0 |

## 3. Workstream A — motion, loading and perceived speed

| # | Item | How (concrete) | Acceptance / test | Effort |
|---|---|---|---|---|
| A1 | **Page transitions** | Spike behind a flag: `experimental.viewTransition: true` in `next.config.ts` and React's `<ViewTransition>` around the main content. Use a 200 ms cross-fade. For list → detail, a shared-element morph of the cover/title (`name` per document). **Next.js marks this experimental and "not recommended for production"** ([config docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition), [guide](https://nextjs.org/docs/app/guides/view-transitions)), so it ships only behind an env switch with a one-line rollback. Browsers without support just navigate. | e2e: navigation still works with the flag on and off; no CLS regression; reduced motion = no animation; Lighthouse unchanged | M |
| A2 | **Skeletons the right way** | No route `loading.tsx`. Inside pages, resolve the document (and call `notFound()`) **before** any `<Suspense>`. Then stream only the slow, secondary parts — related items, reviews, "more by this author", per-section counts — behind `<Suspense fallback={<Skeleton…/>}>` with fixed heights. | smoke: unknown ids still 404 (the redirect matrix covers 1,454 + negatives); CLS 0 on article pages; TTFB of the main content does not grow | M |
| A3 | **Better navigation bar** | Keep `NavProgress`. Add `aria-hidden`, a `prefers-reduced-motion` fallback (static bar), and progress tied to the `<form>` filters and pagination. Highlight the destination link in the nav while it loads. | e2e: the bar appears on a slow navigation (throttled) and is gone after load | S |
| A4 | **Image placeholders (LQIP)** | Generate a 16 px blurred WebP (base64, < 600 B) at upload and import time with sharp. Store it in `media` / on the doc, and pass `placeholder="blur"` to `next/image` for covers. | Lighthouse CLS stays 0; total HTML growth < 3 % on list pages | M (F-35) |
| A5 | **Micro-interactions** | Card hover lift (2 px translate + shadow token), focus-visible rings already AA; tabs/chips with 120 ms state transitions; "copied/saved" toast with `aria-live`. Use CSS only. | visual review light/dark; axe clean | S |
| A6 | **Scroll-driven polish (CSS only)** | `animation-timeline: scroll()` for the reading-progress bar (removes its JS listener) and a subtle header shadow after scroll, guarded by `@supports`. **No** scroll-jacking or parallax. | JS for reading progress removed; works without support | S |
| A7 | **Optimistic UI** | Saving/unsaving, review submit and newsletter show the result at once and roll back on failure (React `useOptimistic`). | e2e on save/unsave offline and online | S |
| A8 | **Prefetch tuning** | Keep Next `<Link>` prefetch for visible links. Disable it for long result grids (bandwidth) and prefetch on hover/touchstart instead. | network panel: fewer prefetches on list pages; navigation time unchanged | S |

## 4. UI libraries — decision

| Candidate | Use here? | Reason |
|---|---|---|
| **Native CSS + View Transitions + `<dialog>` + Popover API** | **Yes (default)** | zero JS cost; works with the token system and RTL |
| Motion (`motion`, formerly Framer Motion) | Only if A1/A5 cannot be met natively; import `motion/mini` (~2–3 KB) per component, never the full bundle | heavy for a content site; the platform covers our needs |
| GSAP | No | timeline animation for marketing pages; not our content |
| Radix UI / React Aria primitives | **Maybe** for one complex widget (command palette B1, combobox) if the native version fails accessibility tests | proven a11y; adopt per component, not as a framework |
| Tailwind / shadcn/ui | No | rewriting 87 KB of tokenised CSS buys nothing; shadcn's default look is exactly the template look we avoid |
| Lottie / particles / 3D (three.js) | No | weight and "AI-template" feel |
| Icons | keep the current `Icon.tsx` set (inline SVG); add from Lucide/Tabler **as copied SVGs**, not a package | consistent stroke, no runtime cost |

## 5. Workstream B — navigation, search and reading

| # | Item | Notes | Effort |
|---|---|---|---|
| B1 | **Command palette (Ctrl/⌘ K, and "/" already opens search)** | One dialog: search titles across types (existing typeahead API), jump to sections, switch language/theme. Native `<dialog>` + `role="combobox"`; Arabic shortcut hints. | M |
| B2 | Typeahead inside each section's search (NEXT_PLAN 3c-5) | reuses the rate-limited suggestion endpoint, filtered by type | S |
| B3 | Condensing sticky header on scroll down, revealed on scroll up | CSS + one small listener; never hides the skip link | S |
| B4 | Saved searches + "new since your last visit" badge (browser-only until accounts exist) | localStorage; honest wording ("on this device") | S |
| B5 | Reader mode refinements | typographic scale presets, Naskh/Kufi font choice for long reading (font files must be self-hosted and subset), print layout with source line and QR | M |
| B6 | Accessible pagination + "load more" hybrid | keeps crawlable `?page=N` URLs (SEO); "load more" only as progressive enhancement | S |

## 6. Workstream C — SEO and social cards (test-driven)

| # | Item | Test | Effort |
|---|---|---|---|
| C1 | `buildMetadata` unit tests per type (title/description limits, canonical, hreflang, og:type, absolute image URLs, alt) behind a small `getSite` seam | `npm run check` | S |
| C2 | **Launch-day validation** (cannot run on a noindex staging host): Google Rich Results Test and Schema Markup Validator on 8 templates; Facebook Sharing Debugger, LinkedIn Post Inspector, X/WhatsApp/Telegram previews of book, article, news, issue, author, home | written results in `docs/reports/` with screenshots | S |
| C3 | Topic cards with the topic's own count and lead line; issue cards showing the issue's table of contents (first 3 titles) | `seo-audit` 0/0; cards inspected | S |
| C4 | **Quote card**: a reader selects a passage → "share as image" renders a 1200×630 card with the quote, the author, the source and the Center's mark (server-rendered, same Pango engine; quote ≤ 280 chars; rate-limited) | unit test of the text fitting; e2e share flow | M |
| C5 | IndexNow ping (Bing, Yandex, Seznam) on publish/update; sitemap `lastmod` already correct | job log; only when `SITE_ENV=production` | S |
| C6 | `Dataset` JSON-LD for the open catalogue (CSV/JSON export) and `ItemList` on curated lists | Rich Results Test | S |
| C7 | Image sitemap entries for covers (Google Images) | sitemap test | S |
| C8 | Search Console + Bing Webmaster on the final domain; field Core Web Vitals via Cloudflare Web Analytics | G9/G10 | S (owner) |

## 7. Workstream D — accounts and users

### D1. Staff (exists) — next improvements

| Item | Why | How |
|---|---|---|
| **2FA for the admin** (**DECISION**, recommended: Cloudflare Access in front of `/admin`; TOTP plugin as alternative) | single password today | no code for Cloudflare Access; runbook entry |
| **Version history + restore** on content (Payload `versions`, `maxPerDoc: 20`) | undo editorial mistakes; audit trail | migration (version tables), tested up/down/up |
| **Drafts + scheduled publishing** (Payload `drafts` with `schedulePublish`) | publish news at a set time | needs the jobs runner (already configured) |
| **Live preview** of a draft on the real page | editors see what readers see | Payload live preview with a signed preview route; `noindex` |
| Editorial workflow option: editor submits → admin publishes (**DECISION**) | quality control for a scholarly site | a `reviewStatus` field + access rule; optional |
| Staff activity log (who changed what) | accountability | comes with versions |

### D2. Reader accounts — optional, phased

**Should the archive have reader accounts at all? (DECISION)** The site works fully without them. Accounts add value for researchers:
- the saved list and saved searches follow them across devices;
- email alerts for an author or topic;
- reviews carry a verified name;
- book requests have a history.

They also add a privacy duty, spam risk and a dependency on an email provider.

| Phase | Scope | Prerequisites |
|---|---|---|
| D2.0 (now) | none; keep browser-only saving and RSS per topic/author (already shipped) | — |
| D2.1 | **Passwordless sign-in by email link** in a **separate `readers` auth collection**, never `users`, so a reader can never reach `/admin`. Profile = display name + language. Sync of the saved list (merge with the local list on first sign-in). | mail provider (F-46); privacy policy update (SEC-009); Cloudflare Turnstile on sign-up; rate limits; data export + delete account |
| D2.2 | Email alerts per author/topic (weekly digest, one-click unsubscribe, List-Unsubscribe header) | D2.1; DMARC/SPF on the domain |
| D2.3 | Verified reviews (reader name shown) and request history | D2.1 |

Payload supports several auth collections. It has **no built-in magic link**, so D2.1 needs a custom endpoint that issues a single-use, short-lived (15 min), hashed token and exchanges it for a session cookie, plus separate cookie and CSRF settings ([Payload auth overview](https://payloadcms.com/docs/v3/authentication/overview.md), [auth emails](https://payloadcms.com/docs/v3/authentication/email.md)). Before building, the security-reviewer subagent reviews the token design.

**What we will not do:** social login with tracking SDKs, passwords for readers, or public profiles.

## 8. Workstream E — new features (ranked)

| Rank | Feature | Value | Risk / dependency |
|---|---|---|---|
| 1 | **Curated collections** ("Hadhrami poets", "Mukalla history"): editors pick items, add an intro; the collection gets a page, an RSS feed and an `ItemList` JSON-LD | discovery, teaching | content model change; editors' time |
| 2 | **Advanced search**: exact phrase, exclude, author:/year: filters, saved searches | researchers | keep the plain box as default |
| 3 | **Cite this page** for events and videos (books/articles have it) + per-author bibliography export (RIS/BibTeX) | consistency; scholars | citation convention for events |
| 4 | **Editors' insights page** in the admin: zero-result searches, top 404 paths, most-read items (from the existing logs) | editors act on real demand | privacy: aggregates only |
| 5 | **On this day** (home widget) from day-precise dates only | engagement | must never use estimated dates |
| 6 | Timeline expansion with sourced, committee-reviewed entries | education | the Center's scientific review |
| 7 | **PDF search** after PDF hosting is decided (G4) | high for scholars | OCR text never presented as authoritative |
| 8 | Places gazetteer + map of Hadhramout (towns linked to articles) | exploration | needs verified coordinates; no invented locations |
| 9 | Audio narration of selected articles (recorded, not synthetic) | accessibility, diaspora | needs the Center's recordings |

## 9. Workstream F — quality, operations, performance

| Item | How |
|---|---|
| Error telemetry | self-hosted GlitchTip (Sentry-compatible) or Sentry free tier; scrub personal data; alerts to the owner |
| Uptime monitor | external check on `/api/hc/health` every 5 min (UptimeRobot / Better Stack) — G10 |
| Off-server backups | nightly `rclone` copy to object storage + a monthly restore rehearsal — SEC-007 |
| CSP without `unsafe-inline` | nonce-based CSP; measure dynamic-rendering cost first (SEC-001) |
| Visual regression | screenshots of 12 templates × light/dark × 390/1440 px compared on every PR (Playwright or Puppeteer + pixelmatch), stored as CI artifacts |
| Accessibility | axe inside the e2e run on 8 templates; a manual keyboard + NVDA/VoiceOver pass before launch (G6) |
| Fonts | subset the Arabic fonts to the used ranges; `font-display: swap`; preload only the body weight |

## 10. Sprint plan (2-week sprints, in order)

| Sprint | Goal | Items | Exit criteria |
|---|---|---|---|
| S1 — Feel fast | motion and loading without regressions | A2, A3, A4, A5, A6, C1 | smoke/e2e green; Lighthouse ≥ 90 mobile; CLS 0; reduced-motion e2e |
| S2 — Find faster | navigation and search | B1, B2, B3, B6, A8 | e2e for palette and typeahead; axe clean on the dialog |
| S3 — Share better | social and structured data | C3, C4, C6, C7, A1 spike (flagged) | `seo-audit` 0/0; quote-card e2e; spike report with numbers |
| S4 — Editors | staff tools | versions + restore, drafts + scheduling, live preview, insights page (E4) | migrations up/down/up; editor guide updated |
| S5 — Launch prep | gates | C2, C5, C8, telemetry, uptime, backups, manual a11y pass | ROADMAP G5–G10 closed |
| S6+ — Readers (if approved) | accounts | D2.1 → D2.2 → D2.3 | security review of the token flow; privacy text approved |

## 11. Rejected on purpose

| Idea | Why not |
|---|---|
| Full-page splash/loader | delays content; hides real speed |
| Infinite scroll replacing pagination | breaks crawlability, back button and footer access |
| Scroll-jacking, heavy parallax, custom cursors, particles | accessibility, battery, the template look |
| Auto-rotating hero carousels | low engagement, WCAG 2.2.2 issues |
| Chatbot / AI summaries / semantic AI search | accuracy risk in a scholarly archive (F-44, F-45) |
| Reader passwords and social logins | security and privacy cost without benefit |
| A UI framework migration (Tailwind/shadcn) | high cost, no user value, generic look |

## 12. Definition of done (every item)

1. `npm run check` green; route/config changes also `npm run build && npm run smoke` (with `RUN_E2E=1`).
2. A test at the cheapest level that can see the behaviour (unit, smoke, browser journey).
3. Light and dark at 390 and 1440 px checked; reduced motion checked; axe clean.
4. Lighthouse median (CI) does not drop below the budget.
5. Docs updated in the same commit: PROGRESS, BACKLOG/FEATURE_PLAN, CHANGELOG, and the editor guide if the admin changed.
6. After the deploy: `cutover-check`, `seo-audit`, `site-sweep`, `e2e` against the live URL.
