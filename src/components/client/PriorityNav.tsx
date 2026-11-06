'use client';
import Link from 'next/link';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

interface Link1 {
  href: string;
  label: string;
}
/** A top-level entry is a plain link or a labelled group of links (a dropdown). */
export type NavItem = Link1 | { label: string; children: Link1[] };
const isGroup = (i: NavItem): i is { label: string; children: Link1[] } => 'children' in i;
const keyOf = (i: NavItem) => (isGroup(i) ? `g:${i.label}` : i.href);

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Header navigation that never overflows, in any language: as many primary links as fit are shown, the rest move into the
 * "More" menu together with the secondary links (priority+ pattern). The server renders every primary link in the bar, so
 * the page is usable before hydration; the bar clips (never overlaps) until the measurement runs.
 */
export function PriorityNav({ items, more, moreLabel }: { items: NavItem[]; more: Link1[]; moreLabel: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLUListElement>(null);
  const moreRef = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(items.length);
  /** the dropdown that is open: "more", a group key, or none */
  const [open, setOpen] = useState<string | null>(null);
  const menuId = useId();

  const measure = useCallback(() => {
    const list = nav.current;
    if (!list) return;
    const box = list.parentElement as HTMLElement;
    const widths = [...list.querySelectorAll<HTMLElement>('[data-prio]')].map((el) => el.offsetWidth);
    const moreW = moreRef.current?.offsetWidth ?? 0;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const room = box.clientWidth;
    let used = 0;
    let fit = 0;
    for (let i = 0; i < widths.length; i++) {
      used += (widths[i] as number) + (i ? gap : 0);
      // the last link may take the place of the More button only if nothing else follows
      const reserve = i === widths.length - 1 && more.length === 0 ? 0 : moreW + gap;
      if (used + reserve <= room) fit = i + 1;
      else break;
    }
    setShown((prev) => (prev === fit ? prev : fit));
  }, [more.length]);

  useIsoLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (nav.current?.parentElement) ro.observe(nav.current.parentElement);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => ro.disconnect();
  }, [measure, items]);

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !(e.target as HTMLElement).closest('[data-dropdown]') && setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const trigger = nav.current?.querySelector<HTMLElement>('[data-dropdown] > button[aria-expanded="true"]');
        setOpen(null);
        trigger?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const overflow = items.slice(shown);
  const menu: NavItem[] = [...overflow, ...more];
  const flat = (n: NavItem): Link1[] => (isGroup(n) ? n.children : [n]);
  const active = menu.some((n) => flat(n).some((i) => isCurrent(pathname, i.href)));

  return (
    <ul className="nav__list" ref={nav}>
      {items.map((i, idx) => {
        // links that do not fit stay in the DOM (so they can be re-measured) but out of flow, sight and tab order
        const hidden = idx >= shown ? ({ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } as const) : undefined;
        if (!isGroup(i)) {
          return (
            <li key={keyOf(i)} data-prio style={hidden}>
              <Link className="nav__link" href={i.href} aria-current={isCurrent(pathname, i.href) ? 'page' : undefined}>
                {i.label}
              </Link>
            </li>
          );
        }
        const id = keyOf(i);
        const current = i.children.some((c) => isCurrent(pathname, c.href));
        return (
          <li key={id} data-prio data-dropdown className="nav-group" style={hidden}>
            <button type="button" className="nav__link nav-more__btn" aria-expanded={open === id} aria-controls={`${menuId}-${idx}`} onClick={() => setOpen(open === id ? null : id)} data-current={current ? 'true' : undefined} tabIndex={hidden ? -1 : undefined}>
              {i.label}
              <Icon name="down" className="icon nav-more__chev" />
            </button>
            <ul id={`${menuId}-${idx}`} className="nav-more__menu nav-group__menu" hidden={open !== id}>
              {i.children.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} aria-current={isCurrent(pathname, c.href) ? 'page' : undefined}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
      {menu.length ? (
        <li className="nav-more" data-dropdown ref={moreRef}>
          <button type="button" className="nav__link nav-more__btn" aria-expanded={open === 'more'} aria-controls={menuId} onClick={() => setOpen(open === 'more' ? null : 'more')} data-current={active ? 'true' : undefined}>
            {moreLabel}
            <Icon name="down" className="icon nav-more__chev" />
          </button>
          <ul id={menuId} className="nav-more__menu" hidden={open !== 'more'}>
            {menu.flatMap((n) =>
              isGroup(n)
                ? [
                    <li key={`h:${n.label}`} className="nav-more__head" role="presentation">
                      {n.label}
                    </li>,
                    ...n.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} aria-current={isCurrent(pathname, c.href) ? 'page' : undefined}>
                          {c.label}
                        </Link>
                      </li>
                    )),
                  ]
                : [
                    <li key={n.href}>
                      <Link href={n.href} aria-current={isCurrent(pathname, n.href) ? 'page' : undefined}>
                        {n.label}
                      </Link>
                    </li>,
                  ],
            )}
          </ul>
        </li>
      ) : null}
    </ul>
  );
}
