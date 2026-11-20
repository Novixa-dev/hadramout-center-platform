'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MOBILE_QUERY, pickPromo, promoKey, promoVisible, trackingAllowed, type PromoEvent, type PromoFormat, type PromoKind, type PromoView, type StoreLike } from '../../lib/promotions.ts';
import { Icon } from '../Icon.tsx';

/**
 * The Center's promotions on the page (src/lib/promotions.ts has the rules; docs/planning/PROMOTIONS_DESIGN.md the why).
 * Bar and card are rendered by the server and pruned before the first paint by the head script; once mounted, React
 * decides (and marks its element `data-live`, which the pre-paint rule ignores). Popup and corner exist only in the browser.
 */

export interface PromoLabels {
  kinds: Record<PromoKind, string>;
  close: string;
  newTab: string;
  region: string;
}

const storage = (kind: 'local' | 'session'): StoreLike | null => {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

const write = (kind: 'local' | 'session', key: string, value: string) => {
  try {
    (kind === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // storage blocked: the choice lasts for this page view only
  }
};

/** One anonymous count. `sendBeacon` survives the page unloading after a click; text/plain needs no preflight. */
function track(id: number, e: PromoEvent) {
  try {
    if (!trackingAllowed(navigator as Navigator & { globalPrivacyControl?: boolean })) return;
    const body = JSON.stringify({ id, e });
    if (!navigator.sendBeacon?.('/api/hc/promo', body)) void fetch('/api/hc/promo', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // counting must never break the page
  }
}

/** Closing (or following) a promotion hides it for `hideDays` days, or for the browser session when that is 0. */
function rememberClosed(p: PromoView) {
  if (p.hideDays > 0) write('local', promoKey('x', p.id), String(Date.now()));
  else write('session', promoKey('x', p.id), '1');
}

const decide = (items: PromoView[], format: PromoFormat, path: string): PromoView | null =>
  pickPromo(items, format, Date.now(), path, window.matchMedia(MOBILE_QUERY).matches, storage('local'), storage('session'));

/** The next start or end among the promotions, so an open page changes at the right minute too (capped at 6 h). */
function nextBoundary(items: PromoView[], now: number): number | null {
  let next: number | null = null;
  for (const p of items) for (const t of [p.start, p.end]) if (t !== null && t > now && (next === null || t < next)) next = t;
  return next === null ? null : Math.min(next - now + 500, 6 * 3_600_000);
}

/** null before mount (server markup stands), then the live promotion of the format for this page, re-decided on navigation. */
function useLive(items: PromoView[], format: PromoFormat): { mounted: boolean; item: PromoView | null; dismiss: () => void } {
  const path = usePathname();
  const [state, setState] = useState<{ mounted: boolean; item: PromoView | null }>({ mounted: false, item: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setState({ mounted: true, item: decide(items, format, path) });
    const wait = nextBoundary(items, Date.now());
    if (wait === null) return;
    const t = window.setTimeout(() => setTick((n) => n + 1), wait);
    return () => window.clearTimeout(t);
  }, [items, format, path, tick]);
  // one view per promotion per page shown
  const shownId = state.item?.id;
  useEffect(() => {
    if (shownId) track(shownId, 'view');
  }, [shownId, path]);
  const dismiss = useCallback(() => setState({ mounted: true, item: null }), []);
  return { ...state, dismiss };
}

function Cta({ p, labels, className, onFollow }: { p: PromoView; labels: PromoLabels; className: string; onFollow: () => void }) {
  if (!p.cta) return null;
  const follow = () => {
    track(p.id, 'click');
    rememberClosed(p);
    onFollow();
  };
  // editor text may be untranslated Arabic on another language's page: let the browser find its direction
  const content: ReactNode = (
    <>
      <span dir="auto">{p.cta.label}</span> {p.cta.external ? <Icon name="external" /> : <Icon name="arrow" className="icon icon--flip" />}
    </>
  );
  if (!p.cta.external) {
    return (
      <Link className={className} href={p.cta.href} onClick={follow} prefetch={false}>
        {content}
      </Link>
    );
  }
  return (
    <a className={className} href={p.cta.href} onClick={follow} target="_blank" rel={p.kind === 'partner' ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}>
      {content}
      <span className="sr-only"> {labels.newTab}</span>
    </a>
  );
}

function CloseButton({ p, labels, className, onClose }: { p: PromoView; labels: PromoLabels; className: string; onClose: () => void }) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label={labels.close}
      onClick={() => {
        track(p.id, 'close');
        rememberClosed(p);
        onClose();
      }}
    >
      <Icon name="close" />
    </button>
  );
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */

function BarView({ p, labels, live, onDone }: { p: PromoView; labels: PromoLabels; live: boolean; onDone: () => void }) {
  return (
    <aside className={`promo-bar promo--${p.tone} no-print`} data-promo={p.id} data-live={live ? '' : undefined} aria-label={labels.region}>
      <div className="container promo-bar__row">
        <span className={`promo-bar__kicker promo-bar__kicker--${p.kind}`}>{labels.kinds[p.kind]}</span>
        <p className="promo-bar__text" dir="auto">
          <strong>{p.headline}</strong>
        </p>
        <Cta p={p} labels={labels} className="promo-bar__cta" onFollow={onDone} />
        {p.dismissible ? <CloseButton p={p} labels={labels} className="promo-bar__close" onClose={onDone} /> : null}
      </div>
    </aside>
  );
}

/** The promotion bar above the header (layout). Every candidate is in the server markup; the head script keeps one. */
export function PromoBar({ items, labels }: { items: PromoView[]; labels: PromoLabels }) {
  const { mounted, item, dismiss } = useLive(items, 'bar');
  if (!mounted) return <>{items.map((p) => <BarView key={p.id} p={p} labels={labels} live={false} onDone={dismiss} />)}</>;
  return item ? <BarView p={item} labels={labels} live onDone={dismiss} /> : null;
}

/* ── In-page card ────────────────────────────────────────────────────────── */

function CardView({ p, labels, live, onDone }: { p: PromoView; labels: PromoLabels; live: boolean; onDone: () => void }) {
  const h = `promo-${p.id}-h`;
  return (
    <aside className={`promo-card promo--${p.tone} no-print`} data-promo={p.id} data-live={live ? '' : undefined} aria-labelledby={h}>
      {p.image ? <img className="promo-card__img" src={p.image.url} alt={p.image.alt} width={p.image.width ?? undefined} height={p.image.height ?? undefined} loading="lazy" decoding="async" /> : null}
      <div className="promo-card__body">
        <p className="promo-card__kicker">{labels.kinds[p.kind]}</p>
        <h2 id={h} className="promo-card__title" dir="auto">{p.headline}</h2>
        {p.text ? <p className="promo-card__text" dir="auto">{p.text}</p> : null}
        <Cta p={p} labels={labels} className={`btn ${p.tone === 'brand' ? 'btn--gold' : 'btn--primary'} promo-card__cta`} onFollow={onDone} />
      </div>
      {p.dismissible ? <CloseButton p={p} labels={labels} className="promo-card__close" onClose={onDone} /> : null}
    </aside>
  );
}

/** A promotion card inside a page (home, end of reading pages); `items` are the cards meant for this page. */
export function PromoCardSlot({ items, labels, contained = true }: { items: PromoView[]; labels: PromoLabels; contained?: boolean }) {
  const { mounted, item, dismiss } = useLive(items, 'card');
  if (items.length === 0) return null;
  // the slot itself has no spacing: a card hidden before paint leaves no gap
  const cls = contained ? 'container promo-slot' : 'promo-slot';
  if (!mounted) return <div className={cls}>{items.map((p) => <CardView key={p.id} p={p} labels={labels} live={false} onDone={dismiss} />)}</div>;
  return item ? <div className={cls}><CardView p={item} labels={labels} live onDone={dismiss} /></div> : null;
}

/* ── Popup and corner notice ─────────────────────────────────────────────── */

const busy = () => {
  const a = document.activeElement as HTMLElement | null;
  const open = document.querySelector("dialog[open], .drawer[data-open='true'], .listing[data-filters-open='true']");
  return Boolean(open || (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))));
};

