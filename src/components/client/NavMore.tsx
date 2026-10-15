'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

interface Item {
  href: string;
  label: string;
}

/** "More" disclosure menu of the desktop header (secondary sections). Closes on outside click, Esc and navigation. */
export function NavMore({ label, items }: { label: string; items: Item[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const id = useId();
  const active = items.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <li className="nav-more" ref={ref}>
      <button type="button" className="nav__link nav-more__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} data-current={active ? 'true' : undefined}>
        {label}
        <Icon name="down" className="icon nav-more__chev" />
      </button>
      <ul id={id} className="nav-more__menu" hidden={!open}>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={pathname === i.href || pathname.startsWith(`${i.href}/`) ? 'page' : undefined}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
