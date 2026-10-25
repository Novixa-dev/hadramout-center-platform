import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { getTopics } from '../../../../lib/facets.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { TopicsHub } from '../../../../components/TopicsHub.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  const topics = await getTopics(locale);
  const total = topics.roots.reduce((s, r) => s + r.total, 0);
  return buildMetadata({ ctx, path: '/topics', title: ctx.t('topics.title'), description: ctx.t('topics.meta', { count: total, topics: topics.roots.length }), card: { key: 'topics' }, readyLangs: ['ar'], incomplete: locale !== 'ar' });
}

export default async function TopicsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, lang } = ctx;
  const [topics, site] = await Promise.all([getTopics(locale), getSite(locale)]);
  // curated topics have sub-categories; stray single categories are listed together under "other"
  const roots = topics.roots.filter((r) => r.total > 0 && r.children.length > 0);
  const others = topics.roots.filter((r) => r.total > 0 && r.children.length === 0);
  const ld = [
    collectionJsonLd({ name: t('topics.title'), description: t('topics.lead'), url: absolute(`/${lang.code}/topics`), lang: lang.tag, org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') }, items: roots.map((r) => ({ name: r.name, url: absolute(`/${lang.code}/topics/${r.id}`) })) }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('topics.title'), url: absolute(`/${lang.code}/topics`) }]),
  ];
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('topics.title') }]} title={t('topics.title')} lead={t('topics.lead')} />
      <div className="container" style={{ paddingBlockStart: 'var(--space-6)', paddingBlockEnd: 'var(--space-8)' }}>
        <TopicsHub ctx={ctx} roots={roots} others={others} uncategorised={topics.uncategorised} />
      </div>
      {ld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
