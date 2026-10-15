'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon.tsx';

interface ShareProps {
  label: string;
  title: string;
  url: string;
  copyLink: string;
  copied: string;
  closeLabel: string;
  targets: { whatsapp: string; telegram: string; x: string; facebook: string };
}

export function ShareMenu({ label, title, url, copyLink, copied, closeLabel, targets }: ShareProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState(false);
  const enc = encodeURIComponent;
  const open = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled or unsupported → fall through to the menu */
      }
    }
    ref.current?.showModal();
  };
  const links = [
    [targets.whatsapp, `https://wa.me/?text=${enc(`${title} ${url}`)}`],
    [targets.telegram, `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`],
    [targets.x, `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`],
    [targets.facebook, `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
  ] as const;
  return (
    <>
      <button type="button" className="btn btn--secondary btn--sm" onClick={open}><Icon name="share" /> {label}</button>
      <dialog ref={ref} className="dlg" aria-labelledby="share-title" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <div className="dlg__head">
          <h2 id="share-title">{label}</h2>
          <button type="button" className="icon-btn" onClick={() => ref.current?.close()} aria-label={closeLabel}><Icon name="close" /></button>
        </div>
        <div className="dlg__body stack">
          <div className="cluster">
            {links.map(([name, href]) => <a key={name} className="btn btn--secondary btn--sm" href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ } }}>
            <Icon name={done ? 'check' : 'copy'} /> {done ? copied : copyLink}
          </button>
        </div>
      </dialog>
    </>
  );
}

interface SaveProps {
  id: string;
  title: string;
  url: string;
  type: string;
  labels: { save: string; saved: string };
}

const KEY = 'hc-saved';
export function readSaved(): { id: string; title: string; url: string; type: string }[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as { id: string; title: string; url: string; type: string }[];
  } catch {
    return [];
  }
}

export function SaveButton({ id, title, url, type, labels }: SaveProps) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(readSaved().some((s) => s.id === id)), [id]);
  const toggle = () => {
    const list = readSaved();
    const next = list.some((s) => s.id === id) ? list.filter((s) => s.id !== id) : [...list, { id, title, url, type }];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    setOn(next.some((s) => s.id === id));
  };
  return (
    <button type="button" className="btn btn--secondary btn--sm" onClick={toggle} aria-pressed={on}>
      <Icon name={on ? 'check' : 'bookmark'} /> {on ? labels.saved : labels.save}
    </button>
  );
}

export function PrintButton({ label }: { label: string }) {
  return <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}><Icon name="print" /> {label}</button>;
}

/** A read-only value (permalink, citation) with a copy button; the text stays selectable if the clipboard is blocked. */
export function CopyField({ value, label, copied, mono = true }: { value: string; label: string; copied: string; mono?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="permalink" style={mono ? undefined : { direction: 'inherit', textAlign: 'start' }}>
      <code>{value}</code>
      <button type="button" className="btn btn--secondary btn--sm" onClick={copy} aria-label={label}>
        <Icon name={done ? 'check' : 'copy'} /> <span aria-live="polite">{done ? copied : label}</span>
      </button>
    </div>
  );
}
