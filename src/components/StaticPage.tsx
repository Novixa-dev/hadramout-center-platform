import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { absolute, makeCtx, type Ctx } from '../lib/ctx.ts';
import { getPage, listChildPages, trInfo, type Doc } from '../lib/data.ts';
import { appConfig } from '../lib/runtime-light.ts';
import { breadcrumbJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { buildMetadata } from '../lib/seo.ts';
import { describe } from '../lib/seo-text.ts';
import { htmlToText } from '../lib/sanitize.ts';
import { PageHead } from './PageHead.tsx';
import { TrBanner } from './client/TrBanner.tsx';
import { Icon } from './Icon.tsx';
import { isProductionSite } from '../lib/site-env.ts';
import { PageBlocks } from './blocks/PageBlocks.tsx';
import { staffUser } from '../lib/staff.ts';

/** Pages whose wording the Center has not approved yet. In the preview they say so; the notice disappears with SITE_ENV=production, so approval is a launch checklist item. */
const PENDING_APPROVAL = new Set(['about', 'privacy', 'terms']);

export function readyLangsOf(doc: Pick<Doc, 'translationMeta' | 'body'>): string[] {
  const langs = ['ar'];
  for (const [l, m] of Object.entries(doc.translationMeta ?? {})) if (m && (m as Record<string, unknown>).title && (!doc.body || (m as Record<string, unknown>).body)) langs.push(l);
  return langs;
}

/** Metadata of an editor's page at /{slug} (also /{section}/{slug}); empty for a page that does not exist. */
export async function pageMetadata(ctx: Ctx, slug: string): Promise<Metadata> {
  const locale = ctx.lang.code;
  const page = await getPage(slug, locale);
  if (!page) return {};
  const title = page.metaTitle || page.title;
  const description = page.metaDescription || describe(htmlToText(page.body ?? ''));
  const ogImg = typeof page.ogImage === 'object' && page.ogImage && 'url' in page.ogImage && page.ogImage.url ? page.ogImage : null;
  const heroImg = !ogImg && typeof page.heroImage === 'object' && page.heroImage && 'url' in page.heroImage && page.heroImage.url ? page.heroImage : null;
  const chosen = ogImg || heroImg;
  return buildMetadata({
    ctx,
    path: `/${slug}`,
    title,
    description,
    card: { kind: 'pages', id: page.id },
    image: chosen?.url ? absolute(chosen.url) : null,
    imageWidth: chosen?.width,
    imageHeight: chosen?.height,
    imageType: chosen?.mimeType ?? undefined,
    readyLangs: readyLangsOf(page as never),
    incomplete: locale !== 'ar' && trInfo(page as never, locale).status !== 'complete',
    noindex: Boolean(page.noindex),
  });
}

/** CMS-managed page (about, privacy, terms, accessibility…) with translation banner and page blocks. */
export async function StaticPage({ locale, slug, preview = false }: { locale: string; slug: string; preview?: boolean }) {
  // ?preview=1 shows drafts to signed-in staff only; for anyone else it is the normal published page
  const draft = preview && (await staffUser(await headers())) !== null;
  const page = await getPage(slug, locale, { draft });
  if (!page) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const tr = trInfo(page as never, locale);
  const cfg = appConfig();
  // a page filed under a section (about/identity) gets the section in its breadcrumbs; a section page lists its pages
  const parentSlug = slug.includes('/') ? slug.slice(0, slug.indexOf('/')) : null;
  const [parent, children] = await Promise.all([parentSlug ? getPage(parentSlug, locale) : null, parentSlug ? [] : listChildPages(slug, locale)]);
  const ld = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${locale}`) },
    ...(parent ? [{ name: parent.title, url: absolute(`/${locale}/${parentSlug}`) }] : []),
    { name: page.title, url: absolute(`/${locale}/${slug}`) },
  ]);
  const hasBlocks = Boolean(page.blocks && page.blocks.length > 0);
  const pageWithExtras = page as unknown as { showBreadcrumbs?: boolean | null; lead?: string | null; badge?: string | null };
  const showBreadcrumbs = pageWithExtras.showBreadcrumbs !== false;
  const crumbs = showBreadcrumbs ? [...(parent ? [{ name: parent.title, path: `/${parentSlug}` }] : []), { name: page.title }] : [];

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
      <PageHead
        ctx={ctx}
        crumbs={crumbs}
        title={page.title}
        lead={pageWithExtras.lead || undefined}
        badge={pageWithExtras.badge ? <span className="badge badge--gold">{pageWithExtras.badge}</span> : undefined}
        titleAttrs={tr.titleLang === 'ar' && locale !== 'ar' ? { lang: 'ar', dir: 'rtl' } : undefined}
      />
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
      {children.length ? (
        <nav className="container--narrow section section--tight" aria-labelledby="in-section-h">
          <h2 id="in-section-h" className="section-title">{t('page.inSection')}</h2>
          <ul className="child-pages">
            {children.map((c) => (
              <li key={c.slug}>
                <Link href={href(`/${c.slug}`)}>
                  <strong>{c.title}</strong>
                  {c.lead ? <span>{c.lead}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
