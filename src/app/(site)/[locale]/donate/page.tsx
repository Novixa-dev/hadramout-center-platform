import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { pledgeLabels, receiptLabels } from '../../../../lib/platform-labels.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Icon } from '../../../../components/Icon.tsx';
import { PledgeForm, ReceiptForm } from '../../../../components/client/PlatformForms.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/donate', title: ctx.t('donate.title'), description: ctx.t('donate.lead'), card: { key: 'donate' } });
}

/**
 * «منصة التبرعات»: records a donor's intention for staff to follow up. The site moves no money; transfer details and a payment link
 * appear only once the Center enters them in the site settings, so no account number here is ever a placeholder.
 */
export default async function DonatePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const site = await getSite(locale);
  const donation = (site as unknown as { donation?: { instructions?: string | null; paymentUrl?: string | null } | null }).donation;
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('donate.title'), url: absolute(`/${lang.code}/donate`) },
  ]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('donate.title') }]} title={t('donate.title')} lead={t('donate.lead')} />
      <div className="container container--narrow section info-page">
        <p className="notice notice--info">{t('donate.noPayment')}</p>
        {donation?.instructions || donation?.paymentUrl ? (
          <section className="info-section" aria-labelledby="ways-h">
            <h2 id="ways-h">{t('donate.ways')}</h2>
            {donation.instructions ? <p className="preline">{donation.instructions}</p> : null}
            {donation.paymentUrl ? (
              <a className="btn btn--gold" href={donation.paymentUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="external" /> {t('donate.payOnline')}<span className="sr-only"> ({t('a11y.newWindow')})</span>
              </a>
            ) : null}
          </section>
        ) : null}
        <section className="info-section" aria-labelledby="pledge-h">
          <h2 id="pledge-h">{t('donate.formTitle')}</h2>
          <PledgeForm lang={lang.code} labels={pledgeLabels(ctx)} privacyHref={href('/privacy')} />
        </section>
        <section id="receipt" className="info-section" aria-labelledby="receipt-h">
          <h2 id="receipt-h">{t('receipt.title')}</h2>
          <p>{t('receipt.leadDonate')}</p>
          <ReceiptForm lang={lang.code} labels={receiptLabels(ctx)} />
        </section>
        <p><Link prefetch={false} href={href('/support')}>{t('donate.aboutSupport')}</Link></p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
