'use client';
import Link from 'next/link';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '../Icon.tsx';

export interface NavSubItem {
  href: string;
  label: string;
  desc?: string;
  icon?: IconName;
}

export interface Item {
  href: string;
  label: string;
  subItems?: NavSubItem[];
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const isCurrent = (pathname: string, href: string) => {
  const p = pathname.replace(/\/$/, '') || '/';
  const h = href.replace(/\/$/, '') || '/';
  if (p === h) return true;
  if (h === '/' || /^\/[a-z]{2}(-[A-Z]{2})?$/.test(h)) {
    return false;
  }
  return p.startsWith(`${h}/`);
};

const isHomeLink = (href: string) => {
  const h = href.replace(/\/$/, '') || '/';
  return h === '/' || /^\/[a-z]{2}(-[A-Z]{2})?$/.test(h);
};

export function PriorityNav({ items, more, moreLabel }: { items: Item[]; more: Item[]; moreLabel: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLUListElement>(null);
  const moreRef = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(items.length);
  const [openMore, setOpenMore] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    setActiveDropdown(null);
    setOpenMore(false);
  }, [pathname]);

  // Handle outside click & escape key
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (nav.current && !nav.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setOpenMore(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setOpenMore(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = (idx: number) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveDropdown(idx);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const overflow = items.slice(shown);
  const menu = [...overflow, ...more];
  const active = menu.some((i) => isCurrent(pathname, i.href));

  return (
    <ul className="nav__list" ref={nav}>
      {items.map((i, idx) => {
        const itemActive = isHomeLink(i.href)
          ? pathname.replace(/\/$/, '') === i.href.replace(/\/$/, '')
          : isCurrent(pathname, i.href);
        const hasDropdown = Boolean(i.subItems && i.subItems.length > 0);
        const isOpen = activeDropdown === idx;

        return (
          <li
            key={i.href}
            data-prio
            className={`nav__item ${hasDropdown ? 'nav__item--has-dropdown' : ''}`}
            style={idx >= shown ? { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } : undefined}
            onMouseEnter={() => hasDropdown && handleMouseEnter(idx)}
            onMouseLeave={hasDropdown ? handleMouseLeave : undefined}
          >
            <Link
              className="nav__link"
              href={i.href}
              aria-current={itemActive ? 'page' : undefined}
              data-active={itemActive ? 'true' : undefined}
              aria-expanded={hasDropdown ? isOpen : undefined}
              aria-haspopup={hasDropdown ? 'true' : undefined}
              onClick={() => setActiveDropdown(null)}
            >
              <span>{i.label}</span>
              {hasDropdown ? <Icon name="down" className="nav__link-chev" /> : null}
            </Link>

            {hasDropdown ? (
              <div
                className={`nav-dropdown ${isOpen ? 'nav-dropdown--open' : ''}`}
                role="region"
                aria-label={i.label}
              >
                <div className="nav-dropdown__inner">
                  <div className="nav-dropdown__header">
                    <span className="nav-dropdown__header-badge">{i.label}</span>
                  </div>
                  <ul className="nav-dropdown__list">
                    {i.subItems!.map((sub, sIdx) => {
                      const subActive = isCurrent(pathname, sub.href);
                      return (
                        <li key={sIdx} className="nav-dropdown__item">
                          <Link
                            href={sub.href}
                            className="nav-dropdown__link"
                            aria-current={subActive ? 'page' : undefined}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {sub.icon ? (
                              <span className="nav-dropdown__icon-wrap" aria-hidden="true">
                                <Icon name={sub.icon} className="nav-dropdown__icon" />
                              </span>
                            ) : null}
                            <div className="nav-dropdown__text">
                              <span className="nav-dropdown__title">{sub.label}</span>
                              {sub.desc ? <span className="nav-dropdown__desc">{sub.desc}</span> : null}
                            </div>
                            <Icon name="arrow" className="nav-dropdown__arrow" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}

      {menu.length ? (
        <li className="nav-more" ref={moreRef}>
          <button
            type="button"
            className="nav__link nav-more__btn"
            aria-expanded={openMore}
            aria-controls={menuId}
            onClick={() => setOpenMore((v) => !v)}
            data-current={active ? 'true' : undefined}
          >
            {moreLabel}
            <Icon name="down" className="icon nav-more__chev" />
          </button>
          <ul id={menuId} className="nav-more__menu" hidden={!openMore}>
            {menu.map((i) => {
              const itemActive = isCurrent(pathname, i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={itemActive ? 'page' : undefined}
                    data-active={itemActive ? 'true' : undefined}
                    onClick={() => setOpenMore(false)}
                  >
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ) : null}
    </ul>
  );
}
