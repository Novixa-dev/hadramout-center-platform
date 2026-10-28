'use client';
import { useState } from 'react';
import { useTranslation } from '@payloadcms/ui';
import { headerStrings } from './i18n.ts';

/**
 * One-click switch of the admin's *interface* language (Arabic ⇄ English). It calls Payload's own server action (the one
 * behind the account settings): a `payload-lng` cookie for a year, then a refresh. It needs no session, so the sign-in
 * screen offers it too.
 */
export function LanguageSwitch() {
  const { i18n, switchLanguage } = useTranslation();
  const [busy, setBusy] = useState(false);
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const t = headerStrings(lang);
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className="hc-actions__lang"
      lang={other}
      aria-label={t.switchLabel}
      title={t.switchLabel}
      aria-busy={busy || undefined}
      disabled={busy || !switchLanguage}
      onClick={async () => {
        setBusy(true);
        try {
          await switchLanguage?.(other);
        } finally {
          setBusy(false);
        }
      }}
    >
      {t.switchTo}
    </button>
  );
}

/** Header shortcuts: the language switch and a link to the public site in the same language. */
export function HeaderActions() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const t = headerStrings(lang);
  return (
    <div className="hc-actions">
      <a className="hc-actions__site" href={`/${lang}`} target="_blank" rel="noopener">
        {t.viewSite}
        <span aria-hidden="true"> ↗</span>
      </a>
      <LanguageSwitch />
    </div>
  );
}

/** Above the sign-in form. */
export function LoginLanguage() {
  return (
    <div className="hc-login-lang">
      <LanguageSwitch />
    </div>
  );
}
