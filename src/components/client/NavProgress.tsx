'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin progress bar at the top of the page while a client-side navigation or a filter form is loading.
 * It starts on a click on an internal link / a GET form submit and ends when the URL (path or query) changes; a timeout is the safety net.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [active, setActive] = useState(false);
  const stop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setActive(false);
    clearTimeout(stop.current);
  }, [pathname, search]);

  useEffect(() => {
    const start = () => {
      setActive(true);
      clearTimeout(stop.current);
      stop.current = setTimeout(() => setActive(false), 10_000);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
      if (a.pathname === location.pathname && a.search === location.search) return; // same page / hash jump
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!e.defaultPrevented && (f.method || 'get').toLowerCase() === 'get') start();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
      clearTimeout(stop.current);
    };
  }, []);

  return <div className="nav-progress" data-active={active ? 'true' : 'false'} aria-hidden="true" />;
}
