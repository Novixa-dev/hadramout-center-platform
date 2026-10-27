import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { typeFromRoute, type ContentType } from '../../../../lib/content-types.ts';
import { getPage, trInfo } from '../../../../lib/data.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { StaticPage, readyLangsOf } from '../../../../components/StaticPage.tsx';
import { buildMetadata } from '../../../../lib/seo.ts';
import { describe } from '../../../../lib/seo-text.ts';
import { activeFilters, isCustomised, parseListQuery } from '../../../../lib/list-query.ts';
import { Listing } from '../../../../components/Listing.tsx';
import { NewsListing } from '../../../../components/NewsListing.tsx';
import { MagazineListing } from '../../../../components/MagazineListing.tsx';
import { VideosListing } from '../../../../components/VideosListing.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';

type Props = { params: Promise<{ locale: string; section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TITLE_KEY: Record<ContentType, string> = {
  news: 'news.title', article: 'articles.title', book: 'books.title', magazine: 'magazines.title', event: 'events.title', forum: 'forum.title', video: 'videos.title',
};
const LEAD_KEY: Record<ContentType, string> = {
  news: 'news.lead', article: 'articles.lead', book: 'books.lead', magazine: 'magazines.lead', event: 'events.lead', forum: 'forum.intro', video: 'videos.lead',
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, section } = await params;
  const info = typeFromRoute(section);
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  if (!info) {
    const page = await getPage(section, locale);
    if (!page) return {};
    return buildMetadata({ ctx, path: `/${section}`, title: page.title, description: describe(htmlToText(page.body ?? '')), card: { kind: 'pages', id: page.id }, readyLangs: readyLangsOf(page as never), incomplete: locale !== 'ar' && trInfo(page as never, locale).status !== 'complete' });
  }
  const sp = await searchParams;
  const q = parseListQuery(sp, info.type);
  const only = activeFilters(q);
  // a list narrowed to one topic is the topic page's duplicate → point search engines there
  const topicOnly = info.type === 'article' && q.category && only.length === 1 && q.page === 1 && !q.sort && q.view === 'list';
  return buildMetadata({
    ctx,
    path: topicOnly ? `/topics/${q.category}` : `/${section}`,
    title: ctx.t(TITLE_KEY[info.type]),
    description: ctx.t(LEAD_KEY[info.type]),
    card: { key: section },
    noindex: Boolean(topicOnly) || isCustomised(q, info.type),
    page: q.page,
    pageLabel: ctx.t('list.pageN', { page: q.page }),
  });
}

export default async function SectionPage({ params, searchParams }: Props) {
  const { locale, section } = await params;
  const info = typeFromRoute(section);
  if (!isLocale(locale)) notFound();
  if (!info) return <StaticPage locale={locale} slug={section} />;
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const sp = await searchParams;
  const title = t(TITLE_KEY[info.type]);

  if (info.type === 'magazine') {
    return (
      <MagazineListing
        ctx={ctx}
        basePath={`/${section}`}
        searchParams={sp}
        title={title}
        description={t(LEAD_KEY[info.type])}
      />
    );
  }

  if (info.type === 'video') {
    return (
      <VideosListing
        ctx={ctx}
        basePath={`/${section}`}
        searchParams={sp}
        title={title}
        description={t(LEAD_KEY[info.type])}
      />
    );
  }

  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: title }]} title={title} lead={t(LEAD_KEY[info.type])} />
      {info.type === 'news' ? (
        <NewsListing ctx={ctx} basePath={`/${section}`} searchParams={sp} title={title} description={t(LEAD_KEY[info.type])} />
      ) : (
        <Listing ctx={ctx} type={info.type} basePath={`/${section}`} searchParams={sp} title={title} crumbs={[]} description={t(LEAD_KEY[info.type])} />
      )}
    </>
  );
}
