import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { volunteerLabels } from '../../../../lib/platform-labels.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { VolunteerForm } from '../../../../components/client/PlatformForms.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/volunteer', title: ctx.t('volunteer.title'), description: ctx.t('volunteer.lead'), card: { key: 'volunteer' } });
}

/** «بوابة التطوع»: an application that waits in the admin for the Center's staff; applying promises no placement. */
export default async function VolunteerPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('volunteer.title'), url: absolute(`/${lang.code}/volunteer`) },
  ]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('volunteer.title') }]} title={t('volunteer.title')} lead={t('volunteer.lead')} />
      <div className="container container--narrow section info-page">
        <section className="info-section" aria-labelledby="apply-h">
          <h2 id="apply-h">{t('volunteer.formTitle')}</h2>
          <VolunteerForm lang={lang.code} labels={volunteerLabels(ctx)} privacyHref={href('/privacy')} />
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
