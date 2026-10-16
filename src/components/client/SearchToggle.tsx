'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';
import { SearchBox, type SearchLabels } from './SearchBox.tsx';

/** Header search button: opens a full-width panel with the typeahead search field (every page, keyboard + touch). */
export function SearchToggle({ action, lang, labels, hint }: { action: string; lang: string; labels: SearchLabels; hint: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // "/" focuses search from anywhere (common archive shortcut), unless the user is typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? '') && !el?.isContentEditable) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button ref={btn} type="button" className="icon-btn" aria-label={labels.label} aria-expanded={open} aria-controls={id} aria-keyshortcuts="/" onClick={() => setOpen((v) => !v)}>
        <Icon name={open ? 'close' : 'search'} />
      </button>
      {open ? (
        <div className="search-panel" id={id} ref={panel}>
          <div className="container">
            <SearchBox action={action} lang={lang} labels={labels} size="lg" autoFocus onNavigate={() => setOpen(false)} />
            <p className="search-panel__hint">{hint}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
