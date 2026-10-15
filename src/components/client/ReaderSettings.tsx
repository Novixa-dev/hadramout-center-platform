'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon.tsx';

type Prefs = { fs: 'sm' | 'md' | 'lg' | 'xl'; lh: 'tight' | 'normal' | 'loose'; rw: 'narrow' | 'normal' | 'wide' };
const DEFAULTS: Prefs = { fs: 'md', lh: 'normal', rw: 'normal' };
const KEYS = { fs: 'hc-fs', lh: 'hc-lh', rw: 'hc-rw' } as const;

function read(): Prefs {
  const p = { ...DEFAULTS };
  try {
    for (const k of Object.keys(KEYS) as (keyof Prefs)[]) {
      const v = localStorage.getItem(KEYS[k]);
      if (v) (p as Record<string, string>)[k] = v;
    }
  } catch {
    /* storage blocked */
  }
  return p;
}

function apply(p: Prefs) {
  const d = document.documentElement;
  for (const k of Object.keys(KEYS) as (keyof Prefs)[]) {
    if (p[k] === DEFAULTS[k]) d.removeAttribute(`data-${k}`);
    else d.setAttribute(`data-${k}`, p[k]);
  }
}

interface Labels {
  title: string;
  size: string;
  spacing: string;
  width: string;
  reset: string;
  sizes: [string, string, string, string];
  lines: [string, string, string];
  widths: [string, string, string];
}

/** Reader preferences (text size, line spacing, column width), remembered in this browser only. */
export function ReaderSettings({ label, labels }: { label: string; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>(DEFAULTS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setP(read()), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...p, [k]: v };
    setP(next);
    apply(next);
    try {
      if (v === DEFAULTS[k]) localStorage.removeItem(KEYS[k]);
      else localStorage.setItem(KEYS[k], v);
    } catch {
      /* ignore */
    }
  };

  const group = <K extends keyof Prefs>(k: K, title: string, values: readonly Prefs[K][], names: readonly string[]) => (
    <div className="reader-pop__row" role="group" aria-label={title}>
      <span aria-hidden="true">{title}</span>
      <div className="seg-btns">
        {values.map((v, i) => (
          <button key={v} type="button" aria-pressed={p[k] === v} onClick={() => set(k, v)}>{names[i]}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="reader-pop" ref={ref}>
      <button type="button" className="btn btn--secondary btn--sm" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        <Icon name="textsize" /> {label}
      </button>
      {open ? (
        <div className="reader-pop__panel" role="group" aria-label={labels.title}>
          {group('fs', labels.size, ['sm', 'md', 'lg', 'xl'] as const, labels.sizes)}
          {group('lh', labels.spacing, ['tight', 'normal', 'loose'] as const, labels.lines)}
          {group('rw', labels.width, ['narrow', 'normal', 'wide'] as const, labels.widths)}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setP(DEFAULTS); apply(DEFAULTS); try { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } }}>{labels.reset}</button>
        </div>
      ) : null}
    </div>
  );
}
