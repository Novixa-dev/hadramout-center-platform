import type { AdminViewServerProps } from 'payload';
import { Logo } from './Brand.tsx';

/**
 * Replaces Payload's "forgot password" screen while the site has no email provider (none is configured in
 * payload.config.ts): Payload's own screen promises an email that is only written to the server log. Staff are told the
 * real procedure instead. Remove this view (admin.components.views.forgot) once an email adapter is added.
 */
const TEXT = {
  ar: {
    title: 'نسيت كلمة المرور؟',
    body: 'لا يرسل الموقع رسائل بريد بعد، لذلك لا يمكن استعادة كلمة المرور من هنا.',
    how: 'اطلب من مدير النظام في المركز أن يعيّن لك كلمة مرور مؤقتة من «المستخدمون»، ثم غيّرها من «حسابي» بعد الدخول.',
    locked: 'إن أُغلق حسابك بعد 5 محاولات خاطئة فانتظر 15 دقيقة، أو اطلب من المدير «إجبار فتح القفل».',
    back: 'العودة إلى تسجيل الدخول',
  },
  en: {
    title: 'Forgot your password?',
    body: 'The site does not send email yet, so a password cannot be recovered from here.',
    how: 'Ask the Center’s administrator to set a temporary password for you under “Users”, then change it under “My account” after signing in.',
    locked: 'If your account is locked after 5 failed attempts, wait 15 minutes or ask the administrator to “Force unlock” it.',
    back: 'Back to sign in',
  },
};

export function ForgotPassword({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  const lang = req.i18n?.language === 'en' ? 'en' : 'ar';
  const t = TEXT[lang];
  const admin = req.payload.config.routes.admin;
  return (
    <div className="hc-forgot" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="hc-forgot__brand">
        <Logo i18n={{ language: lang }} />
      </div>
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <p>{t.how}</p>
      <p className="hc-forgot__note">{t.locked}</p>
      <a className="btn btn--style-primary btn--size-medium" href={`${admin}/login`}>
        {t.back}
      </a>
    </div>
  );
}
