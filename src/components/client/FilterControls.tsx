'use client';
import { useEffect } from 'react';
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
    const onChange = (e: Event) => {
      const t = e.target as HTMLElement;
      // facets inside the phone sheet are applied with the button; the sort menu (outside the sheet) always applies at once
      if (t.closest('.filters') && !wide.matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => form.requestSubmit(), 250);
    };
    // keep URLs clean: empty fields ("All") are not sent
    const onSubmit = () => {
      for (const el of form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name],select[name]')) {
        if ((el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') && !el.checked) || el.value === '' || el.value === el.dataset.default) el.disabled = true;
      }
    };
    const onShow = () => form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(':disabled').forEach((el) => (el.disabled = false));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && root()?.hasAttribute(OPEN)) setOpen(false, document.querySelector<HTMLElement>('.filters-toggle'));
    };
    const onScrim = (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('filters-scrim')) setOpen(false, document.querySelector<HTMLElement>('.filters-toggle'));
    };
    form.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    window.addEventListener('pageshow', onShow);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onScrim);
    return () => {
      clearTimeout(timer);
      form.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onScrim);
      document.body.style.overflow = '';
    };
  }, [formId]);
  return null;
}
