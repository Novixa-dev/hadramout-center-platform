'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Item {
  href: string;
  label: string;
}

/** Desktop navigation list; marks the current section with aria-current. */
export function NavLinks({ items, children }: { items: Item[]; children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <ul className="nav__list">
      {items.map((i) => (
        <li key={i.href}>
          <Link className="nav__link" href={i.href} aria-current={pathname === i.href || pathname.startsWith(`${i.href}/`) ? 'page' : undefined}>
            {i.label}
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}
