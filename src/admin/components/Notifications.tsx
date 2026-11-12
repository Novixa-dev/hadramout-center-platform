'use client';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from '@payloadcms/ui';
import { dashboardStrings, fill, notifyStrings } from '../i18n.ts';
import { queueByKey, queueHref } from '../queues.ts';
import { Icon } from '../icons.tsx';

/**
 * Notifications for staff: the header's bell (how much is waiting, and where), the sidebar's inbox, and optional browser
 * alerts when something new arrives. There is no mail and no push server: one poller per admin page asks /api/hc/waiting
 * once a minute (also while the tab is hidden, but only when the person turned alerts on) and compares the counts.
 */

type Item = { key: string; n: number | null };
type State = { items: Item[]; total: number; ready: boolean };

const POLL_MS = 60_000;
const PREF = 'hc-alerts'; // this browser only: '1' once the person switched browser alerts on
const EMPTY: State = { items: [], total: 0, ready: false };

let state: State = EMPTY;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let previous: Map<string, number> | null = null;
let language = 'ar';

const supported = () => typeof window !== 'undefined' && 'Notification' in window;
function readPref(): boolean {
  try {
    return localStorage.getItem(PREF) === '1';
  } catch {
    return false;
  }
}
function writePref(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? '1' : '0');
  } catch {
    // private mode: alerts last for this page only
  }
}
const alertsOn = () => supported() && Notification.permission === 'granted' && readPref();

/** A desktop alert for every queue that grew since the last poll (never on the first one: nothing «arrived» then). */
function announce(items: Item[]) {
  const now = new Map(items.map((i) => [i.key, i.n ?? 0]));
  const before = previous;
  previous = now;
  if (!before || !alertsOn()) return;
  const t = notifyStrings(language);
  const d = dashboardStrings(language);
  for (const [key, n] of now) {
    const q = queueByKey(key);
    if (!q || n <= (before.get(key) ?? 0)) continue;
    // one alert per queue: a newer one replaces it (also across open tabs) instead of piling up
    const alert = new Notification(fill(t.arrived, { label: d[q.label] }), { body: fill(t.arrivedBody, { n }), tag: `hc-${key}`, icon: '/brand/logo-icon.svg', lang: language, dir: language === 'ar' ? 'rtl' : 'ltr' });
    alert.onclick = () => {
      window.focus();
      window.location.href = queueHref(q);
      alert.close();
    };
  }
}

