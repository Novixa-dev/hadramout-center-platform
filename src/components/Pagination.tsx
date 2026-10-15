import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { Icon } from './Icon.tsx';

function pageList(page: number, pages: number): (number | '…')[] {
  const out: (number | '…')[] = [];
  const add = (n: number | '…') => out.at(-1) !== n && out.push(n);
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1 || (page <= 3 && i <= 4) || (page >= pages - 2 && i >= pages - 3)) add(i);
    else add('…');
  }
  return out;
}

/** Keyboard-accessible numbered pagination. Links keep every active filter (URL state) and only add `page`. */
export function Pagination({ ctx, page, pages, basePath, query }: { ctx: Ctx; page: number; pages: number; basePath: string; query: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const { t, href } = ctx;
  const url = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return href(basePath) + (s ? `?${s}` : '');
  };
  return (
    <nav className="pagination" aria-label={t('list.pagination')}>
      {page > 1 ? <Link href={url(page - 1)} rel="prev" aria-label={t('list.prev')}><Icon name="arrow" className="icon icon--flip-ltr" /></Link> : null}
      {pageList(page, pages).map((p, i) =>
        p === '…' ? <span key={`g${i}`} className="gap" aria-hidden="true">…</span> : p === page ? <span key={p} aria-current="page" aria-label={t('list.page', { page: p, pages })}>{p}</span> : <Link key={p} href={url(p)} aria-label={t('list.page', { page: p, pages })}>{p}</Link>,
      )}
      {page < pages ? <Link href={url(page + 1)} rel="next" aria-label={t('list.next')}><Icon name="arrow" className="icon icon--flip" /></Link> : null}
    </nav>
  );
}
