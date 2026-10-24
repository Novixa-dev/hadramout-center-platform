'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';
import type { LangOption } from '../Shell.tsx';

interface Props {
  current: string;
  currentNative: string;
  options: LangOption[];
  labels: { pick: string; title: string; search: string; popular: string; all: string; note: string; close: string; none: string; machine: string };
  badge?: boolean;
}

/** Switch the URL's language prefix, keeping the rest of the path and the query string. */
function switchPath(pathname: string, from: string, to: string): string {
  const rest = pathname.startsWith(`/${from}`) ? pathname.slice(from.length + 1) : pathname;
  return `/${to}${rest === '' ? '' : rest}`;
}

/** Short uppercase code as the language's "logo" (AR, EN, FR, ZH…). No flags: a language is not a country. */
const glyph = (o: LangOption) => o.code.split("-")[0]!.slice(0, 3).toUpperCase();

/** Stable accent per language so the list is easy to scan. */
const hue = (code: string) => {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
};

export function LangPicker({ current, currentNative, options, labels, badge = false }: Props) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? options.filter((o) => o.native.toLowerCase().includes(n) || o.english.toLowerCase().includes(n) || o.code.toLowerCase().includes(n)) : options;
  }, [q, options]);
  // popular languages first (only when not searching), each group keeps catalog order
  const ordered = useMemo(() => (q.trim() ? filtered : [...filtered.filter((o) => o.popular), ...filtered.filter((o) => !o.popular)]), [filtered, q]);
  const popularCount = q.trim() ? 0 : filtered.filter((o) => o.popular).length;

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(Math.max(0, options.findIndex((o) => o.code === current)));
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.min(380, window.innerWidth - 16);
      setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) });
    };
    place();
    window.addEventListener('resize', place);
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.documentElement.setAttribute('data-lang-open', 'true');
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.documentElement.removeAttribute('data-lang-open');
    };
  }, [open, current, options]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open, ordered]);

  const go = (code: string) => {
    try {
      document.cookie = `hc_lang=${code}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies blocked: the URL still carries the language */
    }
    window.location.href = switchPath(pathname, current, code) + window.location.search;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(ordered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && ordered[active]) {
      e.preventDefault();
      go(ordered[active]!.code);
    }
  };

  return (
    <div className={`lang ${badge ? 'lang--badge' : ''}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="lang-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${labels.title}: ${currentNative}`}
      >
        {badge ? (
          <>
            <span className="lang-trigger__badge">{current === 'ar' ? 'EN' : 'AR'}</span>
            <Icon name="globe" />
          </>
        ) : (
          <>
            <Icon name="globe" />
            <span className="lang-trigger__text" lang={current}>{currentNative}</span>
            <Icon name="down" className="icon lang-trigger__chev" />
          </>
        )}
      </button>

      {open && mounted
        ? createPortal(
            <>
      <div className="lang-scrim" aria-hidden="true" onClick={() => setOpen(false)} />
      <div id={panelId} ref={panelRef} className="lang-panel" role="dialog" aria-label={labels.title} style={{ top: pos.top, left: pos.left }} onKeyDown={onKeyDown}>
        <div className="lang-panel__grab" aria-hidden="true" />
        <div className="lang-panel__head">
          <h2>{labels.title}</h2>
          <button type="button" className="icon-btn lang-panel__close" onClick={() => setOpen(false)} aria-label={labels.close}>
            <Icon name="close" />
          </button>
        </div>
        <label className="lang-search">
          <Icon name="search" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder={labels.search}
            aria-label={labels.search}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <p className="lang-note">{labels.note}</p>
        <ul className="lang-list" ref={listRef}>
          {ordered.map((o, i) => {
            const isCurrent = o.code === current;
            return (
              <li key={o.code} className={i === popularCount && popularCount > 0 ? 'lang-list__break' : undefined}>
                {i === 0 && popularCount > 0 ? <p className="lang-group">{labels.popular}</p> : null}
                {i === popularCount && popularCount > 0 ? <p className="lang-group">{labels.all}</p> : null}
                <a
                  href={switchPath(pathname, current, o.code)}
                  hrefLang={o.code}
                  aria-current={isCurrent ? 'true' : undefined}
                  data-active={i === active ? 'true' : undefined}
                  rel={o.ready ? undefined : 'nofollow'}
                  onMouseMove={() => setActive(i)}
                  onClick={(e) => {
                    e.preventDefault();
                    go(o.code);
                  }}
                >
                  <span className="lang-badge" style={{ ['--h' as string]: hue(o.code) }} aria-hidden="true">{glyph(o)}</span>
                  <span className="lang-names">
                    <span className="lang-names__native" lang={o.code} dir={o.dir}>{o.native}</span>
                    {o.native !== o.english ? <small dir="ltr">{o.english}</small> : null}
                  </span>
                  {isCurrent ? <Icon name="check" className="icon lang-check" /> : o.code !== 'ar' && !o.ready ? <small className="lang-tag" dir="auto">{labels.machine}</small> : null}
                </a>
              </li>
            );
          })}
          {ordered.length === 0 ? <li className="lang-empty">{labels.none}</li> : null}
        </ul>
      </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
