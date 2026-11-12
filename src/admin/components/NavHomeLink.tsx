'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@payloadcms/ui';
import { Icon } from '../icons.tsx';
import { NavInbox } from './Notifications.tsx';

export const NavHomeLink: React.FC = () => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const isHome = pathname === '/admin' || pathname === '/admin/';
  const label = lang === 'ar' ? 'الرئيسية (لوحة التحكم)' : 'Dashboard (Home)';
  const brand = BRAND[lang];

  // Two siblings, not one wrapper: the brand must be a direct child of the long link column for `position: sticky` to keep it
  // at the top for the whole scroll (a sticky element only sticks within its parent's box).
  return (
    <>
      <div className="hc-nav-brand">
        {/* decorative: the name beside it is the text */}
        <img src="/brand/logo-icon.svg" alt="" width={19} height={40} className="hc-nav-brand__mark" />
        <span className="hc-nav-brand__text">
          <span className="hc-nav-brand__name">{brand.name}</span>
          <span className="hc-nav-brand__sub">{brand.sub}</span>
        </span>
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
