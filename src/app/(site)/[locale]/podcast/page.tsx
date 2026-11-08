import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAudio } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { AudioItem } from '../../../../components/AudioItem.tsx';
import { SourceNote } from '../../../../components/InfoBits.tsx';

type Props = { params: Promise<{ locale: string }> };

/** The four first episodes' guests as the decade book lists them (p. 171); recordings appear once an editor adds them. */
const BOOK_GUESTS = 4;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/podcast', title: ctx.t('podcast.title'), description: ctx.t('podcast.lead'), card: { key: 'podcast' } });
}

/** «بودكاست سقاية»: the programme as the Center describes it, and its published episodes (audio series «saqaya»). */
export default async function PodcastPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, lang } = ctx;
  const episodes = await listAudio(locale, { series: 'saqaya' });
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('podcast.title'), url: absolute(`/${lang.code}/podcast`) },
  ]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('podcast.title') }]} title={t('podcast.title')} lead={t('podcast.lead')} />
      <div className="container container--narrow section info-page">
        <section className="info-section" aria-labelledby="about-podcast-h">
          <h2 id="about-podcast-h" className="sr-only">{t('podcast.about')}</h2>
          <p>{t('podcast.text')}</p>
          <dl className="info-facts">
            <dt>{t('podcast.hostLabel')}</dt>
            <dd>{t('podcast.host')}</dd>
            <dt>{t('podcast.guestsLabel')}</dt>
            <dd>
              <ul>
                {Array.from({ length: BOOK_GUESTS }, (_, i) => <li key={i}>{t(`podcast.guest${i + 1}`)}</li>)}
              </ul>
            </dd>
          </dl>
          <SourceNote ctx={ctx} pages="171" />
        </section>
        <section className="media-list" aria-labelledby="episodes-h">
          <h2 id="episodes-h">{t('podcast.episodes')}</h2>
          {episodes.length ? episodes.map((item) => <AudioItem key={item.id} ctx={ctx} item={item} />) : <p className="empty-state">{t('podcast.empty')}</p>}
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
