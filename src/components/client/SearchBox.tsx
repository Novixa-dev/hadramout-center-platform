'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../Icon.tsx';

export interface SearchLabels {
  label: string;
  placeholder: string;
  submit: string;
  loading: string;
  none: string;
  viewAll: string;
  recent: string;
  clearRecent: string;
  /** "{count} suggestions" with {count} replaced by the number */
  count: string;
  kinds: Record<string, string>;
}

interface Item {
  title: string;
  href: string;
  kind: string;
}

const RECENT_KEY = 'hc-recent';
const readRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
};
const saveRecent = (q: string) => {
  try {
    const next = [q, ...readRecent().filter((x) => x !== q)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
};

/**
 * Search field with typeahead (WAI-ARIA combobox). Works as a plain GET form without JavaScript;
 * with it, suggestions come from /api/hc/suggest and recent searches are offered on focus.
 */
export function SearchBox({ action, lang, labels, size = 'md', variant = 'default', autoFocus = false, defaultValue = '', hiddenFields, onNavigate }: { action: string; lang: string; labels: SearchLabels; size?: 'md' | 'lg'; variant?: 'default' | 'hero'; autoFocus?: boolean; defaultValue?: string; hiddenFields?: Record<string, string>; onNavigate?: () => void }) {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<Item[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setDone(false);
      setBusy(false);
      return;
    }
    const ctl = new AbortController();
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hc/suggest?q=${encodeURIComponent(term)}&lang=${encodeURIComponent(lang)}`, { signal: ctl.signal });
        const json = (await res.json()) as { items?: Item[] };
        setItems(json.items ?? []);
        setDone(true);
        setActive(-1);
      } catch {
        /* aborted or offline: keep the plain form working */
      } finally {
        if (!ctl.signal.aborted) setBusy(false);
      }
    }, 170);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, lang]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const term = q.trim();
  const showRecent = open && term.length < 2 && recent.length > 0;
  const showResults = open && term.length >= 2 && (items.length > 0 || done || busy);
  const options: { key: string; label: string; href: string; kind?: string; recent?: boolean }[] = showRecent
    ? recent.map((r) => ({ key: `r-${r}`, label: r, href: `${action}?q=${encodeURIComponent(r)}`, recent: true }))
    : showResults
      ? [...items.map((i) => ({ key: i.href, label: i.title, href: i.href, kind: labels.kinds[i.kind] })), ...(term ? [{ key: 'all', label: labels.viewAll.replace('{q}', term), href: `${action}?q=${encodeURIComponent(term)}` }] : [])]
      : [];

  const go = (href: string) => {
    if (term) saveRecent(term);
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!options.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % options.length : (a - 1 + options.length) % options.length));
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      e.preventDefault();
      go(options[active].href);
    } else if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        setOpen(false);
      }
    }
  };

  return (
    <div className={`sbox sbox--${size} ${variant === 'hero' ? 'sbox--hero' : ''}`} ref={wrap}>
      <form
        className="sbox__row"
        role="search"
        action={action}
        onSubmit={(e) => {
          // Navigate explicitly. Closing the panel (onNavigate) unmounts this form, and a form that is no longer in the document
          // cannot perform its native submission: relying on the default action made Enter and the search button do nothing in the header panel.
          // Without JavaScript the plain GET form still works.
          e.preventDefault();
          const params = new URLSearchParams({ ...(hiddenFields ?? {}), q: term });
          go(term ? `${action}?${params.toString()}` : action);
        }}
      >
        <div className="sbox__field">
          <Icon name={variant === 'hero' ? 'sliders' : 'search'} className="icon sbox__icon" />
          <label className="sr-only" htmlFor={`${uid}-q`}>{labels.label}</label>
          <input
            ref={input}
            id={`${uid}-q`}
            className="input"
            type="search"
            name="q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setRecent(readRecent());
              setOpen(true);
            }}
            onKeyDown={onKey}
            placeholder={labels.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={options.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${uid}-o${active}` : undefined}
          />
        </div>
        {hiddenFields ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
        {variant === 'hero' ? (
          <button className="sbox__hero-btn" type="submit">
            <Icon name="search" className="sbox__hero-btn-icon" />
            <span>{labels.submit}</span>
          </button>
        ) : (
          <button className="btn btn--gold" type="submit">{labels.submit}</button>
        )}
      </form>
      {options.length > 0 || (open && term.length >= 2 && (busy || done)) ? (
        <div className="sbox__panel">
          {showRecent ? <p className="sbox__group" aria-hidden="true">{labels.recent}</p> : null}
          {options.length > 0 ? (
            <ul className="sbox__list" id={listId} role="listbox" aria-label={labels.label}>
              {options.map((o, i) => (
                <li key={o.key} id={`${uid}-o${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => go(o.href)} onMouseEnter={() => setActive(i)}>
                  {o.recent ? <Icon name="history" className="icon" /> : o.kind ? <span className="sbox__kind">{o.kind}</span> : <Icon name="search" className="icon" />}
                  <span>{o.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {showRecent ? (
            <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => { try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } setRecent([]); }}>{labels.clearRecent}</button>
          ) : null}
          {open && term.length >= 2 && busy && !items.length ? <p className="sbox__status">{labels.loading}</p> : null}
          {open && term.length >= 2 && done && !busy && !items.length ? <p className="sbox__status">{labels.none}</p> : null}
        </div>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">{open && term.length >= 2 && done && !busy ? labels.count.replace('{count}', String(items.length)) : ''}</p>
    </div>
  );
}
