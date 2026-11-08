import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';
import { SourceNote, StatusBadge } from '../../../../components/InfoBits.tsx';

type Props = { params: Promise<{ locale: string }> };

/**
 * «المساهمة البحثية»: the five headings the Center listed (feedback report 2026-10-27). The Center has not issued its
 * publishing standards, ethics or AI policy yet, so those sections say so instead of inventing rules; the review
 * section quotes the Center's own description of its scientific committees (decade book, p. 15).
 */
const PENDING = ['standards', 'ethics', 'ai'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/submit', title: ctx.t('submit.title'), description: ctx.t('submit.lead'), card: { key: 'submit' } });
}

export default async function SubmitPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const site = await getSite(locale);
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('submit.title'), url: absolute(`/${lang.code}/submit`) },
  ]);

  const channel = (
    <p>
      {t('submit.channel')}{' '}
      <Link href={href('/contact')}>{t('nav.contact')}</Link>
      {site.email ? (
        <>
          {' '}{t('submit.orEmail')}{' '}
          <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
        </>
      ) : null}
      .
    </p>
  );

  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('submit.title') }]} title={t('submit.title')} lead={t('submit.lead')} />
      <div className="container container--narrow section info-page">
        <nav className="info-toc" aria-label={t('submit.toc')}>
          <ul>
            {[...PENDING, 'review', 'send', 'magazine'].map((id) => (
              <li key={id}><a href={`#${id}`}>{t(`submit.${id}.title`)}</a></li>
            ))}
          </ul>
        </nav>

        {PENDING.map((id) => (
          <section key={id} id={id} className="info-section" aria-labelledby={`${id}-h`}>
            <h2 id={`${id}-h`}>{t(`submit.${id}.title`)} <StatusBadge kind="pending">{t('status.pending')}</StatusBadge></h2>
            <p>{t('submit.pendingText')}</p>
          </section>
        ))}

        <section id="review" className="info-section" aria-labelledby="review-h">
          <h2 id="review-h">{t('submit.review.title')}</h2>
          <blockquote className="info-quote">
            <p>{t('submit.review.quote')}</p>
          </blockquote>
          <SourceNote ctx={ctx} pages="15" />
        </section>

        <section id="send" className="info-section info-section--action" aria-labelledby="send-h">
          <h2 id="send-h"><Icon name="edit" /> {t('submit.send.title')}</h2>
          <p>{t('submit.send.text')}</p>
          {channel}
        </section>

        <section id="magazine" className="info-section info-section--action" aria-labelledby="magazine-h">
          <h2 id="magazine-h"><Icon name="book" /> {t('submit.magazine.title')}</h2>
          <p>
            {t('submit.magazine.text')} <Link href={href('/magazines')}>{t('nav.magazines')}</Link>.
          </p>
          {channel}
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
