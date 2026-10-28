import { notFound } from 'next/navigation';
import { absolute, makeCtx } from '../lib/ctx.ts';
import { getPage, trInfo, type Doc } from '../lib/data.ts';
import { appConfig } from '../lib/runtime-light.ts';
import { breadcrumbJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { PageHead } from './PageHead.tsx';
import { TrBanner } from './client/TrBanner.tsx';
import { Icon } from './Icon.tsx';
import { isProductionSite } from '../lib/site-env.ts';
import { AboutView } from './AboutView.tsx';

/** Pages whose wording the Center has not approved yet. In the preview they say so; the notice disappears with SITE_ENV=production, so approval is a launch checklist item. */
const PENDING_APPROVAL = new Set(['about', 'privacy', 'terms']);

export function readyLangsOf(doc: Pick<Doc, 'translationMeta' | 'body'>): string[] {
  const langs = ['ar'];
  for (const [l, m] of Object.entries(doc.translationMeta ?? {})) if (m && (m as Record<string, unknown>).title && (!doc.body || (m as Record<string, unknown>).body)) langs.push(l);
  return langs;
}

/** CMS-managed page (about, privacy, terms, accessibility…) with translation banner. */
export async function StaticPage({ locale, slug }: { locale: string; slug: string }) {
  const page = await getPage(slug, locale);
  if (!page) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const tr = trInfo(page as never, locale);
  const cfg = appConfig();
  const ld = breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${locale}`) }, { name: page.title, url: absolute(`/${locale}/${slug}`) }]);
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
          providerEnabled={cfg.translation.provider !== 'none'}
          originalHref={href(`/${slug}`, 'ar')}
          reportHref={`${href('/contact')}?kind=translation_issue&page=${encodeURIComponent(`/${locale}/${slug}`)}`}
          labels={{ machine: t('tr.machine'), reviewed: t('tr.reviewed'), pending: t('tr.pending'), unavailable: t('tr.unavailable'), failed: t('tr.failed'), ready: t('tr.ready'), viewOriginal: t('tr.viewOriginal'), report: t('tr.report') }}
        />
      ) : null}
      <PageHead ctx={ctx} crumbs={[{ name: page.title }]} title={page.title} titleAttrs={tr.titleLang === 'ar' && locale !== 'ar' ? { lang: 'ar', dir: 'rtl' } : undefined} />
      {slug === 'about' ? (
        <AboutView ctx={ctx} page={page} pendingApproval={!isProductionSite() && PENDING_APPROVAL.has(slug)} />
      ) : (
        <div className="container--narrow section" data-aos="fade-up" style={{ paddingBlockStart: 'var(--space-6)' }}>
          {!isProductionSite() && PENDING_APPROVAL.has(slug) ? (
            <p className="notice notice--warn" role="note" data-review-notice style={{ marginBlockEnd: 'var(--space-5)' }}>
              <Icon name="info" /> {t('review.pendingApproval')}
            </p>
          ) : null}
          <div className="prose" lang={tr.bodyLang === 'ar' ? 'ar' : locale} dir={tr.bodyLang === 'ar' ? 'rtl' : ctx.lang.dir} dangerouslySetInnerHTML={{ __html: page.body ?? '' }} />
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
