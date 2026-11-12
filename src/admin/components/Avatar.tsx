'use client';
import { useAuth } from '@payloadcms/ui';

/**
 * The account button in the header: the person's first letter on the site's green, instead of a grey silhouette, so it is
 * clearly *your* profile. Payload wraps it in the link to the account page and gives that link its label.
 */
export function Avatar() {
  const { user } = useAuth<{ name?: string; email?: string }>();
  const source = (user?.name || user?.email || '').trim();
  const letter = source ? Array.from(source)[0]?.toUpperCase() : '';
  return (
    <span className="hc-avatar" aria-hidden="true">
      {letter || <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></svg>}
    </span>
  );
}
