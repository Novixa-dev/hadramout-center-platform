'use client';
import { useAuth, useConfig, useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui';
import { initialOf } from '../initial.ts';

/**
 * The head of a staff account (the profile, and each user an admin opens): the person's initial, name, email and role, as the
 * site's paper panel. On your own account it also offers sign-out, where people look for it. Display only (a `ui` field):
 * it stores nothing and reads the form's live values, so a name being typed shows here at once.
 */
const ROLE = {
  ar: { admin: 'مدير', editor: 'محرر', reviewer: 'مراجع ترجمة', you: 'حسابك', signOut: 'تسجيل الخروج' },
  en: { admin: 'Admin', editor: 'Editor', reviewer: 'Translation reviewer', you: 'Your account', signOut: 'Sign out' },
} as const;

export function ProfileCard() {
  const { i18n } = useTranslation();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const t = ROLE[lang];
  const { user } = useAuth<{ id: number | string }>();
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const name = useFormFields(([fields]) => (fields.name?.value as string | undefined) ?? '');
  const email = useFormFields(([fields]) => (fields.email?.value as string | undefined) ?? '');
  const role = useFormFields(([fields]) => (fields.role?.value as keyof typeof t | undefined) ?? undefined);
  const own = user && id !== undefined && String(user.id) === String(id);
  const letter = initialOf(name) || initialOf(email);
  if (!name && !email) return null;
  return (
    <div className="hc-profile">
      <span className="hc-profile__avatar" aria-hidden="true">{letter}</span>
      <div className="hc-profile__text">
        <p className="hc-profile__name">{name || email}</p>
        <p className="hc-profile__meta">
          {email ? <bdi dir="ltr">{email}</bdi> : null}
          {role && role in t ? <span className="hc-profile__role">{t[role as 'admin' | 'editor' | 'reviewer']}</span> : null}
          {own ? <span className="hc-profile__you">{t.you}</span> : null}
        </p>
      </div>
      {own ? (
        <a className="hc-profile__out" href={`${config.routes.admin}${config.admin.routes.logout}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
          </svg>
          {t.signOut}
        </a>
      ) : null}
    </div>
  );
}
