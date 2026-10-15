'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';
import type { LangOption } from '../Shell.tsx';

interface Props {
  current: string;
  currentNative: string;
  options: LangOption[];
  labels: { pick: string; title: string; search: string; popular: string; all: string; note: string; close: string };
}

/** Switch the URL's language prefix, keeping the rest of the path and the query string. */
function switchPath(pathname: string, from: string, to: string): string {
  const rest = pathname.startsWith(`/${from}`) ? pathname.slice(from.length + 1) : pathname;
  return `/${to}${rest === '' ? '' : rest}`;
}

export function LangPicker({ current, currentNative, options, labels }: Props) {
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close();
    };
    d.addEventListener('click', onClick);
    return () => d.removeEventListener('click', onClick);
  }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? options.filter((o) => o.native.toLowerCase().includes(n) || o.english.toLowerCase().includes(n) || o.code.includes(n)) : options;
  }, [q, options]);
  const popular = filtered.filter((o) => o.popular);
  const rest = filtered.filter((o) => !o.popular);

  const choose = (code: string) => {
    try {
      document.cookie = `hc_lang=${code}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies blocked */
    }
  };

  const item = (o: LangOption) => (
    <li key={o.code}>
      <a href={switchPath(pathname, current, o.code)} hrefLang={o.code} lang={o.code} dir={o.dir} aria-current={o.code === current ? 'true' : undefined} rel={o.ready ? undefined : 'nofollow'} onClick={(e) => { e.preventDefault(); choose(o.code); window.location.href = switchPath(pathname, current, o.code) + window.location.search; }}>
        <span>{o.native}</span>
        {o.native !== o.english ? <small dir="ltr">{o.english}</small> : null}
      </a>
    </li>
  );

  return (
    <>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        <Icon name="globe" />
        <span className="lang-btn__text" lang={current}>{currentNative}</span>
      </button>
      <dialog ref={ref} className="dlg" aria-labelledby="lang-dlg-title">
        <div className="dlg__head">
          <h2 id="lang-dlg-title">{labels.title}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label={labels.close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dlg__body">
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.search} aria-label={labels.search} />
          <p className="notice notice--info" style={{ marginBlock: '0.9rem' }}>{labels.note}</p>
          {popular.length ? <h3 style={{ fontSize: 'var(--step-0)', marginBlock: '0.5rem' }}>{labels.popular}</h3> : null}
          <ul className="lang-grid">{popular.map(item)}</ul>
          {rest.length ? <h3 style={{ fontSize: 'var(--step-0)', marginBlock: '1rem 0.5rem' }}>{labels.all}</h3> : null}
          <ul className="lang-grid">{rest.map(item)}</ul>
        </div>
      </dialog>
    </>
  );
}