async function refresh() {
  try {
    const res = await fetch('/api/hc/waiting', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { items: Item[]; total: number };
    announce(data.items);
    state = { items: data.items, total: data.total, ready: true };
    for (const l of listeners) l();
  } catch {
    // offline for a moment: the next poll tries again
  }
}

const onVisible = () => {
  if (!document.hidden) void refresh();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    // a hidden tab keeps asking only for someone who wants alerts; browsers slow such timers to about once a minute anyway
    timer = setInterval(() => {
      if (!document.hidden || alertsOn()) void refresh();
    }, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

function useWaiting(): State {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

function useLang() {
  const { i18n } = useTranslation();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  language = lang;
  return lang;
}

type Permission = 'unsupported' | NotificationPermission;

/** Browser alerts: on/off for this browser. Asking the browser's permission happens only when the person presses it. */
function AlertsSwitch({ lang }: { lang: 'ar' | 'en' }) {
  const t = notifyStrings(lang);
  const [permission, setPermission] = useState<Permission>('default');
  const [on, setOn] = useState(false);
  useEffect(() => {
    setPermission(supported() ? Notification.permission : 'unsupported');
    setOn(alertsOn());
  }, []);
  if (permission === 'unsupported') return <p className="hc-bell__note">{t.browserUnsupported}</p>;
  if (permission === 'denied') return <p className="hc-bell__note">{t.browserBlocked}</p>;
  const toggle = async () => {
    if (on) {
      writePref(false);
      setOn(false);
      return;
    }
    const answer = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(answer);
    if (answer === 'granted') {
      writePref(true);
      setOn(true);
    }
  };
  return (
    <div className="hc-bell__alerts">
      <button type="button" className="hc-switch" role="switch" aria-checked={on} onClick={() => void toggle()}>
        <span className="hc-switch__track" aria-hidden="true"><span className="hc-switch__thumb" /></span>
        <span>{on ? t.browserOn : t.browserOff}</span>
      </button>
      <p className="hc-bell__note">{t.browserNote}</p>
    </div>
  );
}

/** The header's bell: the number waiting, and a panel listing each queue with its count, a link, and the alerts switch. */
export function NotificationBell() {
  const lang = useLang();
  const t = notifyStrings(lang);
  const d = dashboardStrings(lang);
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en');
  const s = useWaiting();
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const close = (back: boolean) => {
      setOpen(false);
      if (back) button.current?.focus();
    };
    // Escape closes this panel only: caught on the way down (window, capture) and stopped there, or Payload's own Escape
    // handler on the document also closes the sidebar and takes the focus with it
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      close(true);
    };
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close(false);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const rows = s.items.filter((i) => (i.n ?? 0) > 0);
  const label = s.total > 0 ? fill(t.bellSome, { n: nf.format(s.total) }) : t.bellNone;
  return (
    <div className="hc-bell" ref={box}>
      <button
        ref={button}
        type="button"
        className="hc-bell__btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={label}
        data-total={s.ready ? s.total : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" />
        {s.total > 0 ? <span className="hc-bell__n" aria-hidden="true">{s.total > 99 ? '99+' : nf.format(s.total)}</span> : null}
      </button>
      {open ? (
        <div id={id} ref={panel} className="hc-bell__panel" role="dialog" aria-labelledby={`${id}-h`} tabIndex={-1}>
          <div className="hc-bell__head">
            <h2 id={`${id}-h`}>{t.title}</h2>
            <button type="button" className="hc-bell__close" aria-label={t.close} onClick={() => { setOpen(false); button.current?.focus(); }}>
              <Icon name="close" />
            </button>
          </div>
          {rows.length ? (
            <ul className="hc-bell__list" role="list">
              {rows.map((i) => {
                const q = queueByKey(i.key);
                if (!q) return null;
                return (
                  <li key={i.key}>
                    <a className="hc-bell__row" href={queueHref(q)} data-key={i.key} data-count={i.n ?? 0}>
                      <span className="hc-bell__tile">{nf.format(i.n ?? 0)}</span>
                      <span className="hc-bell__text">
                        <strong>{d[q.label]}</strong>
                        <span>{d[q.hint]}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hc-bell__empty">{s.ready ? t.nothingNew : '…'}</p>
          )}
          <AlertsSwitch lang={lang} />
          <a className="hc-bell__all" href="/admin">{t.openAll}</a>
        </div>
      ) : null}
    </div>
  );
}

/** The sidebar's inbox: each queue with something new, with its count; one quiet line when there is nothing. */
export function NavInbox() {
  const lang = useLang();
  const t = notifyStrings(lang);
  const d = dashboardStrings(lang);
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en');
  const s = useWaiting();
  if (!s.ready) return null;
  const rows = s.items.filter((i) => (i.n ?? 0) > 0);
  return (
    <div className="hc-nav-inbox">
      <p className="hc-nav-inbox__title">{t.inbox}</p>
      {rows.length ? (
        <ul className="hc-nav-inbox__list" role="list">
          {rows.map((i) => {
            const q = queueByKey(i.key);
            if (!q) return null;
            return (
              <li key={i.key}>
                <a className="hc-nav-inbox__link" href={queueHref(q)}>
                  <Icon name={q.icon} />
                  <span className="hc-nav-inbox__label">{d[q.quiet]}</span>
                  <span className="hc-nav-inbox__n">{nf.format(i.n ?? 0)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hc-nav-inbox__none">{t.nothingNew}</p>
      )}
    </div>
  );
}