/**
 * At most one overlay per page: the top popup, else the top corner notice. Never on arrival: after its delay or 40 %
 * of scrolling, and not while the visitor is typing or another dialog is open (it waits). Seen = remembered per its frequency.
 */
export function PromoOverlays({ items, labels }: { items: PromoView[]; labels: PromoLabels }) {
  const path = usePathname();
  const [shown, setShown] = useState<PromoView | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    setShown(null);
    if (items.length === 0) return;
    const chosen = decide(items, 'popup', path) ?? decide(items, 'corner', path);
    if (!chosen) return;
    let done = false;
    let timer = 0;
    const show = () => {
      if (done) return;
      if (busy()) {
        timer = window.setTimeout(show, 4000);
        return;
      }
      done = true;
      window.removeEventListener('scroll', onScroll);
      // the window may have closed while waiting
      if (!promoVisible(chosen, Date.now(), path, window.matchMedia(MOBILE_QUERY).matches, storage('local'), storage('session'))) return;
      if (chosen.freq === 'once') write('local', promoKey('s', chosen.id), String(Date.now()));
      if (chosen.freq === 'session') write('session', promoKey('s', chosen.id), '1');
      setShown(chosen);
      track(chosen.id, 'view');
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || window.scrollY / max >= 0.4) show();
    };
    if (chosen.trigger === 'scroll' && document.documentElement.scrollHeight > window.innerHeight * 1.3) {
      window.addEventListener('scroll', onScroll, { passive: true });
    } else {
      timer = window.setTimeout(show, chosen.delay * 1000);
    }
    return () => {
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [items, path]);

  // the popup is a native modal dialog: focus moves in, Escape and the backdrop close it, focus returns afterwards
  useEffect(() => {
    const d = dialog.current;
    if (shown?.format === 'popup' && d && !d.open) d.showModal();
  }, [shown]);

  // while the corner notice floats over the page, keyboard focus is scrolled clear of it (WCAG 2.4.11 focus not obscured)
  const corner = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = corner.current;
    if (shown?.format !== 'corner' || !el) return;
    const root = document.documentElement;
    const before = root.style.scrollPaddingBlockEnd;
    const fit = () => {
      root.style.scrollPaddingBlockEnd = `${Math.ceil(window.innerHeight - el.getBoundingClientRect().top) + 8}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    // Chrome's focus scrolling ignores scroll-padding for an element already partly in view: move it clear ourselves,
    // measured after the browser's own scroll
    let raf = 0;
    const onFocus = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof Element) || el.contains(t)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = t.getBoundingClientRect();
        const c = el.getBoundingClientRect();
        const overlapX = Math.min(r.right, c.right) - Math.max(r.left, c.left) > 0;
        if (overlapX && r.bottom > c.top && r.top < c.bottom) window.scrollBy({ top: r.bottom - c.top + 12, behavior: 'instant' });
      });
    };
    document.addEventListener('focusin', onFocus);
    // Escape closes it, like the popup (only when nothing else, such as an open menu, takes that key first)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || busy()) return;
      track(shown.id, 'close');
      rememberClosed(shown);
      setShown(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      document.removeEventListener('focusin', onFocus);
      root.style.scrollPaddingBlockEnd = before;
    };
  }, [shown]);

  if (!shown) return null;
  const hide = () => setShown(null);

  if (shown.format === 'corner') {
    return (
      <aside ref={corner} className={`promo-corner promo--${shown.tone} no-print`} aria-labelledby={titleId}>
        <div className="promo-corner__body">
          <p className="promo-corner__kicker">{labels.kinds[shown.kind]}</p>
          <p id={titleId} className="promo-corner__title" dir="auto">{shown.headline}</p>
          {shown.text ? <p className="promo-corner__text" dir="auto">{shown.text}</p> : null}
          <Cta p={shown} labels={labels} className="btn btn--primary btn--sm promo-corner__cta" onFollow={hide} />
        </div>
        {shown.dismissible ? <CloseButton p={shown} labels={labels} className="promo-corner__close" onClose={hide} /> : null}
      </aside>
    );
  }

  const closeDialog = (counted: boolean) => {
    if (!counted) {
      track(shown.id, 'close');
      rememberClosed(shown);
    }
    dialog.current?.close();
    hide();
  };
  return (
    <dialog
      ref={dialog}
      className={`promo-pop promo--${shown.tone} no-print`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        closeDialog(false);
      }}
      onClick={(e) => {
        // a click on the backdrop lands on the dialog element itself
        if (e.target === e.currentTarget) closeDialog(false);
      }}
    >
      <div className="promo-pop__inner">
        <button type="button" className="icon-btn promo-pop__close" aria-label={labels.close} onClick={() => closeDialog(false)}>
          <Icon name="close" />
        </button>
        {shown.image ? <img className="promo-pop__img" src={shown.image.url} alt={shown.image.alt} width={shown.image.width ?? undefined} height={shown.image.height ?? undefined} decoding="async" /> : null}
        <div className="promo-pop__body">
          <p className="promo-pop__kicker">{labels.kinds[shown.kind]}</p>
          <h2 id={titleId} className="promo-pop__title" dir="auto">{shown.headline}</h2>
          {shown.text ? <p className="promo-pop__text" dir="auto">{shown.text}</p> : null}
          <Cta p={shown} labels={labels} className="btn btn--primary promo-pop__cta" onFollow={() => closeDialog(true)} />
        </div>
      </div>
    </dialog>
  );
}
