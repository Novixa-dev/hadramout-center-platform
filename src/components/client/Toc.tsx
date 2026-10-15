'use client';
import { useEffect, useRef } from 'react';

/** Marks the heading currently being read (scroll-spy) with aria-current="location". Server renders the full list. */
export function TocSpy({ listId }: { listId: string }) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    const links = [...list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    const mark = (id: string | null) => {
      if (id === last.current) return;
      last.current = id;
      for (const a of links) {
        if (id && decodeURIComponent(a.hash.slice(1)) === id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    };
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = targets.find((t) => visible.has(t.id));
        if (first) mark(first.id);
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    for (const t of targets) io.observe(t);
    return () => io.disconnect();
  }, [listId]);
  return null;
}
