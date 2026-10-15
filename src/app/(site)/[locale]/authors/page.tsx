import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAuthors } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/authors', title: ctx.t('authors.title'), description: ctx.t('authors.lead') });
}

export default async function AuthorsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? '';
  const authors = await listAuthors(locale, q || undefined);
  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t('authors.title')}</h1>
          <p>{t('authors.lead')}</p>
          <form role="search" action={href('/authors')} className="searchbox" style={{ marginBlockStart: '1rem', maxInlineSize: '28rem' }}>
            <label className="sr-only" htmlFor="aq">{t('nav.search')}</label>
            <input id="aq" className="input" type="search" name="q" defaultValue={q} placeholder={t('search.placeholder')} style={{ paddingInlineStart: '0.85rem' }} />
          </form>
        </div>
      </div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-5)' }}>
        <p className="result-count">{t('list.count', { count: authors.length })}</p>
        <ul className="author-list">
          {authors.map((a) => (
            <li key={a.id}>
              <Link href={href(`/authors/${a.id}`)}>{a.name}</Link> <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>· {t('authors.works', { count: a.count })}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
