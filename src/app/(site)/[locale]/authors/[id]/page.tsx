import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { getAuthor, listDocs } from '../../../../../lib/data.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { Card } from '../../../../../components/Cards.tsx';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^\d+$/.test(id)) return {};
  const author = await getAuthor(Number(id), locale);
  if (!author) return {};
  return buildMetadata({ ctx: makeCtx(locale), path: `/authors/${id}`, title: author.name, description: author.bio ?? undefined, readyLangs: ['ar'], incomplete: locale !== 'ar' });
}

export default async function AuthorPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^\d+$/.test(id)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const author = await getAuthor(Number(id), locale);
  if (!author) notFound();
  const [articles, books] = await Promise.all([
    listDocs({ type: 'article', lang: locale, authorId: author.id, limit: 100 }),
    listDocs({ type: 'book', lang: locale, authorId: author.id, limit: 50 }),
  ]);
  return (
    <>
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label={t('a11y.breadcrumb')}><ol><li><Link href={href('/')}>{t('nav.home')}</Link></li><li><Link href={href('/authors')}>{t('authors.title')}</Link></li></ol></nav>
          <h1 style={{ marginBlockStart: '0.5rem' }}>{author.name}</h1>
          {author.bio ? <p>{author.bio}</p> : null}
        </div>
      </div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        {books.docs.length ? (
          <section style={{ marginBlockEnd: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: '1rem' }}>{t('authors.books')}</h2>
            <div className="grid grid--books">{books.docs.map((d) => <Card key={d.id} ctx={ctx} doc={d} type="book" />)}</div>
          </section>
        ) : null}
        {articles.docs.length ? (
          <section>
            <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: '1rem' }}>{t('authors.articles')} ({articles.total})</h2>
            <div className="grid">{articles.docs.map((d) => <Card key={d.id} ctx={ctx} doc={d} type="article" />)}</div>
          </section>
        ) : null}
      </div>
    </>
  );
}
