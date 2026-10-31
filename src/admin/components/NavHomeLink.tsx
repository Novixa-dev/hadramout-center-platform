'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@payloadcms/ui';

export const NavHomeLink: React.FC = () => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const isHome = pathname === '/admin' || pathname === '/admin/';
  const label = lang === 'ar' ? 'الرئيسية (لوحة التحكم)' : 'Dashboard (Home)';

  return (
    <div className="hc-nav-home">
      <Link
        href="/admin"
        className={`hc-nav-home__link ${isHome ? 'active' : ''}`}
        aria-current={isHome ? 'page' : undefined}
      >
        <span className="hc-nav-home__icon">🏠</span>
        <span className="hc-nav-home__label">{label}</span>
      </Link>
    </div>
  );
};
