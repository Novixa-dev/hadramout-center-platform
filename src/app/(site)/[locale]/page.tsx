import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../lib/ctx.ts';
import { getSite } from '../../../lib/data.ts';
import { getTopics, latest, rowCount } from '../../../lib/facets.ts';
import { buildMetadata } from '../../../lib/seo.ts';
import { describe } from '../../../lib/seo-text.ts';
import { jsonLdString, siteJsonLd } from '../../../lib/jsonld.ts';
import { isSocialName } from '../../../components/Icon.tsx';
import { PlatformShowcase } from '../../../components/PlatformShowcase.tsx';
import { VideosSection } from '../../../components/VideosSection.tsx';
import { HomeEditorial } from '../../../components/HomeEditorial.tsx';
import { TopicsSection } from '../../../components/TopicsSection.tsx';
import { LatestIssuesSection } from '../../../components/LatestIssuesSection.tsx';
import { PublicationsSection } from '../../../components/PublicationsSection.tsx';
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
  const [site, counts, issues, news, books, upcoming, recentEvents, forum, videos, topics] = await Promise.all([
    getSite(locale),
    Promise.all((['article', 'book', 'magazine', 'event', 'forum', 'news'] as const).map(rowCount)),
    latest('magazine', locale, 10),
    latest('news', locale, 4),
    latest('book', locale, 12),
    latest('event', locale, 3, { when: 'upcoming', sort: 'oldest' }),
    latest('event', locale, 3),
    latest('forum', locale, 3),
    latest('video', locale, 3),
    getTopics(locale),
  ]);
  const [nArticles, nBooks, nIssues, nEvents, nForum, nNews] = counts;
  const events = upcoming.length ? upcoming : recentEvents;
  const PRIORITY_ORDER = [21, 15, 26, 38, 31, 39, 35, 10, 16, 42, 23, 14];
  const featuredTopics = [...topics.roots]
    .filter((r) => r.total > 0)
    .sort((a, b) => {
      const pA = PRIORITY_ORDER.indexOf(a.id);
      const pB = PRIORITY_ORDER.indexOf(b.id);
      if (pA !== -1 && pB !== -1) return pA - pB;
      if (pA !== -1) return -1;
      if (pB !== -1) return 1;
      return b.total - a.total;
    })
    .slice(0, 12);
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

  return (
    <>
      <section className="hero-custom" aria-labelledby="hero-h">
        <div
          className="hero-custom__bg"
          aria-hidden="true"
          style={{ backgroundImage: `url('${lang.code === 'ar' ? '/img.jpg' : '/img-1.jpg'}')` }}
        >
          <div className="hero-custom__overlay" />
        </div>
        <div className="container hero-custom__container">
          <div className="hero-custom__content">
            <p className="hero-custom__kicker">
              <span className="hero-custom__kicker-line" aria-hidden="true" />
              <span>{t('home.hero.kicker')}</span>
              <span className="hero-custom__kicker-line" aria-hidden="true" />
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

      <TopicsSection ctx={ctx} topics={featuredTopics} limit={12} />

      <HomeEditorial ctx={ctx} news={news} events={events} forum={forum} upcoming={upcoming} />

      <PlatformShowcase ctx={ctx} />

      <LatestIssuesSection ctx={ctx} issues={issues} />

      <PublicationsSection ctx={ctx} books={books} />

      <VideosSection ctx={ctx} videos={videos} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
