import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { MOVED_PAGES } from '../../../../lib/nav.ts';
import { typeFromRoute, type ContentType } from '../../../../lib/content-types.ts';
import { StaticPage, pageMetadata } from '../../../../components/StaticPage.tsx';
import { buildMetadata } from '../../../../lib/seo.ts';
import { activeFilters, isCustomised, parseListQuery } from '../../../../lib/list-query.ts';
import { Listing } from '../../../../components/Listing.tsx';
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
  if (!info) return pageMetadata(ctx, section);
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
  const sp = await searchParams;
  const info = typeFromRoute(section);
  if (!isLocale(locale)) notFound();
  const moved = MOVED_PAGES[section];
  if (moved) permanentRedirect(makeCtx(locale).href(moved));
  const isPreview = sp.preview === '1';
  if (!info) return <StaticPage locale={locale} slug={section} preview={isPreview} />;
  const ctx = makeCtx(locale);
  const { t } = ctx;
  // /events?kind=conference is the menu's «مؤتمرات»: name the list after the type
  const kind = info.type === 'event' ? parseListQuery(sp, info.type).kind : undefined;
  const title = kind ? t(`events.kind.${kind}`) : t(TITLE_KEY[info.type]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: title }]} title={title} lead={t(LEAD_KEY[info.type])} />
      <Listing ctx={ctx} type={info.type} basePath={`/${section}`} searchParams={sp} title={title} crumbs={[]} description={t(LEAD_KEY[info.type])} />
    </>
  );
}
