import Link from 'next/link';
import { makeCtx } from '../../../lib/ctx.ts';

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
      <form role="search" action="/ar/search" className="hero__search" style={{ inlineSize: 'min(100%, 28rem)' }}>
        <label className="sr-only" htmlFor="nf-q">{ar.t('nav.search')}</label>
        <input id="nf-q" className="input" type="search" name="q" placeholder={ar.t('search.placeholder')} />
        <button className="btn btn--primary" type="submit">{ar.t('nav.search')}</button>
      </form>
      <div className="cluster">
        <Link className="btn btn--secondary" href="/ar">{ar.t('error.home')}</Link>
        <Link className="btn btn--secondary" href="/en" lang="en">{en.t('error.home')}</Link>
      </div>
    </div>
  );
}
