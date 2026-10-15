import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx, docHref } from '../../../lib/ctx.ts';
import { countByType, getSite, listDocs } from '../../../lib/data.ts';
import { buildMetadata } from '../../../lib/seo.ts';
import { Card, Cover, EventCard, SectionHead } from '../../../components/Cards.tsx';
import { Skyline } from '../../../components/Skyline.tsx';
import { Icon } from '../../../components/Icon.tsx';
import { NewsletterForm } from '../../../components/client/NewsletterForm.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ctx = makeCtx(locale);
  const site = await getSite(locale);
  return buildMetadata({ ctx, path: '/', title: site.name, description: site.description ?? site.tagline });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const [site, counts, magazines, articles, news, books, upcoming, forum, videos] = await Promise.all([
    getSite(locale),
    countByType(),
    listDocs({ type: 'magazine', lang: locale, limit: 3 }),
    listDocs({ type: 'article', lang: locale, limit: 6 }),
    listDocs({ type: 'news', lang: locale, limit: 3 }),
    listDocs({ type: 'book', lang: locale, limit: 6, sort: 'newest' }),
    listDocs({ type: 'event', lang: locale, limit: 3, when: 'upcoming', sort: 'oldest' }),
    listDocs({ type: 'forum', lang: locale, limit: 3 }),
    listDocs({ type: 'video', lang: locale, limit: 3 }),
  ]);
  const issue = magazines.docs[0];

  const stats: [number, string][] = [
    [counts.article, t('home.stats.articles')],
    [counts.book, t('home.stats.books')],
    [counts.magazine, t('home.stats.issues')],
    [counts.event + counts.forum, t('home.stats.events')],
    [counts.news, t('home.stats.news')],
  ];

  return (
    <>
      <section className="hero pattern">
        <div className="container hero__grid">
        <div className="hero__inner">
          <p className="eyebrow">{t('home.hero.eyebrow')}</p>
          <h1>{t('home.hero.title')}</h1>
          <p className="hero__lead">{t('home.hero.lead')}</p>
          <form className="hero__search" action={href('/search')} role="search">
            <label className="sr-only" htmlFor="home-q">{t('nav.search')}</label>
            <input id="home-q" className="input" type="search" name="q" placeholder={t('home.search.placeholder')} autoComplete="off" />
            <button className="btn btn--gold" type="submit">{t('home.search.submit')}</button>
          </form>
          <nav className="hero__chips" aria-label={t('home.quick.title')}>
            {([['/articles', 'nav.articles'], ['/books', 'nav.books'], ['/magazines', 'nav.magazines'], ['/news', 'nav.news'], ['/events', 'nav.events']] as const).map(([path, key]) => (
              <Link key={path} className="chip chip--glass" href={href(path)}>{t(key)}</Link>
            ))}
          </nav>
        </div>
        {issue ? (
          <Link className="hero__feature" href={docHref(ctx, 'magazine', issue.id)} aria-label={issue.title}>
            <span className="hero__feature-cover"><Cover doc={issue} sizes="260px" priority /></span>
            <span className="hero__feature-text">
              <span className="eyebrow">{t('meta.issue', { n: Number(issue.issueNumber ?? 0) })}</span>
              <strong>{issue.title}</strong>
              <span className="hero__feature-cta">{t('home.readIssue')} <Icon name="arrow" /></span>
            </span>
          </Link>
        ) : null}
        </div>
        <Skyline className="hero__skyline" />
      </section>

      <section className="stats-band">
        <div className="container">
          <div className="stats" aria-label={site.shortName ?? site.name}>
            {stats.map(([n, label]) => (
              <div className="stat" key={label}>
                <strong>{new Intl.NumberFormat('en').format(n)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {news.docs.length ? (
        <section className="section">
          <div className="container">
            <SectionHead title={t('home.latestNews')} href={href('/news')} more={t('home.news.more')} />
            <div className="editorial">
              <Card ctx={ctx} doc={news.docs[0]!} type="news" eager />
              <div className="editorial__side">
                {news.docs.slice(1).map((d) => <Card key={d.id} ctx={ctx} doc={d} type="news" row />)}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {issue ? (
        <section className="section section--tint">
          <div className="container">
            <SectionHead title={t('home.latestIssue')} href={href('/magazines')} more={t('section.viewAll')} />
            <div className="issue-spot">
              <Link className="issue-spot__cover" href={docHref(ctx, 'magazine', issue.id)}>
                <Cover doc={issue} sizes="224px" priority />
              </Link>
              <div className="stack">
                <p className="eyebrow">{t('meta.issue', { n: Number(issue.issueNumber ?? 0) })}</p>
                <h3 style={{ fontSize: 'var(--step-3)' }}><Link href={docHref(ctx, 'magazine', issue.id)} style={{ color: 'inherit', textDecoration: 'none' }}>{issue.title}</Link></h3>
                {issue.excerpt ? <p style={{ color: 'var(--text-2)', maxInlineSize: '40rem' }}>{issue.excerpt}</p> : null}
                <div className="cluster">
                  <Link className="btn btn--primary" href={docHref(ctx, 'magazine', issue.id)}>{t('magazine.contents')}</Link>
                  {typeof issue.pdf === 'string' && issue.pdf ? <a className="btn btn--secondary" href={issue.pdf} target="_blank" rel="noopener noreferrer"><Icon name="download" />{t('magazine.download')}</a> : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <SectionHead title={t('home.latestArticles')} href={href('/articles')} more={t('section.viewAll')} />
          <div className="grid">
            {articles.docs.map((d) => <Card key={d.id} ctx={ctx} doc={d} type="article" />)}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionHead title={t('home.books')} href={href('/books')} more={t('section.viewAll')} />
          <div className="grid grid--books">
            {books.docs.map((d) => <Card key={d.id} ctx={ctx} doc={d} type="book" />)}
          </div>
        </div>
      </section>

      {(upcoming.docs.length || forum.docs.length) ? (
        <section className="section section--tint">
          <div className="container grid grid--wide" style={{ alignItems: 'start' }}>
            {upcoming.docs.length ? (
              <div>
                <SectionHead title={t('home.upcoming')} href={href('/events')} more={t('section.viewAll')} />
                <div className="stack">{upcoming.docs.map((d) => <EventCard key={d.id} ctx={ctx} doc={d} type="event" />)}</div>
              </div>
            ) : null}
            <div>
              <SectionHead title={t('home.forum')} href={href('/forum')} more={t('section.viewAll')} />
              <div className="stack">{forum.docs.map((d) => <EventCard key={d.id} ctx={ctx} doc={d} type="forum" />)}</div>
            </div>
          </div>
        </section>
      ) : null}

      {videos.docs.length ? (
        <section className="section">
          <div className="container">
            <SectionHead title={t('home.videos')} href={href('/videos')} more={t('section.viewAll')} />
            <div className="grid">
              {videos.docs.map((d) => <Card key={d.id} ctx={ctx} doc={d} type="video" />)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section section--tint">
        <div className="container grid grid--wide" style={{ alignItems: 'center' }}>
          <div className="stack">
            <h2>{t('home.cta.title')}</h2>
            <p style={{ color: 'var(--text-2)' }}>{t('home.cta.text')}</p>
            <Link className="btn btn--primary" href={href('/contact')}>{t('nav.contact')}</Link>
          </div>
          <div className="side__box">
            <h2>{t('newsletter.title')}</h2>
            <p style={{ color: 'var(--text-2)', marginBlockEnd: '0.75rem', fontSize: 'var(--step--1)' }}>{t('newsletter.text')}</p>
            <NewsletterForm lang={locale} labels={{ email: t('newsletter.email'), submit: t('newsletter.submit'), ok: t('newsletter.ok'), error: t('newsletter.error') }} />
          </div>
        </div>
      </section>
    </>
  );
}
