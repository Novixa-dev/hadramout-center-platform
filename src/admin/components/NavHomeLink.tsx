'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav, useTranslation } from '@payloadcms/ui';
import { Icon } from '../icons.tsx';
import { NavInbox } from './Notifications.tsx';

export const NavHomeLink: React.FC = () => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const { navOpen, setNavOpen } = useNav();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const isHome = pathname === '/admin' || pathname === '/admin/';
  const label = lang === 'ar' ? 'الرئيسية (لوحة التحكم)' : 'Dashboard (Home)';
  const brand = BRAND[lang];

  // Prevent browser from disabling interaction on the sidebar when collapsed on desktop
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nav');
    if (!nav) return;
    const ensureInteractive = () => {
      if (window.innerWidth >= 1025 && nav.hasAttribute('inert')) {
        nav.removeAttribute('inert');
      }
    };
    ensureInteractive();
    const observer = new MutationObserver(ensureInteractive);
    observer.observe(nav, { attributes: true, attributeFilter: ['inert'] });
    return () => observer.disconnect();
  }, []);

  // On mobile: when drawer is open, clicking anywhere outside the sidebar closes it
  useEffect(() => {
    if (!navOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (window.innerWidth > 1024) return;
      const nav = document.querySelector<HTMLElement>('.nav');
      const toggler = document.querySelector<HTMLElement>('.app-header__mobile-nav-toggler');
      const target = e.target as Node | null;
      if (!target) return;
      if (nav?.contains(target) || toggler?.contains(target)) return;
      setNavOpen(false);
    };
    document.addEventListener('click', handleOutsideClick, true);
    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, [navOpen, setNavOpen]);

  const isRTL = lang === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  // Arabic: open -> points right (»), closed -> points left («).
  // Non-Arabic: open -> points left («), closed -> points right (»).
  const pointRight = isRTL ? navOpen : !navOpen;

  // Two siblings, not one wrapper: the brand must be a direct child of the long link column for `position: sticky` to keep it
  // at the top for the whole scroll (a sticky element only sticks within its parent's box).
  return (
    <>
      <div className="hc-nav-brand">
        <Link href="/admin" className="hc-nav-brand__lead">
          {/* decorative: the name beside it is the text */}
          <img src="/brand/logo-icon.svg" alt="" width={24} height={44} className="hc-nav-brand__mark" />
          <span className="hc-nav-brand__text">
            <span className="hc-nav-brand__name">{brand.name}</span>
            <span className="hc-nav-brand__sub">{brand.sub}</span>
          </span>
        </Link>
        <button
          type="button"
          className="hc-nav-brand__collapse-btn"
          aria-label={lang === 'ar' ? (navOpen ? 'طيّ القائمة' : 'توسيع القائمة') : (navOpen ? 'Collapse menu' : 'Expand menu')}
          title={lang === 'ar' ? (navOpen ? 'طيّ القائمة' : 'توسيع القائمة') : (navOpen ? 'Collapse menu' : 'Expand menu')}
          onClick={() => {
            setNavOpen(!navOpen);
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {pointRight ? (
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
            ) : (
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            )}
          </svg>
        </button>
      </div>
      <div className="hc-nav-home">
        <Link
          href="/admin"
          className={`hc-nav-home__link ${isHome ? 'active' : ''}`}
          aria-current={isHome ? 'page' : undefined}
        >
          <span className="hc-nav-home__icon"><Icon name="home" /></span>
          <span className="hc-nav-home__label">{label}</span>
        </Link>
        <NavInbox />
      </div>
    </>
  );
};

/** As in the site's header: the Center's short name, and its field under it. */
const BRAND = {
  ar: { name: 'مركز حضرموت', sub: 'للدراسات التاريخية والتوثيق والنشر' },
  en: { name: 'Hadhramout Center', sub: 'for Historical Studies, Documentation and Publishing' },
} as const;
