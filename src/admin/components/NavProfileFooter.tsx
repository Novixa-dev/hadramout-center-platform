'use client';
import React from 'react';
import { useAuth, useConfig, useTranslation } from '@payloadcms/ui';
import { initialOf } from '../initial.ts';

const ROLES: Record<string, { ar: string; en: string }> = {
  admin: { ar: 'مدير النظام', en: 'Administrator' },
  editor: { ar: 'محرر محتوى', en: 'Editor' },
  reviewer: { ar: 'مراجع ترجمة', en: 'Reviewer' },
};

export const NavProfileFooter: React.FC = () => {
  const { user } = useAuth<{ name?: string; email?: string; role?: string }>();
  const { i18n } = useTranslation();
  const { config } = useConfig();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const admin = config.routes.admin;

  const displayName = user?.name || user?.email || (lang === 'ar' ? 'المستخدم' : 'User');
  const letter = initialOf(user?.name || '') || initialOf(user?.email || '') || 'م';
  const roleKey = user?.role ?? 'editor';
  const roleLabel = ROLES[roleKey] ? ROLES[roleKey][lang] : (lang === 'ar' ? 'عضو' : 'Staff');

  return (
    <div className="hc-nav-profile">
      <a href={`${admin}/account`} className="hc-nav-profile__card" title={displayName}>
        <span className="hc-nav-profile__avatar">{letter}</span>
        <span className="hc-nav-profile__info">
          <span className="hc-nav-profile__name">{displayName}</span>
          <span className="hc-nav-profile__role">{roleLabel}</span>
        </span>
        <svg className="hc-nav-profile__chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={lang === 'ar' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
        </svg>
      </a>
    </div>
  );
};
