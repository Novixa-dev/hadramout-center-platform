/**
 * Promotions ("ads"): the Center's own campaigns shown on the site for a set time — an event, a new release, a call for
 * papers, a donation campaign, a store offer. Pure logic shared by the server (what to send), the pre-paint script in
 * `<head>` (what to hide before the first paint, so a cached page still honours the start/end minute and nothing shifts)
 * and the client components (what to show after navigation). Design: docs/planning/PROMOTIONS_DESIGN.md.
 */

export const PROMO_FORMATS = ['bar', 'card', 'popup', 'corner'] as const;
export type PromoFormat = (typeof PROMO_FORMATS)[number];

export const PROMO_KINDS = ['event', 'release', 'call', 'donation', 'project', 'store', 'volunteer', 'partner', 'notice'] as const;
export type PromoKind = (typeof PROMO_KINDS)[number];

export const PROMO_TONES = ['brand', 'gold', 'paper'] as const;
export type PromoTone = (typeof PROMO_TONES)[number];

/** Page keys an editor can target: the first path segment after the language (`/ar/books/5` → `books`), `home` for `/ar`. */
export const PROMO_PAGES = [
  'home', 'articles', 'books', 'magazines', 'events', 'forum', 'news', 'videos', 'audio', 'podcast', 'announcements',
  'encyclopedia', 'culture', 'store', 'donate', 'volunteer', 'submit', 'about', 'support', 'partners', 'search', 'authors',
  'topics', 'timeline', 'contact',
] as const;

export type PromoDevice = 'all' | 'mobile' | 'desktop';
export type PromoFrequency = 'once' | 'session' | 'always';
export type PromoEvent = 'view' | 'click' | 'close';
export const PROMO_EVENTS: readonly PromoEvent[] = ['view', 'click', 'close'];

/** What the visibility decision needs: small enough to inline into the page for the pre-paint script. */
export interface PromoRule {
  id: number;
  format: PromoFormat;
  /** start and end as epoch ms; end null = open-ended */
  start: number;
  end: number | null;
  /** empty = every page */
  pages: string[];
  device: PromoDevice;
  /** days a closed promotion stays hidden for this visitor; 0 = until the browser session ends */
  hideDays: number;
  /** popup/corner only: how often the same visitor sees it */
  freq: PromoFrequency;
}

export interface PromoView extends PromoRule {
  kind: PromoKind;
  tone: PromoTone;
  headline: string;
  text: string | null;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
  cta: { label: string; href: string; external: boolean } | null;
  dismissible: boolean;
  /** popup/corner: wait this many seconds, or until the visitor scrolled 40% of the page */
  trigger: 'delay' | 'scroll';
  delay: number;
  priority: number;
}

export interface StoreLike {
  getItem(key: string): string | null;
}

/** Storage keys, one place: closed (`x`) and seen (`s`). */
export const promoKey = (kind: 'x' | 's', id: number): string => `hc-promo-${kind}-${id}`;

/**
 * Is this promotion live for this visitor, on this page, on this device, right now? Self-contained on purpose (no outer
 * names, plain ES2017): its source is inlined into the page by `promoHeadScript`, so the pre-paint decision and the
 * client components can never disagree. Storage that throws (private mode) counts as empty.
 */
export function promoVisible(r: PromoRule, now: number, path: string, mobile: boolean, ls: StoreLike | null, ss: StoreLike | null): boolean {
  if (now < r.start || (r.end !== null && now >= r.end)) return false;
  const seg = path.split('?')[0]!.split('#')[0]!.split('/').filter(Boolean);
  const page = seg.length > 1 ? seg[1]! : 'home';
  if (r.pages.length > 0 && r.pages.indexOf(page) < 0) return false;
  // overlays never interrupt a visitor's own account screens
  if ((r.format === 'popup' || r.format === 'corner') && page === 'account') return false;
  if ((r.device === 'mobile' && !mobile) || (r.device === 'desktop' && mobile)) return false;
  const get = (s: StoreLike | null, k: string): string | null => {
    try {
      return s ? s.getItem(k) : null;
    } catch {
      return null;
    }
  };
  const closedAt = Number(get(ls, 'hc-promo-x-' + r.id) || 0);
  if (closedAt && now - closedAt < r.hideDays * 86400000) return false;
  if (get(ss, 'hc-promo-x-' + r.id)) return false;
  if (r.format === 'popup' || r.format === 'corner') {
    if (r.freq === 'once' && get(ls, 'hc-promo-s-' + r.id)) return false;
    if (r.freq === 'session' && get(ss, 'hc-promo-s-' + r.id)) return false;
  }
  return true;
}

