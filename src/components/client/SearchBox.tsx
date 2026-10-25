'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '../Icon.tsx';

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const isAr = lang === 'ar';

  const typeOptions: { value: string; label: string; icon: IconName }[] = [
    { value: '', label: isAr ? 'الكل (جميع الأقسام)' : 'All Sections', icon: 'grid' },
    { value: 'articles', label: isAr ? 'المقالات والدراسات' : 'Articles & Studies', icon: 'manuscript' },
    { value: 'books', label: isAr ? 'الكتب والمؤلفات' : 'Books & Publications', icon: 'book' },
    { value: 'magazines', label: isAr ? 'المجلات العلمية' : 'Scientific Journals', icon: 'layers' },
    { value: 'news', label: isAr ? 'الأخبار والتقارير' : 'News & Reports', icon: 'file' },
    { value: 'events', label: isAr ? 'الفعاليات والندوات' : 'Events & Seminars', icon: 'calendar' },
    { value: 'videos', label: isAr ? 'المرئيات والتسجيلات' : 'Videos & Media', icon: 'play' },
  ];

  const sortOptions = [
    { value: 'relevance', label: isAr ? 'الأكثر صلة' : 'Most Relevant' },
    { value: 'newest', label: isAr ? 'الأحدث تاريخاً' : 'Newest' },
    { value: 'oldest', label: isAr ? 'الأقدم تاريخاً' : 'Oldest' },
  ];

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
    if (!open && !filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, filterOpen]);

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
      if (filterOpen) {
        e.stopPropagation();
        setFilterOpen(false);
        return;
      }
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
          const params = new URLSearchParams({
            ...(hiddenFields ?? {}),
            ...(selectedType ? { type: selectedType } : {}),
            ...(selectedSort ? { sort: selectedSort } : {}),
            q: term,
          });
          go(term || selectedType || selectedSort ? `${action}?${params.toString()}` : action);
        }}
      >
        <div className="sbox__field">
          {variant === 'hero' ? (
            <button
              type="button"
              className={`sbox__filter-toggle ${filterOpen ? 'sbox__filter-toggle--open' : ''} ${selectedType || selectedSort ? 'sbox__filter-toggle--active' : ''}`}
              aria-label={isAr ? 'خيارات تصفية البحث' : 'Search filter options'}
              aria-expanded={filterOpen}
              title={isAr ? 'خيارات تصفية البحث' : 'Search filter options'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                setFilterOpen((v) => !v);
              }}
            >
              <Icon name="sliders" className="icon sbox__icon" />
              {selectedType || selectedSort ? <span className="sbox__filter-badge" aria-hidden="true" /> : null}
            </button>
          ) : (
            <Icon name="search" className="icon sbox__icon" />
          )}
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
              setFilterOpen(false);
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
        {selectedType ? <input type="hidden" name="type" value={selectedType} /> : null}
        {selectedSort ? <input type="hidden" name="sort" value={selectedSort} /> : null}
        {variant === 'hero' ? (
          <button className="sbox__hero-btn" type="submit">
            <Icon name="search" className="sbox__hero-btn-icon" />
            <span>{labels.submit}</span>
          </button>
        ) : (
          <button className="btn btn--gold" type="submit">{labels.submit}</button>
        )}
      </form>
      {variant === 'hero' && filterOpen ? (
        <>
          <div
            className="sbox__filter-backdrop"
            aria-hidden="true"
            onClick={() => setFilterOpen(false)}
          />
          <div
            className="sbox__filter-menu"
            ref={filterRef}
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? 'خيارات تصفية البحث' : 'Search filter options'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sbox__filter-sheet-bar" aria-hidden="true" />
            <div className="sbox__filter-head">
              <div className="sbox__filter-title">
                <Icon name="sliders" className="sbox__filter-title-icon" />
                <span>{isAr ? 'تصفية نتائج البحث' : 'Filter Search Results'}</span>
              </div>
              <div className="sbox__filter-actions">
                {selectedType || selectedSort ? (
                  <button
                    type="button"
                    className="sbox__filter-reset"
                    onClick={() => {
                      setSelectedType('');
                      setSelectedSort('');
                    }}
                  >
                    {isAr ? 'إعادة ضبط' : 'Reset'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="sbox__filter-close"
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                  onClick={() => setFilterOpen(false)}
                >
                  <Icon name="close" className="sbox__filter-close-icon" />
                </button>
              </div>
            </div>

            <div className="sbox__filter-section">
              <span className="sbox__filter-section-title">{isAr ? 'نوع المحتوى' : 'Content Type'}</span>
              <div className="sbox__filter-chips">
                {typeOptions.map((opt) => {
                  const isSelected = selectedType === opt.value || (!selectedType && opt.value === '');
                  const isAll = opt.value === '';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`sbox__filter-chip ${isAll ? 'sbox__filter-chip--all' : ''} ${isSelected ? 'sbox__filter-chip--selected' : ''}`}
                      onClick={() => setSelectedType(opt.value)}
                    >
                      <Icon name={opt.icon} className="sbox__filter-chip-icon" />
                      <span>{opt.label}</span>
                      {isSelected ? <Icon name="check" className="sbox__filter-chip-check" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sbox__filter-section">
              <span className="sbox__filter-section-title">{isAr ? 'الترتيب حسب' : 'Sort by'}</span>
              <div className="sbox__filter-sorts">
                {sortOptions.map((opt) => {
                  const isSelected = (selectedSort || 'relevance') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`sbox__filter-sort-btn ${isSelected ? 'sbox__filter-sort-btn--selected' : ''}`}
                      onClick={() => setSelectedSort(opt.value === 'relevance' ? '' : opt.value)}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sbox__filter-foot">
              <button
                type="button"
                className="sbox__filter-apply-btn"
                onClick={() => {
                  setFilterOpen(false);
                  input.current?.focus();
                }}
              >
                {isAr ? 'تطبيق التصفية' : 'Apply Filter'}
              </button>
            </div>
          </div>
        </>
      ) : null}
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
