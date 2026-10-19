import Link from 'next/link';
import { makeCtx } from '../../../lib/ctx.ts';
import { SearchBox } from '../../../components/client/SearchBox.tsx';
import { searchLabels } from '../../../components/Shell.tsx';

export const metadata = { title: '404', robots: { index: false, follow: true } };

/** Static and language-neutral on purpose: reading request headers here would force every page that can 404 to render dynamically. */
export default function NotFound() {
  const ar = makeCtx('ar');
  const en = makeCtx('en');
  return (
    <div className="container error-page">
      <p className="code" aria-hidden="true">404</p>
      <h1>{ar.t('error.404.title')}</h1>
      <p style={{ color: 'var(--text-2)', maxInlineSize: '32rem' }}>{ar.t('error.404.text')}</p>
      <p lang="en" dir="ltr" style={{ color: 'var(--text-2)', maxInlineSize: '32rem' }}>{en.t('error.404.title')} — {en.t('error.404.text')}</p>
      <SearchBox action="/ar/search" lang="ar" labels={searchLabels(ar)} />
      <div className="cluster">
        <Link className="btn btn--primary" href="/ar">{ar.t('error.home')}</Link>
        <Link className="btn btn--secondary" href="/ar/articles">{ar.t('nav.articles')}</Link>
        <Link className="btn btn--secondary" href="/ar/books">{ar.t('nav.books')}</Link>
        <Link className="btn btn--secondary" href="/en" lang="en">{en.t('error.home')}</Link>
      </div>
    </div>
  );
}
