import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listPartners } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { mediaUrl, safeHref } from '../../../../lib/media-links.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Icon } from '../../../../components/Icon.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/partners', title: ctx.t('partners.title'), description: ctx.t('partners.lead'), card: { key: 'partners' } });
}

/** «شركاء النجاح»: institutions that partnered with, collaborated with or supported the Center (logos only with consent). */
export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const partners = await listPartners(locale);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('partners.title') }]} title={t('partners.title')} lead={t('partners.lead')} />
      <div className="container section">
        {partners.length ? (
          <ul className="partner-grid">
            {partners.map((p) => {
              const logo = mediaUrl(p.logo);
              const site = safeHref(p.website);
              return (
                <li key={p.id} className="partner-card">
                  {logo ? <img className="partner-card__logo" src={logo} alt="" loading="lazy" /> : <span className="partner-card__mark" aria-hidden="true"><Icon name="globe" /></span>}
                  <h2 className="partner-card__name">{p.name}</h2>
                  {p.category ? <p className="kicker">{t(`partners.category.${p.category}`)}</p> : null}
                  {p.summary ? <p className="partner-card__summary">{p.summary}</p> : null}
                  {site ? (
                    <a className="partner-card__link" href={site} target="_blank" rel="noopener noreferrer">
                      <Icon name="external" /> {t('partners.visit')}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">{t('partners.empty')}</p>
        )}
        {partners.length ? <p className="source-note">{t('partners.source')}</p> : null}
      </div>
    </>
  );
}
