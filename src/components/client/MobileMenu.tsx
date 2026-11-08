'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon.tsx';
import { groupHasCurrent, isCurrentHref, isMenuGroup, type MenuEntry, type MenuGroup } from './MainNav.tsx';

interface Props {
  label: string;
  closeLabel: string;
  entries: MenuEntry[];
  footer?: ReactNode;
}

export function MobileMenu({ label, closeLabel, entries, footer }: Props) {
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
        const f = [...panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),summary')].filter((el) => el.offsetParent !== null);
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
            {entries.map((e) => (isMenuGroup(e) ? <DrawerGroup key={e.label} group={e} pathname={pathname} close={() => setOpen(false)} /> : <DrawerLink key={e.href} href={e.href} label={e.label} pathname={pathname} close={() => setOpen(false)} />))}
          </nav>
          {footer ? <div className="drawer__foot">{footer}</div> : null}
        </div>
      </div>
    </>
  );
}

function DrawerLink({ href, label, pathname, close }: { href: string; label: string; pathname: string; close: () => void }) {
  return (
    <Link prefetch={false} href={href} aria-current={isCurrentHref(pathname, href) ? 'page' : undefined} onClick={close}>
      {label}
    </Link>
  );
}

/** A menu section as a native disclosure: opened by default when it holds the current page; nested groups get a heading. */
function DrawerGroup({ group, pathname, close }: { group: MenuGroup; pathname: string; close: () => void }) {
  return (
    <details className="drawer__group" open={groupHasCurrent(pathname, group) || undefined}>
      <summary>
        {group.label}
        <Icon name="down" className="icon drawer__chev" />
      </summary>
      <div className="drawer__sub">
        {group.items.map((e) =>
          isMenuGroup(e) ? (
            <div key={e.label} className="drawer__subgroup">
              <p className="drawer__heading">{e.label}</p>
              {e.items.filter((x) => !isMenuGroup(x)).map((l) => 'href' in l ? <DrawerLink key={l.href} href={l.href} label={l.label} pathname={pathname} close={close} /> : null)}
            </div>
          ) : (
            <DrawerLink key={e.href} href={e.href} label={e.label} pathname={pathname} close={close} />
          ),
        )}
      </div>
    </details>
  );
}
