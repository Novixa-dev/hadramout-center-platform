import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { SourceNote, StatusBadge } from '../../../../components/InfoBits.tsx';

type Props = { params: Promise<{ locale: string }> };

/**
 * «المنصات الرقمية» as the Center listed them (feedback report 2026-10-27; all marked «تحت الإنشاء»). Each section states
 * its real status and, where something already exists, points to it. The Khizana text is the decade book's (pp. 186–187).
 * Section ids are linked from the menu and the utility bar.
 */
const BUILDING: { id: string; next?: { path: string; key: string } }[] = [
  { id: 'cultural' },
  { id: 'members', next: { path: '/saved', key: 'saved.title' } },
  { id: 'store', next: { path: '/contact', key: 'nav.contact' } },
  { id: 'donations', next: { path: '/support', key: 'util.support' } },
  { id: 'volunteering', next: { path: '/contact', key: 'nav.contact' } },
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
          <SourceNote ctx={ctx} pages="18–19" />
        </section>

        {BUILDING.map(({ id, next }) => (
          <section key={id} id={id} className="info-section" aria-labelledby={`${id}-h`}>
            <h2 id={`${id}-h`}>{t(`platforms.${id}.title`)} <StatusBadge kind="building">{t('status.building')}</StatusBadge></h2>
            <p>
              {t(`platforms.${id}.text`)}
              {next ? <> <Link href={href(next.path)}>{t(next.key)}</Link>.</> : null}
            </p>
          </section>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
