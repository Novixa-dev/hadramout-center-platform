'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon.tsx';
import { readSaved } from './Tools.tsx';

type Item = { id: string; title: string; url: string; type: string };

/** Reading list kept in this browser only (localStorage). Never implies cross-device sync. */
export function SavedList({ labels }: { labels: { empty: string; remove: string; exportRis: string; local: string; types: Record<string, string> } }) {
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
  const exportRis = () => {
    const origin = window.location.origin;
    const ris = items.map((i) => `TY  - ELEC\r\nTI  - ${i.title}\r\nUR  - ${origin}${i.url}\r\nER  - \r\n`).join('');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ris], { type: 'application/x-research-info-systems;charset=utf-8' }));
    a.download = 'saved.ris';
    a.click();
  };
  return (
    <div className="stack">
      <p className="notice notice--info"><Icon name="info" /> {labels.local}</p>
      <div><button type="button" className="btn btn--secondary btn--sm" onClick={exportRis}><Icon name="download" /> {labels.exportRis}</button></div>
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
