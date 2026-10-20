import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { getAuthor, getSite } from '../../../../../lib/data.ts';
import { queryArchive } from '../../../../../lib/facets.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString, personJsonLd } from '../../../../../lib/jsonld.ts';
import { BookCard, EntryList, SectionHead } from '../../../../../components/Cards.tsx';
import { PageHead } from '../../../../../components/PageHead.tsx';

type Props = { params: Promise<{ locale: string; id: string }> };

const ARTICLES_SHOWN = 30;

async function load(locale: string, id: string) {
  if (!isLocale(locale) || !/^\d+$/.test(id)) return null;
  const author = await getAuthor(Number(id), locale);
  if (!author) return null;
  const [articles, books] = await Promise.all([
    queryArchive({ type: 'article', lang: locale, author: author.id, limit: ARTICLES_SHOWN }),
    queryArchive({ type: 'book', lang: locale, author: author.id, limit: 60 }),
  ]);
  if (articles.total + books.total === 0) return null; // only authors with published work have a page
  return { author, articles, books };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await load(locale, id);
  if (!data) return {};
  const ctx = makeCtx(locale);
  const { author, articles, books } = data;
  return buildMetadata({
    ctx,
    path: `/authors/${id}`,
    title: author.name,
    description: author.bio ?? ctx.t('authors.page.meta', { name: author.name, articles: articles.total, books: books.total }),
    card: { key: 'authors' },
    readyLangs: ['ar'],
    incomplete: locale !== 'ar',
    feed: { file: `author-${id}`, title: author.name },
  });
}

export default async function AuthorPage({ params }: Props) {
  const { locale, id } = await params;
  const data = await load(locale, id);
  if (!data) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const site = await getSite(locale);
  const { author, articles, books } = data;
  const works = [...books.docs.map((d) => ({ name: d.title, url: absolute(`/${lang.code}/books/${d.id}`) })), ...articles.docs.map((d) => ({ name: d.title, url: absolute(`/${lang.code}/articles/${d.id}`) }))];
  const ld = [
    personJsonLd({ name: author.name, url: absolute(`/${lang.code}/authors/${author.id}`), lang: lang.tag, bio: author.bio, works, org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') } }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('authors.title'), url: absolute(`/${lang.code}/authors`) }, { name: author.name, url: absolute(`/${lang.code}/authors/${author.id}`) }]),
  ];
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('authors.title'), path: '/authors' }, { name: author.name }]} title={author.name} lead={author.bio}>
        <ul className="stats">
          {articles.total ? <li><strong>{articles.total}</strong><span>{t('home.stats.articles')}</span></li> : null}
          {books.total ? <li><strong>{books.total}</strong><span>{t('home.stats.books')}</span></li> : null}
        </ul>
      </PageHead>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        {books.docs.length ? (
          <section style={{ marginBlockEnd: 'var(--space-8)' }} aria-labelledby="ab">
            <SectionHead title={t('authors.books')} id="ab" href={books.total > books.docs.length ? `${href('/books')}?author=${author.id}` : undefined} more={t('section.viewAll')} />
            <div className="results-grid results-grid--books">{books.docs.map((d) => <BookCard key={d.id} ctx={ctx} doc={d} />)}</div>
          </section>
        ) : null}
        {articles.docs.length ? (
          <section aria-labelledby="aa">
            <SectionHead title={`${t('authors.articles')} (${articles.total})`} id="aa" />
            <EntryList ctx={ctx} docs={articles.docs} type="article" />
            {articles.total > articles.docs.length ? <p style={{ marginBlockStart: 'var(--space-5)' }}><Link className="btn btn--secondary" href={`${href('/articles')}?author=${author.id}`}>{t('authors.allArticles', { count: articles.total })}</Link></p> : null}
          </section>
        ) : null}
      </div>
      {ld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
