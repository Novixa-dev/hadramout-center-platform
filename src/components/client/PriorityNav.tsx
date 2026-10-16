'use client';
import Link from 'next/link';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';

interface Item {
  href: string;
  label: string;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Header navigation that never overflows, in any language: as many primary links as fit are shown, the rest move into the
 * "More" menu together with the secondary links (priority+ pattern). The server renders every primary link in the bar, so
 * the page is usable before hydration; the bar clips (never overlaps) until the measurement runs.
 */
export function PriorityNav({ items, more, moreLabel }: { items: Item[]; more: Item[]; moreLabel: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLUListElement>(null);
  const moreRef = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(items.length);
  const [open, setOpen] = useState(false);
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

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !moreRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        moreRef.current?.querySelector('button')?.focus();
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
  const menu = [...overflow, ...more];
  const active = menu.some((i) => isCurrent(pathname, i.href));

  return (
    <ul className="nav__list" ref={nav}>
      {items.map((i, idx) => (
        // links that do not fit stay in the DOM (so they can be re-measured) but out of flow, sight and tab order
        <li key={i.href} data-prio style={idx >= shown ? { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } : undefined}>
          <Link className="nav__link" href={i.href} aria-current={isCurrent(pathname, i.href) ? 'page' : undefined}>
            {i.label}
          </Link>
        </li>
      ))}
      {menu.length ? (
        <li className="nav-more" ref={moreRef}>
          <button type="button" className="nav__link nav-more__btn" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((v) => !v)} data-current={active ? 'true' : undefined}>
            {moreLabel}
            <Icon name="down" className="icon nav-more__chev" />
          </button>
          <ul id={menuId} className="nav-more__menu" hidden={!open}>
            {menu.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={isCurrent(pathname, i.href) ? 'page' : undefined}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ) : null}
    </ul>
  );
}
