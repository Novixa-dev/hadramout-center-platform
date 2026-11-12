'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useConfig, useTranslation } from '@payloadcms/ui';
import { initialOf } from '../initial.ts';

/**
 * The account button in the header and its menu: the person's initial on the site's green, and on press a small card with who
 * is signed in and two choices, the profile and sign-out.
 *
 * Payload renders this inside its own link to the account page. That link is kept (without script it still opens the
 * profile) and turned into the menu's button: a menu cannot live inside a link, and replacing the link would move Payload's
 * content-language picker, which is placed by a fixed offset from it. The menu itself is a portal on <body>.
 */
const T = {
  ar: { menu: 'قائمة الحساب', profile: 'الملف الشخصي', signOut: 'تسجيل الخروج', admin: 'مدير', editor: 'محرر', reviewer: 'مراجع ترجمة' },
  en: { menu: 'Account menu', profile: 'Profile', signOut: 'Sign out', admin: 'Admin', editor: 'Editor', reviewer: 'Translation reviewer' },
} as const;


const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
  </svg>
);
const OutIcon = () => (
  <svg className="hc-menu__out-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
  </svg>
);

export function Avatar() {
  const { user } = useAuth<{ name?: string; email?: string; role?: 'admin' | 'editor' | 'reviewer' }>();
  const { i18n } = useTranslation();
  const { config } = useConfig();
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const t = T[lang];
  const id = useId();
  const mark = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; side: number } | null>(null);
  const letter = initialOf(user?.name || '') || initialOf(user?.email || '');
  const admin = config.routes.admin;

  // Turn Payload's account link into the menu's button.
  useEffect(() => {
    const link = mark.current?.closest('a');
    if (!link) return;
    link.setAttribute('role', 'button');
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-controls', id);
    link.setAttribute('aria-label', t.menu);
    const toggle = (e: Event) => {
      // preventDefault alone is not enough: the link's own React click handler still ran router.push('/admin/account') and the
      // page left a moment after the menu opened. Stopping the event here keeps it from reaching React's listener at the root.
      e.preventDefault();
      e.stopPropagation();
      const r = link.getBoundingClientRect();
      const rtl = document.documentElement.dir === 'rtl';
      setPlace({ top: r.bottom + 8, side: rtl ? r.left : window.innerWidth - r.right });
      setOpen((v) => !v);
    };
    // a link answers Enter by itself; a button also answers Space
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') toggle(e);
    };
    link.addEventListener('click', toggle);
    link.addEventListener('keydown', onKey);
    return () => {
      link.removeEventListener('click', toggle);
      link.removeEventListener('keydown', onKey);
    };
  }, [id, t.menu]);

  useEffect(() => {
    const link = mark.current?.closest('a');
    link?.setAttribute('aria-expanded', String(open));
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const close = (back: boolean) => {
      setOpen(false);
      // after the menu is gone and after anyone else's Escape handling, or focus would fall back to the page
      // Payload redraws its header after an Escape and replaces the link element, dropping focus on the page. For a few frames,
      // put it back on whichever link is there now, but only while it is lost (never take it from where the person moved it).
      if (back) {
        let frames = 12;
        const restore = () => {
          const lost = !document.activeElement || document.activeElement === document.body;
          const current = mark.current?.closest('a') ?? document.querySelector<HTMLElement>('.app-header__account');
          if (lost) current?.focus();
          if (--frames > 0) requestAnimationFrame(restore);
        };
        requestAnimationFrame(restore);
      }
    };
    // Escape closes this panel only: caught on the way down (window, capture) and stopped there, or Payload's own Escape
    // handler on the document also closes the sidebar and takes the focus with it
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      close(true);
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !link?.contains(target)) close(false);
    };
    const onResize = () => close(false);
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const role = user?.role && user.role in t ? t[user.role] : null;
  return (
    <>
      <span className="hc-avatar" aria-hidden="true" ref={mark}>
        {letter || <UserIcon />}
      </span>
      {open && place
        ? createPortal(
            <div
              id={id}
              ref={panel}
              className="hc-menu"
              role="dialog"
              aria-label={t.menu}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              style={{ top: place.top, insetInlineEnd: place.side }}
            >
              <div className="hc-menu__who">
                <span className="hc-menu__avatar" aria-hidden="true">{letter || <UserIcon />}</span>
                <span className="hc-menu__text">
                  <strong>{user?.name || user?.email}</strong>
                  {user?.email ? <bdi dir="ltr">{user.email}</bdi> : null}
                  {role ? <span className="hc-menu__role">{role}</span> : null}
                </span>
              </div>
              <ul className="hc-menu__list" role="list">
                <li>
                  <a className="hc-menu__item" href={`${admin}/account`}>
                    <UserIcon />
                    <span>{t.profile}</span>
                  </a>
                </li>
                <li>
                  <a className="hc-menu__item hc-menu__item--out" href={`${admin}${config.admin.routes.logout}`}>
                    <OutIcon />
                    <span>{t.signOut}</span>
                  </a>
                </li>
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
