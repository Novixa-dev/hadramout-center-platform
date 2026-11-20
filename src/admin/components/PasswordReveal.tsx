'use client';
import { useEffect, type ReactNode } from 'react';

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></svg>';

/**
 * A show/hide button on every password field of the admin (sign-in, reset, your account, a new user). Payload renders
 * these fields itself, so the button is attached to its markup and re-attached when Payload re-renders a form.
 * Wired as an admin provider (payload.config.ts → admin.components.providers).
 */
export function PasswordReveal({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const text = () => (document.documentElement.lang?.startsWith('en') ? { show: 'Show password', hide: 'Hide password' } : { show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور' });
    const attach = () => {
      for (const input of document.querySelectorAll<HTMLInputElement>('.field-type.password input:not([data-hc-reveal])')) {
        const wrap = input.parentElement;
        if (!wrap) continue;
        input.dataset.hcReveal = '1';
        if (!input.id) input.id = `hc-pw-${Math.random().toString(36).slice(2)}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hc-pw-toggle';
        btn.setAttribute('aria-controls', input.id);
        const render = () => {
          const shown = input.type === 'text';
          const t = text();
          btn.setAttribute('aria-pressed', String(shown));
          btn.setAttribute('aria-label', shown ? t.hide : t.show);
          btn.innerHTML = shown ? EYE_OFF : EYE;
        };
        btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus and caret in the field
        btn.addEventListener('click', () => {
          input.type = input.type === 'password' ? 'text' : 'password';
          render();
        });
        render();
        wrap.classList.add('hc-pw-wrap');
        wrap.appendChild(btn);
      }
    };
    attach();
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(attach);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return <>{children}</>;
}
