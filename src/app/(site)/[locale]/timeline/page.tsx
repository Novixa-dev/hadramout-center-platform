import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite, listTimeline } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { byYear, yearRange } from '../../../../lib/timeline.ts';
import { formatDate } from '../../../../lib/dates.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Icon } from '../../../../components/Icon.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/timeline', title: ctx.t('timeline.title'), description: `${ctx.t('timeline.lead')} ${ctx.t('timeline.review')}`, card: { key: 'timeline' } });
}

export default async function TimelinePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const [events, site] = await Promise.all([listTimeline(locale), getSite(locale)]);
  const labels = { bce: (n: number) => `${n} ${t('timeline.bce')}`, ce: (n: number) => `${n} ${t('timeline.ce')}` };
  const sorted = [...events].sort(byYear);
  // group by era (editor-entered), keeping chronological order of first appearance
  const groups: { era: string; items: typeof sorted }[] = [];
  for (const e of sorted) {
    const era = e.era?.trim() || '';
    const g = groups.find((x) => x.era === era);
    if (g) g.items.push(e);
    else groups.push({ era, items: [e] });
  }
  const pending = sorted.filter((e) => e.reviewStatus !== 'reviewed').length;
  const ld = [
    collectionJsonLd({ name: t('timeline.title'), description: t('timeline.lead'), url: absolute(`/${lang.code}/timeline`), lang: lang.tag, org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') }, items: sorted.map((e) => ({ name: `${yearRange(e.yearFrom, e.yearTo, labels)} — ${e.title}`, url: absolute(`/${lang.code}/timeline#e${e.id}`) })) }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('timeline.title'), url: absolute(`/${lang.code}/timeline`) }]),
  ];
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('timeline.title') }]} title={t('timeline.title')} lead={t('timeline.lead')} />
      <div className="container--narrow section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        {pending > 0 ? <p className="notice notice--warn" style={{ marginBlockEnd: 'var(--space-5)' }}><Icon name="info" /> {t('timeline.review')}</p> : null}
        {groups.length > 1 ? (
          <nav aria-label={t('timeline.eras')} style={{ marginBlockEnd: 'var(--space-5)' }}>
            <ul className="chips">
              {groups.filter((g) => g.era).map((g, i) => <li key={g.era}><a className="chip chip--lg chip--outline" href={`#era-${i}`}>{g.era}</a></li>)}
            </ul>
          </nav>
        ) : null}
        {groups.map((g, gi) => (
          <section key={g.era || 'none'} className="era" id={`era-${gi}`} aria-labelledby={g.era ? `era-h-${gi}` : undefined}>
            {g.era ? <h2 id={`era-h-${gi}`}>{g.era}</h2> : null}
            <ol className="timeline">
              {g.items.map((e) => (
                <li key={e.id} id={`e${e.id}`} className="timeline__item">
                  <p className="timeline__year">{yearRange(e.yearFrom, e.yearTo, labels)}</p>
                  <h3>{e.title}</h3>
                  {e.body ? <p style={{ color: 'var(--text-2)' }}>{e.body}</p> : null}
                  <div className="timeline__foot">
                    {e.reviewStatus === 'reviewed' ? (
                      <span className="badge badge--ok"><Icon name="check" />{t('timeline.reviewed')}{e.reviewedAt ? ` · ${formatDate(e.reviewedAt, locale)}` : ''}</span>
                    ) : (
                      <span className="badge badge--warn"><Icon name="info" />{t('timeline.pending')}</span>
                    )}
                    {e.source ? <span>{t('timeline.source')}: {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">{e.source}</a> : e.source}</span> : <span>{t('timeline.noSource')}</span>}
                    {e.relatedArticle ? <Link href={href(`/articles/${e.relatedArticle}`)}>{t('timeline.relatedStudy')}</Link> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {sorted.length === 0 ? <p className="empty">{t('list.empty')}</p> : null}
      </div>
      {ld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}
