'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readSaved } from './Tools.tsx';

type Item = { id: string; title: string; url: string; type: string };

export function SavedList({ labels }: { labels: { empty: string; remove: string; exportRis: string } }) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => setItems(readSaved()), []);
  if (items === null) return null;
  if (items.length === 0) return <p className="notice">{labels.empty}</p>;
  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    localStorage.setItem('hc-saved', JSON.stringify(next));
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
      <button type="button" className="btn btn--secondary btn--sm" onClick={exportRis}>{labels.exportRis}</button>
      <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
        {items.map((i) => (
          <li key={i.id} className="cluster" style={{ justifyContent: 'space-between' }}>
            <Link href={i.url}>{i.title}</Link>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(i.id)}>{labels.remove}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
