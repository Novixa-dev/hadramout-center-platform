import { notFound } from 'next/navigation';
import { makeCtx } from '../lib/ctx.ts';
import { getPage, trInfo, type Doc } from '../lib/data.ts';
import { appConfig } from '../lib/runtime-light.ts';
import { TrBanner } from './client/TrBanner.tsx';

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
      <div className="page-head">
        <div className="container"><h1 lang={tr.titleLang === 'ar' && locale !== 'ar' ? 'ar' : undefined}>{page.title}</h1></div>
      </div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        <div className="prose" lang={tr.bodyLang === 'ar' ? 'ar' : locale} dir={tr.bodyLang === 'ar' ? 'rtl' : ctx.lang.dir} dangerouslySetInnerHTML={{ __html: page.body ?? '' }} />
      </div>
    </>
  );
}
