import { notFound } from 'next/navigation';
import { absolute, makeCtx } from '../lib/ctx.ts';
import { getPage, trInfo, listApprovedPartners, listApprovedTestimonials, type Doc } from '../lib/data.ts';
import { appConfig } from '../lib/runtime-light.ts';
import { breadcrumbJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { PageHead } from './PageHead.tsx';
import { TrBanner } from './client/TrBanner.tsx';
import { Icon } from './Icon.tsx';
import { isProductionSite } from '../lib/site-env.ts';
import { PageBlocks } from './blocks/PageBlocks.tsx';
import { PartnersSection } from './PartnersSection.tsx';

/** Pages whose wording the Center has not approved yet. In the preview they say so; the notice disappears with SITE_ENV=production, so approval is a launch checklist item. */
const PENDING_APPROVAL = new Set(['about', 'privacy', 'terms']);

export function readyLangsOf(doc: Pick<Doc, 'translationMeta' | 'body'>): string[] {
  const langs = ['ar'];
  for (const [l, m] of Object.entries(doc.translationMeta ?? {})) if (m && (m as Record<string, unknown>).title && (!doc.body || (m as Record<string, unknown>).body)) langs.push(l);
  return langs;
}

/** CMS-managed page (about, privacy, terms, accessibility…) with translation banner and page blocks. */
export async function StaticPage({ locale, slug, preview = false }: { locale: string; slug: string; preview?: boolean }) {
  const page = await getPage(slug, locale, { draft: preview });
  if (!page) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const tr = trInfo(page as never, locale);
  const cfg = appConfig();
  const ld = breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${locale}`) }, { name: page.title, url: absolute(`/${locale}/${slug}`) }]);
  const hasBlocks = Boolean(page.blocks && page.blocks.length > 0);
  const isAboutPage = slug === 'about';
  const [partners, testimonials] = isAboutPage
    ? await Promise.all([listApprovedPartners(locale), listApprovedTestimonials(locale)])
    : [[], []];

  return (
    <>
      {locale !== 'ar' ? (
        <TrBanner
          lang={locale}
          slug="pages"
          id={page.id}
          needsTranslation={tr.status !== 'complete'}
          machine={tr.machine}
          reviewed={tr.reviewed}
          stale={tr.stale}
          providerEnabled={cfg.translation.provider !== 'none'}
          originalHref={href(`/${slug}`, 'ar')}
          reportHref={`${href('/contact')}?kind=translation_issue&page=${encodeURIComponent(`/${locale}/${slug}`)}`}
          labels={{ machine: t('tr.machine'), reviewed: t('tr.reviewed'), pending: t('tr.pending'), unavailable: t('tr.unavailable'), failed: t('tr.failed'), ready: t('tr.ready'), viewOriginal: t('tr.viewOriginal'), report: t('tr.report'), stale: t('tr.stale') }}
        />
      ) : null}
      <PageHead ctx={ctx} crumbs={[{ name: page.title }]} title={page.title} titleAttrs={tr.titleLang === 'ar' && locale !== 'ar' ? { lang: 'ar', dir: 'rtl' } : undefined} />
      {!isProductionSite() && PENDING_APPROVAL.has(slug) ? (
        <div className="container--narrow" style={{ paddingBlockStart: 'var(--space-4)' }}>
          <p className="notice notice--warn" role="note" data-review-notice style={{ margin: 0 }}>
            <Icon name="info" /> {t('review.pendingApproval')}
          </p>
        </div>
      ) : null}
      {hasBlocks ? (
        <PageBlocks blocks={page.blocks} locale={locale} />
      ) : (
        <div className="container--narrow section" style={{ paddingBlockStart: 'var(--space-6)' }}>
          <div className="prose" lang={tr.bodyLang === 'ar' ? 'ar' : locale} dir={tr.bodyLang === 'ar' ? 'rtl' : ctx.lang.dir} dangerouslySetInnerHTML={{ __html: page.body ?? '' }} />
        </div>
      )}
      {isAboutPage && (partners.length > 0 || testimonials.length > 0) ? (
        <div className="container section">
          <PartnersSection
            partners={partners}
            testimonials={testimonials}
            labels={{
              partnersTitle: t('partners.title'),
              testimonialsTitle: t('testimonials.title'),
              visitPartner: t('partners.visit'),
            }}
          />
        </div>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
