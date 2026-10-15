import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../../lib/ctx.ts';
import { getTopics } from '../../../../../lib/facets.ts';
import { buildMetadata } from '../../../../../lib/seo.ts';
import { activeFilters, isCustomised, parseListQuery } from '../../../../../lib/list-query.ts';
import { Listing } from '../../../../../components/Listing.tsx';
import { PageHead } from '../../../../../components/PageHead.tsx';

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
  const { t, href } = ctx;
  const { node, parent } = data;
  const lead = node.description || t('topics.auto', { name: node.name, count: node.total });
  const crumbs = [{ name: t('topics.title'), path: '/topics' }, ...(parent ? [{ name: parent.name, path: `/topics/${parent.id}` }] : []), { name: node.name }];
  const kids = node.children.filter((c) => c.own > 0);
  const sp = await searchParams;
  return (
    <>
      <PageHead ctx={ctx} crumbs={crumbs} title={node.name} lead={lead}>
        {kids.length ? (
          <ul className="chips subtopics" aria-label={t('topics.sub')} style={{ marginBlockStart: '1rem' }}>
            {kids.map((c) => (
              <li key={c.id}><Link className="chip chip--lg chip--outline" href={href(`/topics/${c.id}`)}>{c.name} <small>{c.own}</small></Link></li>
            ))}
          </ul>
        ) : parent ? (
          <p style={{ marginBlockStart: '0.8rem' }}><Link className="link-arrow" href={href(`/topics/${parent.id}`)}>{t('topics.backTo', { name: parent.name })}</Link></p>
        ) : null}
      </PageHead>
      <Listing ctx={ctx} type="article" basePath={`/topics/${node.id}`} searchParams={sp} fixed={{ category: node.id }} hide={['topic']} title={node.name} crumbs={crumbs.slice(0, -1).map((c) => ({ name: c.name, path: c.path as string }))} description={lead} />
    </>
  );
}
