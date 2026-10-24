import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../lib/ctx.ts';
import { getSite, listTimeline } from '../../../lib/data.ts';
import { getTopics, latest, rowCount, topAuthors } from '../../../lib/facets.ts';
import { buildMetadata } from '../../../lib/seo.ts';
import { describe } from '../../../lib/seo-text.ts';
import { jsonLdString, siteJsonLd } from '../../../lib/jsonld.ts';
import { isSocialName } from '../../../components/Icon.tsx';
import { BookCard, EntryList, EventRow, IssueCard, SectionHead, Tile, VideoTile } from '../../../components/Cards.tsx';
import { searchLabels } from '../../../components/Shell.tsx';
import { SearchBox } from '../../../components/client/SearchBox.tsx';
import { Icon } from '../../../components/Icon.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ctx = makeCtx(locale);
  const site = await getSite(locale);
  const full = `${site.name} — ${ctx.t('home.hero.eyebrow')}`;
  const title = full.length <= 70 ? full : `${site.shortName || site.name} — ${ctx.t('home.hero.eyebrow')}`;
  return buildMetadata({ ctx, path: '/', title, absoluteTitle: true, description: describe(site.description, site.tagline, ctx.t('home.hero.lead')), card: { key: 'home' } });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const [site, counts, issues, articles, news, books, upcoming, recentEvents, forum, videos, topics, authors, timeline] = await Promise.all([
    getSite(locale),
    Promise.all((['article', 'book', 'magazine', 'event', 'forum', 'news'] as const).map(rowCount)),
    latest('magazine', locale, 8),
    latest('article', locale, 6),
    latest('news', locale, 4),
    latest('book', locale, 10),
    latest('event', locale, 3, { when: 'upcoming', sort: 'oldest' }),
    latest('event', locale, 3),
    latest('forum', locale, 3),
    latest('video', locale, 3),
    getTopics(locale),
    topAuthors(locale, 14),
    listTimeline(locale),
  ]);
  const [nArticles, nBooks, nIssues, nEvents, nForum, nNews] = counts;
  const events = upcoming.length ? upcoming : recentEvents;
  const roots = topics.roots.filter((r) => r.total > 0 && r.children.length > 0).slice(0, 8);
  const fmt = new Intl.NumberFormat('en');

  const stats: [string, number, string][] = [
    ['/articles', nArticles, t('home.stats.articles')],
    ['/books', nBooks, t('home.stats.books')],
    ['/magazines', nIssues, t('home.stats.issues')],
    ['/events', nEvents + nForum, t('home.stats.events')],
    ['/news', nNews, t('home.stats.news')],
  ];
  const sameAs = Object.entries(site.social ?? {}).filter(([k, v]) => v && isSocialName(k)).map(([, v]) => v as string);
  const ld = siteJsonLd({ name: site.name, alternateName: site.shortName, origin: absolute(''), logo: absolute('/icons/icon-512.png'), description: describe(site.description), email: site.email, address: site.address, sameAs, lang: lang.code });
  const fmtYear = (y: number) => (y < 0 ? `${Math.abs(y)} ${t('timeline.bce')}` : String(y));

  return (
    <>
      <section className="hero-custom" aria-labelledby="hero-h">
        <div className="hero-custom__bg" aria-hidden="true">
          <div className="hero-custom__overlay" />
          <div className="hero-custom__mandala" />
        </div>
        <div className="container hero-custom__container">
          <div className="hero-custom__content">
            <p className="hero-custom__kicker">
              <span className="hero-custom__flourish" aria-hidden="true">❖</span>
              {t('home.hero.kicker')}
              <span className="hero-custom__flourish" aria-hidden="true">❖</span>
            </p>
            <h1 id="hero-h" className="hero-custom__title">
              <span className="hero-custom__title-1">{t('home.hero.titlePart1')}</span>
              <span className="hero-custom__title-2">{t('home.hero.titlePart2')}</span>
            </h1>
            <p className="hero-custom__lead">
              {t('home.hero.leadCustom')}
            </p>

            <div className="hero-custom__search">
              <SearchBox
                action={href('/search')}
                lang={lang.code}
                variant="hero"
                labels={{
                  ...searchLabels(ctx),
                  placeholder: t('home.hero.searchPlaceholder'),
                  submit: t('home.search.submit'),
                }}
                size="lg"
              />
            </div>

            <div className="hero-custom__stats" aria-label={t('footer.explore')}>
              <Link href={href('/search')} className="hero-custom__stat">
                <div className="hero-custom__stat-head">
                  <span className="hero-custom__stat-num">{t('home.hero.stat1.val')}</span>
                  <Icon name="manuscript" className="hero-custom__stat-icon" />
                </div>
                <span className="hero-custom__stat-label">{t('home.hero.stat1.label')}</span>
              </Link>

              <div className="hero-custom__stat-divider" aria-hidden="true" />

              <Link href={href('/authors')} className="hero-custom__stat">
                <div className="hero-custom__stat-head">
                  <span className="hero-custom__stat-num">{t('home.hero.stat2.val')}</span>
                  <Icon name="users" className="hero-custom__stat-icon" />
                </div>
                <span className="hero-custom__stat-label">{t('home.hero.stat2.label')}</span>
              </Link>

              <div className="hero-custom__stat-divider" aria-hidden="true" />

              <Link href={href('/magazines')} className="hero-custom__stat">
                <div className="hero-custom__stat-head">
                  <span className="hero-custom__stat-num">{t('home.hero.stat3.val')}</span>
                  <Icon name="layers" className="hero-custom__stat-icon" />
                </div>
                <span className="hero-custom__stat-label">{t('home.hero.stat3.label')}</span>
              </Link>
            </div>

            <div className="hero-custom__divider" aria-hidden="true">
              <span className="hero-custom__divider-line" />
              <Icon name="rosette" className="hero-custom__divider-rosette" />
              <span className="hero-custom__divider-line" />
            </div>
          </div>
        </div>
      </section>

      <div className="strip">
        <div className="container">
          <ul className="stats" aria-label={site.shortName ?? site.name}>
            {stats.map(([path, n, label]) => (
              <li key={path}>
                <Link href={href(path)}>
                  <strong>{fmt.format(n)}</strong> <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="section section--tight">
        <div className="container split">
          <div>
            <SectionHead title={t('home.latestNews')} href={href('/news')} more={t('home.news.more')} />
            {news.length ? (
              <div className="stack-list">
                <Tile ctx={ctx} doc={news[0]!} type="news" lead eager />
                {news.slice(1).map((d) => <Tile key={d.id} ctx={ctx} doc={d} type="news" row />)}
              </div>
            ) : null}
          </div>
          <div>
            <SectionHead title={upcoming.length ? t('home.upcoming') : t('home.events')} href={href('/events')} more={t('section.viewAll')} as="h2" />
            <div>{events.map((d) => <EventRow key={d.id} ctx={ctx} doc={d} type="event" />)}</div>
            {forum.length ? (
              <div style={{ marginBlockStart: 'var(--space-6)' }}>
                <SectionHead title={t('home.forum')} href={href('/forum')} more={t('section.viewAll')} />
                <div>{forum.map((d) => <EventRow key={d.id} ctx={ctx} doc={d} type="forum" />)}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section--tight cv section--tint">
        <div className="container">
          <SectionHead title={t('home.topics')} href={href('/topics')} more={t('home.topics.more')} lead={t('home.topics.lead')} />
          <div className="topic-grid">
            {roots.map((r) => (
              <article key={r.id} className="topic-card">
                <p className="topic-card__count">{t('topics.count', { count: r.total })}</p>
                <h3><Link href={href(`/topics/${r.id}`)}>{r.name}</Link></h3>
                <ul aria-label={t('topics.sub')}>
                  {r.children.filter((c) => c.own > 0).slice(0, 4).map((c) => <li key={c.id}><Link href={href(`/topics/${c.id}`)}>{c.name}</Link></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight cv">
        <div className="container split split--even">
          <div>
            <SectionHead title={t('home.latestArticles')} href={href('/articles')} more={t('section.viewAll')} />
            <EntryList ctx={ctx} docs={articles} type="article" />
          </div>
          <div>
            <SectionHead title={t('home.authors')} href={href('/authors')} more={t('home.authors.more')} />
            <ul className="authors-cloud">
              {authors.map((a) => (
                <li key={a.id}><Link className="chip chip--lg chip--outline" href={href(`/authors/${a.id}`)}>{a.name} <small>{a.count}</small></Link></li>
              ))}
            </ul>
            {timeline.length ? (
              <div style={{ marginBlockStart: 'var(--space-8)' }}>
                <SectionHead title={t('home.timeline')} href={href('/timeline')} more={t('home.timeline.more')} />
                <ol className="stack-list" style={{ listStyle: 'none', padding: 0 }}>
                  {timeline.slice(0, 3).map((e) => (
                    <li key={e.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(5.5rem, auto) 1fr', gap: '1rem', alignItems: 'baseline' }}>
                      <strong style={{ color: 'var(--accent-text)', fontVariantNumeric: 'tabular-nums' }}>{fmtYear(e.yearFrom)}</strong>
                      <span>{e.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section--tight cv section--tint">
        <div className="container">
          <SectionHead title={t('home.issues')} href={href('/magazines')} more={t('section.viewAll')} />
          <div className="shelf shelf--issues">
            {issues.map((d) => <IssueCard key={d.id} ctx={ctx} doc={d} />)}
          </div>
        </div>
      </section>

      <section className="section section--tight cv">
        <div className="container">
          <SectionHead title={t('home.books')} href={href('/books')} more={t('section.viewAll')} />
          <div className="shelf">
            {books.map((d) => <BookCard key={d.id} ctx={ctx} doc={d} />)}
          </div>
        </div>
      </section>

      {videos.length ? (
        <section className="section section--tight cv section--tint">
          <div className="container">
            <SectionHead title={t('home.videos')} href={href('/videos')} more={t('section.viewAll')} />
            <div className="grid">
              {videos.map((d) => <VideoTile key={d.id} ctx={ctx} doc={d} />)}
            </div>
          </div>
        </section>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
