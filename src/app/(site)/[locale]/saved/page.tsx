import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { SavedList } from '../../../../components/client/SavedList.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/saved', title: ctx.t('saved.title'), noindex: true });
}

export default async function SavedPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t } = makeCtx(locale);
  return (
    <>
      <div className="page-head"><div className="container"><h1>{t('saved.title')}</h1><p>{t('saved.note')}</p></div></div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-5)' }}>
        <SavedList labels={{ empty: t('saved.empty'), remove: t('saved.remove'), exportRis: t('saved.exportRis') }} />
      </div>
    </>
  );
}
