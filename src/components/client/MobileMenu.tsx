'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

interface Props {
  label: string;
  closeLabel: string;
  items: { href: string; label: string }[];
  footer?: ReactNode;
}

export function MobileMenu({ label, closeLabel, items, footer }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
        return;
      }
      // keep Tab inside the open drawer
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label={label} aria-expanded={open} aria-controls="mobile-drawer">
        <Icon name="menu" />
      </button>
      <div className="drawer" id="mobile-drawer" data-open={open} role="dialog" aria-modal="true" aria-label={label} hidden={!open}>
        <div className="drawer__scrim" onClick={() => setOpen(false)} />
        <div className="drawer__panel" ref={panel}>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={closeLabel} style={{ alignSelf: 'flex-end' }}>
            <Icon name="close" />
          </button>
          <nav className="drawer__nav" aria-label={label}>
            {items.map((i) => (
              <Link key={i.href} href={i.href} aria-current={pathname === i.href || (i.href.split('/').length > 2 && pathname.startsWith(`${i.href}/`)) ? 'page' : undefined} onClick={() => setOpen(false)}>
                {i.label}
              </Link>
            ))}
          </nav>
          {footer ? <div className="drawer__foot">{footer}</div> : null}
        </div>
      </div>
    </>
  );
}
