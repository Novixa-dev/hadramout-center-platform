import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { rowCount } from '../../../../lib/facets.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { SourceNote, StatusBadge } from '../../../../components/InfoBits.tsx';

type Props = { params: Promise<{ locale: string }> };

/**
 * «المنصات الرقمية» as the Center listed them (feedback report 2026-10-27). Each section states its real status and opens the
 * platform. The store and donations are «by request»: the site takes no payment. The Khizana text is the decade book's (pp. 186–187).
 * Section ids are linked from the menu and the utility bar.
 */
const PLATFORMS: { id: string; path: string; status: 'platforms.status.live' | 'platforms.status.request' }[] = [
  { id: 'cultural', path: '/culture', status: 'platforms.status.live' },
  { id: 'members', path: '/account', status: 'platforms.status.live' },
  { id: 'store', path: '/store', status: 'platforms.status.request' },
  { id: 'donations', path: '/donate', status: 'platforms.status.request' },
  { id: 'volunteering', path: '/volunteer', status: 'platforms.status.live' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/platforms', title: ctx.t('platforms.title'), description: ctx.t('platforms.lead'), card: { key: 'platforms' } });
}

export default async function PlatformsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const entries = await rowCount('encyclopedia');
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('platforms.title'), url: absolute(`/${lang.code}/platforms`) },
  ]);
  const list = (prefix: string, n: number) => (
    <ul>
      {Array.from({ length: n }, (_, i) => <li key={i}>{t(`${prefix}${i + 1}`)}</li>)}
    </ul>
  );

  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('platforms.title') }]} title={t('platforms.title')} lead={t('platforms.lead')} />
      <div className="container container--narrow section info-page">
        <section id="khizana" className="info-section" aria-labelledby="khizana-h">
          <h2 id="khizana-h">{t('platforms.khizana.title')} <StatusBadge kind="live">{t('platforms.khizana.status')}</StatusBadge></h2>
          <p>{t('platforms.khizana.about')}</p>
          <dl className="info-facts">
            <dt>{t('platforms.khizana.sloganLabel')}</dt><dd>{t('platforms.khizana.slogan')}</dd>
            <dt>{t('platforms.khizana.visionLabel')}</dt><dd>{t('platforms.khizana.vision')}</dd>
            <dt>{t('platforms.khizana.missionLabel')}</dt><dd>{t('platforms.khizana.mission')}</dd>
          </dl>
          <h3>{t('platforms.khizana.goalsLabel')}</h3>
          {list('platforms.khizana.goal', 6)}
          <h3>{t('platforms.khizana.doneLabel')}</h3>
          <p>{t('platforms.khizana.done')}</p>
          <h3>{t('platforms.khizana.nextLabel')}</h3>
          {list('platforms.khizana.next', 4)}
          <SourceNote ctx={ctx} pages="186–187" />
        </section>

        <section id="encyclopedia" className="info-section" aria-labelledby="encyclopedia-h">
          <h2 id="encyclopedia-h">{t('platforms.encyclopedia.title')} <StatusBadge kind="building">{t('status.preparing')}</StatusBadge></h2>
          <p>{t('platforms.encyclopedia.text')}</p>
          <p>{t('platforms.encyclopedia.count', { n: entries })}</p>
          <SourceNote ctx={ctx} pages="18–19" />
          <Link prefetch={false} className="btn btn--secondary btn--sm" href={href('/encyclopedia')}>{t('platforms.open')}<span className="sr-only">: {t('platforms.encyclopedia.title')}</span></Link>
        </section>

        {PLATFORMS.map(({ id, path, status }) => (
          <section key={id} id={id} className="info-section" aria-labelledby={`${id}-h`}>
            <h2 id={`${id}-h`}>{t(`platforms.${id}.title`)} <StatusBadge kind="live">{t(status)}</StatusBadge></h2>
            <p>{t(`platforms.${id}.text`)}</p>
            <Link prefetch={false} className="btn btn--secondary btn--sm" href={href(path)}>{t('platforms.open')}<span className="sr-only">: {t(`platforms.${id}.title`)}</span></Link>
          </section>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
