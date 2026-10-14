'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

interface Props {
  label: string;
  closeLabel: string;
  items: { href: string; label: string }[];
}

export function MobileMenu({ label, closeLabel, items }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
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
      <button type="button" className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label={label} aria-expanded={open} aria-controls="mobile-drawer">
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
              <Link key={i.href} href={i.href} aria-current={pathname === i.href || pathname.startsWith(`${i.href}/`) ? 'page' : undefined} onClick={() => setOpen(false)}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
