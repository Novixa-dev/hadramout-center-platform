'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon.tsx';
import { readSaved } from './Tools.tsx';
import { toBibtex, toCslJson, toRis, type SavedItem } from '../../lib/saved-export.ts';

type Item = SavedItem;

/** Reading list kept in this browser only (localStorage). Never implies cross-device sync. */
export function SavedList({ labels }: { labels: { empty: string; remove: string; exportRis: string; exportBibtex: string; exportCsl: string; local: string; types: Record<string, string> } }) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => setItems(readSaved()), []);
  if (items === null) return <div className="skeleton" style={{ blockSize: '6rem' }} aria-hidden="true" />;
  if (items.length === 0) {
    return (
      <div className="empty">
        <Icon name="bookmark" />
        <p>{labels.empty}</p>
      </div>
    );
  }
  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    try {
      localStorage.setItem('hc-saved', JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    setItems(next);
  };
  const download = (name: string, mime: string, body: string) => {
    const url = URL.createObjectURL(new Blob([body], { type: `${mime};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportAs = (kind: 'ris' | 'bib' | 'csl') => {
    const now = new Date();
    const origin = window.location.origin;
    if (kind === 'ris') download('saved.ris', 'application/x-research-info-systems', toRis(items, origin, now));
    else if (kind === 'bib') download('saved.bib', 'application/x-bibtex', toBibtex(items, origin, now));
    else download('saved.json', 'application/vnd.citationstyles.csl+json', toCslJson(items, origin, now));
  };
  return (
    <div className="stack">
      <p className="notice notice--info"><Icon name="info" /> {labels.local}</p>
      <div className="cluster">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => exportAs('ris')}><Icon name="download" /> {labels.exportRis}</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => exportAs('bib')}><Icon name="download" /> {labels.exportBibtex}</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => exportAs('csl')}><Icon name="download" /> {labels.exportCsl}</button>
      </div>
      <ul className="entry-list" role="list">
        {items.map((i) => (
          <li key={i.id} className="entry" style={{ alignItems: 'center' }}>
            <div className="entry__main">
              <span className="kicker">{labels.types[i.type] ?? i.type}</span>
              <h3 className="entry__title" style={{ fontSize: 'var(--step-0)' }}><Link href={i.url}>{i.title}</Link></h3>
            </div>
            <button type="button" className="icon-btn" style={{ position: 'relative', zIndex: 1 }} onClick={() => remove(i.id)} aria-label={`${labels.remove}: ${i.title}`}><Icon name="close" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
