import Link from 'next/link';
import { headers } from 'next/headers';
import { makeCtx } from '../../../lib/ctx.ts';

export default async function NotFound() {
  const h = await headers();
  const lang = (h.get('x-pathname') ?? '').split('/')[1] || 'ar';
  const { t, href } = makeCtx(lang);
  return (
    <div className="container error-page">
      <p className="code" aria-hidden="true">404</p>
      <h1>{t('error.404.title')}</h1>
      <p style={{ color: 'var(--text-2)', maxInlineSize: '32rem' }}>{t('error.404.text')}</p>
      <form role="search" action={href('/search')} className="hero__search" style={{ inlineSize: 'min(100%, 28rem)' }}>
        <label className="sr-only" htmlFor="nf-q">{t('nav.search')}</label>
        <input id="nf-q" className="input" type="search" name="q" placeholder={t('search.placeholder')} />
        <button className="btn btn--primary" type="submit">{t('nav.search')}</button>
      </form>
      <Link className="btn btn--secondary" href={href('/')}>{t('error.home')}</Link>
    </div>
  );
}
