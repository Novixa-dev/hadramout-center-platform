import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { getTopics } from '../../../../lib/facets.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  const topics = await getTopics(locale);
  const total = topics.roots.reduce((s, r) => s + r.total, 0);
  return buildMetadata({ ctx, path: '/topics', title: ctx.t('topics.title'), description: ctx.t('topics.meta', { count: total, topics: topics.roots.length }), card: { key: 'topics' } });
}

export default async function TopicsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const [topics, site] = await Promise.all([getTopics(locale), getSite(locale)]);
  const roots = topics.roots.filter((r) => r.total > 0);
  const ld = [
    collectionJsonLd({ name: t('topics.title'), description: t('topics.lead'), url: absolute(`/${lang.code}/topics`), lang: lang.tag, org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') }, items: roots.map((r) => ({ name: r.name, url: absolute(`/${lang.code}/topics/${r.id}`) })) }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('topics.title'), url: absolute(`/${lang.code}/topics`) }]),
  ];
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('topics.title') }]} title={t('topics.title')} lead={t('topics.lead')} />
      <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        <div className="topic-grid">
          {roots.map((r) => (
            <article key={r.id} className="topic-card">
              <p className="topic-card__count">{t('topics.count', { count: r.total })}</p>
              <h2 style={{ fontSize: 'var(--step-1)' }}><Link href={href(`/topics/${r.id}`)} style={{ color: 'var(--text)', textDecoration: 'none' }} className="stretch__link">{r.name}</Link></h2>
              {r.description ? <p style={{ color: 'var(--text-2)', fontSize: 'var(--step--1)' }}>{r.description}</p> : null}
              {r.children.length ? (
                <ul aria-label={t('topics.sub')}>
                  {r.children.filter((c) => c.own > 0).slice(0, 8).map((c) => (
                    <li key={c.id}><Link href={href(`/topics/${c.id}`)}>{c.name}</Link> <span aria-hidden="true">({c.own})</span></li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
        {topics.uncategorised > 0 ? <p className="notice" style={{ marginBlockStart: 'var(--space-6)' }}>{t('topics.uncategorised', { count: topics.uncategorised })} <Link href={href('/articles')}>{t('topics.browseAll')}</Link></p> : null}
      </div>
      {ld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
