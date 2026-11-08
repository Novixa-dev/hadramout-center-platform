'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

export interface MenuLink {
  href: string;
  label: string;
}
export interface MenuGroup {
  label: string;
  items: MenuEntry[];
}
export type MenuEntry = MenuLink | MenuGroup;

export const isMenuGroup = (e: MenuEntry): e is MenuGroup => 'items' in e;

/** A link is current when the path matches (query and #fragment ignored; "/ar" only matches the home page itself). */
export function isCurrentHref(pathname: string, href: string): boolean {
  const path = href.split(/[?#]/)[0] as string;
  if (path.split('/').length <= 2) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export const groupHasCurrent = (pathname: string, g: MenuGroup): boolean =>
  g.items.some((e) => (isMenuGroup(e) ? groupHasCurrent(pathname, e) : isCurrentHref(pathname, e.href)));

/**
 * Desktop main menu: top-level links and groups; a group is a disclosure button that opens a panel (one at a time).
 * Nested groups become titled columns. Top-level links work before hydration; panels open once the script runs (the
 * phone drawer uses plain <details> and needs none for its sections).
 */
export function MainNav({ entries }: { entries: MenuEntry[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLUListElement>(null);
  const base = useId();

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      root.current?.querySelector<HTMLButtonElement>(`[data-menu="${open}"]`)?.focus();
      setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // every page carries this menu: prefetching it would cost each visitor some twenty requests per page (and links differing only by #fragment fetch the same URL twice)
  const linkProps = (href: string) => ({ href, prefetch: false, 'aria-current': isCurrentHref(pathname, href) ? ('page' as const) : undefined, onClick: () => setOpen(null) });

  return (
    <ul className="mainnav" ref={root}>
      {entries.map((e, i) => {
        if (!isMenuGroup(e)) {
          return (
            <li key={e.href}>
              <Link className="mainnav__link" {...linkProps(e.href)}>
                {e.label}
              </Link>
            </li>
          );
        }
        const id = `${base}-${i}`;
        const links = e.items.filter((x): x is MenuLink => !isMenuGroup(x));
        const groups = e.items.filter(isMenuGroup);
        return (
          <li key={e.label} className="mainnav__item">
            <button
              type="button"
              className="mainnav__link mainnav__btn"
              data-menu={i}
              aria-expanded={open === i}
              aria-controls={id}
              data-current={groupHasCurrent(pathname, e) ? 'true' : undefined}
              onClick={() => setOpen((v) => (v === i ? null : i))}
            >
              {e.label}
              <Icon name="down" className="icon mainnav__chev" />
            </button>
            <div id={id} className={groups.length ? 'mainnav__panel mainnav__panel--wide' : 'mainnav__panel'} hidden={open !== i}>
              {links.length ? (
                <ul className="mainnav__col">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link {...linkProps(l.href)}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {groups.map((g) => (
                <div key={g.label} className="mainnav__col">
                  <p className="mainnav__heading">{g.label}</p>
                  <ul>
                    {g.items.filter((x): x is MenuLink => !isMenuGroup(x)).map((l) => (
                      <li key={l.href}>
                        <Link {...linkProps(l.href)}>{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
