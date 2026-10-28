import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { getTopics } from '../../../../../lib/facets.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { activeFilters, isCustomised, parseListQuery } from '../../../../../lib/list-query.ts';
import { ResearchListing } from '../../../../../components/ResearchListing.tsx';

type Props = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(locale: string, id: string) {
  if (!isLocale(locale) || !/^\d+$/.test(id)) return null;
  const topics = await getTopics(locale);
  const node = topics.byId.get(Number(id));
  if (!node) return null;
  return { topics, node, parent: node.parent !== null ? (topics.byId.get(node.parent) ?? null) : null };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await load(locale, id);
  if (!data) return {};
  const ctx = makeCtx(locale);
  const q = parseListQuery(await searchParams, 'article');
  const desc = data.node.description || ctx.t('topics.auto', { name: data.node.name, count: data.node.total });
  return buildMetadata({
    ctx,
    path: `/topics/${id}`,
    title: data.parent ? `${data.node.name} — ${data.parent.name}` : data.node.name,
    description: desc,
    card: { key: 'topics' },
    readyLangs: ['ar'],
    incomplete: locale !== 'ar',
    feed: { file: `topic-${id}`, title: data.node.name },
    noindex: activeFilters(q).filter((f) => f !== 'topic').length > 0 || isCustomised({ ...q, category: undefined }, 'article'),
    page: q.page,
    pageLabel: ctx.t('list.pageN', { page: q.page }),
  });
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const data = await load(locale, id);
  if (!data) notFound();
  const ctx = makeCtx(locale);
  const { node, parent } = data;
  const sp = await searchParams;
  return (
    <ResearchListing
      ctx={ctx}
      node={node}
      parent={parent}
      basePath={`/topics/${node.id}`}
      searchParams={sp}
      title={node.name}
      description={node.description || ctx.t('topics.auto', { name: node.name, count: node.total })}
    />
  );
}
