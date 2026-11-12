'use client';
import { useConfig, useTranslation } from '@payloadcms/ui';

/** Sign-out at the foot of the sidebar: a labelled button, not a lone icon, so nobody has to guess where it is. */
export function LogoutButton() {
  const { i18n } = useTranslation();
  const { config } = useConfig();
  const label = i18n?.language === 'en' ? 'Sign out' : 'تسجيل الخروج';
  const href = `${config.routes.admin}${config.admin.routes.logout}`;
  return (
    <a className="hc-logout" href={href}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
