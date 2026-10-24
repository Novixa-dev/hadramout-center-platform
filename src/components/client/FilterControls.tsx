'use client';
import { useEffect, useRef } from 'react';
import { Icon } from '../Icon.tsx';

const OPEN = 'data-filters-open';
const root = () => document.querySelector<HTMLElement>('.listing');

function setOpen(open: boolean, trigger?: HTMLElement | null) {
  const el = root();
  if (!el) return;
  if (open) {
    el.setAttribute(OPEN, 'true');
    document.body.style.overflow = 'hidden';
    el.querySelector<HTMLElement>('.filters')?.focus();
  } else {
    el.removeAttribute(OPEN);
    document.body.style.overflow = '';
    trigger?.focus();
  }
}

/** Phone-only "Filters" button (the sidebar is a bottom sheet below 1000 px). */
export function FiltersToggle({ label, count }: { label: string; count: number }) {
  return (
    <button type="button" className="btn btn--secondary btn--sm filters-toggle" aria-controls="filters" aria-haspopup="dialog" onClick={(e) => setOpen(true, e.currentTarget)}>
      <Icon name="sliders" /> {label}
      {count > 0 ? <span className="badge" aria-hidden="true">{count}</span> : null}
    </button>
  );
}

export function FiltersClose({ label }: { label: string }) {
  return (
    <button type="button" className="icon-btn filters__close" aria-label={label} onClick={() => setOpen(false, document.querySelector<HTMLElement>('.filters-toggle'))}>
      <Icon name="close" />
    </button>
  );
}

/**
 * Behaviour of the filter form: on wide screens a change submits the form after a short pause (no extra button press);
 * on phones the visitor sets several filters in the sheet and applies them once. Esc closes the sheet.
 */
export function FilterBehavior({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wide = window.matchMedia('(min-width: 1000px)');
    // controls may sit outside the <form> element (sort menu, search bar) and join it through their form attribute, so listen on the document
    const onChange = (e: Event) => {
      const t = e.target as HTMLElement & { form?: HTMLFormElement | null };
      if (t.form !== form || t.hasAttribute('data-no-submit')) return;
      // the search box submits with Enter or its button, not on every blur
      if (t instanceof HTMLInputElement && t.type === 'search') return;
      // facets inside the phone sheet are applied with the button; the sort menu (outside the sheet) always applies at once
      if (t.closest('.filters') && !wide.matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => form.requestSubmit(), 250);
    };
    // keep URLs clean: empty fields ("All") and defaults are not sent
    const onSubmit = () => {
      for (const el of Array.from(form.elements)) {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.name) continue;
        if ((el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') && !el.checked) || el.value === '' || el.value === el.dataset.default) el.disabled = true;
      }
    };
    const onShow = () => Array.from(form.elements).forEach((el) => ((el as HTMLInputElement).disabled = false));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && root()?.hasAttribute(OPEN)) setOpen(false, document.querySelector<HTMLElement>('.filters-toggle'));
    };
    const onScrim = (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('filters-scrim')) setOpen(false, document.querySelector<HTMLElement>('.filters-toggle'));
    };
    document.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    window.addEventListener('pageshow', onShow);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onScrim);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onScrim);
      document.body.style.overflow = '';
    };
  }, [formId]);
  return null;
}

/**
 * Find-as-you-type for a long facet list (authors): hides the options that do not contain the typed text.
 * The box has no name, so it is never submitted; its change events are ignored by the form behaviour.
 */
export function FacetFind({ label, none }: { label: string; none: string }) {
  const empty = useRef<HTMLParagraphElement>(null);
  return (
    <div className="facet__find">
      <input
        type="search"
        className="input input--sm"
        data-no-submit=""
        aria-label={label}
        placeholder={label}
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault(); // Enter must not submit the whole filter form
        }}
        onChange={(e) => {
          const needle = e.target.value.trim().toLowerCase();
          const facet = e.target.closest('.facet');
          let shown = 0;
          facet?.querySelectorAll<HTMLElement>('.facet__list > .check').forEach((el, i) => {
            // the first option is "All": always visible
            const match = i === 0 || !needle || (el.textContent ?? '').toLowerCase().includes(needle);
            el.hidden = !match;
            if (match && i > 0) shown++;
          });
          if (empty.current) empty.current.hidden = Boolean(shown) || !needle;
        }}
      />
      <p ref={empty} className="facet__none" role="status" hidden>{none}</p>
    </div>
  );
}