/** Order of preference within one format: higher priority first, then the newest. */
export function byPriority<T extends { id: number; priority: number }>(a: T, b: T): number {
  return b.priority - a.priority || b.id - a.id;
}

/** The one promotion of a format to show (the list is already in priority order), or null. */
export function pickPromo<T extends PromoRule>(items: T[], format: PromoFormat, now: number, path: string, mobile: boolean, ls: StoreLike | null, ss: StoreLike | null): T | null {
  for (const r of items) if (r.format === format && promoVisible(r, now, path, mobile, ls, ss)) return r;
  return null;
}

/** Below this width a visitor counts as "mobile" for device targeting (the site's phone layout). */
export const MOBILE_QUERY = '(max-width: 760px)';

const ruleOf = (p: PromoRule): PromoRule => ({ id: p.id, format: p.format, start: p.start, end: p.end, pages: p.pages, device: p.device, hideDays: p.hideDays, freq: p.freq });

/**
 * The pre-paint script: for the server-rendered formats (bar, card) it keeps the first live promotion of each format and
 * hides every other candidate with a style rule, before anything is painted. A component that has taken over sets
 * `data-live`, which the rule ignores, so client navigation is decided by React afterwards.
 */
export function promoHeadScript(rules: PromoRule[]): string {
  const data = JSON.stringify(rules.filter((r) => r.format === 'bar' || r.format === 'card').map(ruleOf)).replace(/</g, '\\u003c');
  return (
    `(function(){try{var V=${String(promoVisible)};var R=${data};var n=Date.now(),p=location.pathname,m=matchMedia(${JSON.stringify(MOBILE_QUERY)}).matches,l=null,s=null;` +
    `try{l=localStorage}catch(e){}try{s=sessionStorage}catch(e){}var w={},h=[];` +
    `for(var i=0;i<R.length;i++){var r=R[i];if(!w[r.format]&&V(r,n,p,m,l,s))w[r.format]=1;else h.push('[data-promo="'+r.id+'"]:not([data-live])')}` +
    `if(h.length){var st=document.createElement('style');st.id='hc-promo-hide';st.textContent=h.join(',')+'{display:none!important}';document.head.appendChild(st)}}catch(e){}})()`
  );
}

/** A link an editor typed: a site path (gets the language prefix) or an https/http URL; anything else is dropped. */
export function promoHref(raw: string | null | undefined, localize: (path: string) => string): { href: string; external: boolean } | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//')) {
    // already language-prefixed (/ar/…, /en/…) or an API/file path: leave as typed
    if (/^\/[a-z]{2,3}(-[A-Za-z]{2,4})?(\/|$)/.test(v) || v.startsWith('/api/') || v.startsWith('/legacy-media/') || v.startsWith('/media/')) return { href: v, external: false };
    return { href: localize(v), external: false };
  }
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? { href: u.toString(), external: true } : null;
  } catch {
    return null;
  }
}

/** Editor-side validation of the link field: same rule as `promoHref`. */
export function validPromoLink(v: string | null | undefined): true | string {
  if (!v) return true;
  return promoHref(v, (p) => p) ? true : 'رابط يبدأ بـ ⁨/⁩ أو ⁨https://⁩ فقط / a path starting with / or an https:// URL only';
}

/** Click-through rate as a whole percentage with one decimal, or null with no views. */
export function ctr(views: number, clicks: number): number | null {
  return views > 0 ? Math.round((clicks / views) * 1000) / 10 : null;
}

/** Schedule state for the admin list: draft, scheduled (not started), live, ended. */
export function promoState(status: string | null | undefined, startAt: string | null | undefined, endAt: string | null | undefined, now = Date.now()): 'draft' | 'scheduled' | 'live' | 'ended' {
  if (status !== 'published') return 'draft';
  const start = startAt ? Date.parse(startAt) : 0;
  const end = endAt ? Date.parse(endAt) : null;
  if (end !== null && now >= end) return 'ended';
  if (now < start) return 'scheduled';
  return 'live';
}

/** Browsers that ask not to be tracked send no counts at all. */
export function trackingAllowed(nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean } | undefined): boolean {
  if (!nav) return false;
  return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
}
