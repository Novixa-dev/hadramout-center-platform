# Promotions ("ads") — design

**Status:** built 2026-11-20 · **Code:** `src/lib/promotions.ts` (rules), `src/lib/promotions-data.ts` + `src/lib/promotion-view.ts` (server), `src/components/client/Promotions.tsx` (UI), `src/collections/Promotions.ts` (admin), `src/app/api/hc/promo/route.ts` (counts), `src/styles/promotions.css` · **Tests:** `tests/unit/promotions.test.ts`, `scripts/promo-check.mjs` (in `npm run smoke`).
**Origin:** the Center's meeting of 2026-11-06 asked for event announcements that switch on and off at set times ([traceability](../client/07-meeting-2026-11-06-traceability-ar.md)); the owner asked on 2026-11-20 for a full ads system (types, placement, timing, interaction, scheduling with date and time).

## 1. What an "ad" is on this site

The Center's **own** campaigns, never third-party ad networks. An ad network would put foreign scripts and trackers on a scholarly archive, need CSP exceptions and a consent banner, and pay very little at this audience size. What the Center has to promote:

| Purpose (`kind`) | Label shown | Typical link |
|---|---|---|
| event | فعالية | `/events/…`, registration form |
| release | إصدار جديد | `/books/…`, `/store` |
| call | دعوة للمشاركة | `/submit` |
| donation | حملة تبرع | `/donate` |
| project | مشروع للدعم | `/projects-exhibition` |
| store | عرض في المتجر | `/store` |
| volunteer | دعوة للتطوع | `/volunteer` |
| partner | برعاية شريك | the partner's site (`rel="sponsored"`) |
| notice | تنبيه | anything |

Official notices and circulars stay in **Announcements** (`/announcements`), which has its own pinned bar, home section and calendar files. A pinned official announcement wins the top of the page: no promotion bar is shown beside it.

## 2. Formats and where they appear

| Format | Where | Behaviour |
|---|---|---|
| **bar** | above the header on every (targeted) page | one line (two on phones), button link, optional close |
| **card** | home page after the numbers strip and official announcements; after the text of every reading page (articles, books, events…), outside `<article>`. Nowhere else | image, label, headline, text, button; optional close |
| **popup** | over the page | native modal `<dialog>`: centred on desktop, **bottom sheet on phones** (≤ 72 % of the screen). Always closable (×, Escape, backdrop). Never on arrival: after its delay (≥ 3 s, default 8 s) or 40 % scroll; waits while the visitor types or another dialog is open |
| **corner** | small card at the bottom start corner (away from back-to-top) | non-modal, always closable (× or Escape); full-width strip on phones, where back-to-top waits until it is closed; below the phone menu and hidden while the menu or the filters sheet is open; focus is kept clear of it |

One promotion per format per page, chosen by **priority** (0–100), then the newest. Popup and corner never show together: the popup wins. Overlays never appear on `/account`.

## 3. Targeting and timing

- **Schedule:** `startAt` (required) and `endAt` (optional), date **and time**, picked in the editor's local time in 15-minute steps; stored in UTC. Admin list shows a chip: مسودة / مجدول / يظهر الآن / انتهى.
- **Pages:** none = every page; otherwise any of 25 sections (home, books, events, store…). A section includes its own pages (Books = the list and every book).
- **Devices:** all, phones only (≤ 760 px), desktop/tablet only.
- **Exact times on cached pages.** Pages are cached up to 5 minutes (ISR). The server sends every published promotion that has not ended and starts within **24 hours**; a tiny script in `<head>` (built from the very same function the components use, `promoVisible`) decides before the first paint which bar and card are live for this visitor, page, device and minute, and hides the others with a style rule. Result: start/end honoured to the minute, **no layout shift** (measured CLS 0 in Chrome), no flash of a closed bar. An open page also switches at the next start/end without a reload.
- **Privacy of scheduled launches:** public REST (`/api/promotions`) shows only published promotions that have started; the page source contains a scheduled one at most 24 h early. Do not schedule anything secret.

## 4. Visitor interaction

| Action | Effect |
|---|---|
| close (×) | hidden for `hideDays` (default 7; 0 = until the browser session ends); counted as a *close* |
| click the button | counted as a *click*; the promotion is then treated as closed (no nagging after the visitor acted) |
| popup/corner frequency | once per visitor (default) · once per visit · every page until closed |
| keyboard | popup: focus moves in, Escape closes, focus returns; corner: Escape closes, Tab never lands on an element hidden under it (WCAG 2.4.11); on the green tone the focus ring turns white |
| other languages | headline, text and button carry `dir="auto"`, so an untranslated Arabic line still reads right-to-left on an English page |
| reduced motion | no animation |
| print | promotions are not printed |

Choices live in the visitor's own browser (`localStorage`/`sessionStorage` keys `hc-promo-x-<id>` and `hc-promo-s-<id>`); with storage blocked a promotion simply shows.

## 5. Measurement without tracking people

`POST /api/hc/promo` with `{"id":12,"e":"view"|"click"|"close"}` via `navigator.sendBeacon` (text/plain: no preflight; survives the page unloading after a click). Stored as **daily totals** per promotion in the `extras` database (`promo_stats`); no cookie, IP, or visitor id. Refused or ignored: other sites' origins (403), malformed or oversized bodies (400/413), unknown or unpublished ids, crawlers and link previews; 300 counts per hour per (daily-salted, hashed) client. Browsers with Do-Not-Track or Global Privacy Control send nothing. Deleting a promotion deletes its counts (SQLite reuses a deleted row's id). The edit view shows views, clicks, click rate and closes for the last 7 days and all time (`GET /api/hc/promo?id=`, staff only, `no-store`).

## 6. Who can do what

Editors and admins create, edit, schedule and publish; reviewers translate the headline/text/button only; only admins delete; visitors read started, published promotions. Headline, text and button label are translated automatically like other content. A dedicated "marketing" role is not added (BACKLOG CF-ROLE-MARKETING): every signed-in user counts as staff in the access rules, so a new role needs an access review first.

## 7. Editorial guidance (for the admin guide)

- Headline ≤ 90 characters, text ≤ 240, button ≤ 30. One clear action per promotion.
- Use the **popup** rarely (one campaign at a time, once per visitor); a **card** or **bar** is enough for most news.
- Images: 1200 × 630 with alt text in the media library; edges are cropped on different screens, so no important text in the image.
- Prefer site paths (`/donate`) to full URLs: the language is added automatically.

## 8. Not built (yet), on purpose

A/B variants, per-language targeting, geographic targeting, frequency caps across promotions, an ads calendar view, and paid placements. Add only when the Center asks: each adds editor burden or tracking.
