import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { SavedList } from '../../../../components/client/SavedList.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/saved', title: ctx.t('saved.title'), description: ctx.t('saved.note'), card: { key: 'saved' }, noindex: true });
}

export default async function SavedPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('saved.title') }]} title={t('saved.title')} lead={t('saved.note')} />
      <div className="container--narrow section" style={{ paddingBlockStart: 'var(--space-5)' }}>
        <SavedList labels={{ empty: t('saved.empty'), remove: t('saved.remove'), exportRis: t('saved.exportRis'), local: t('saved.local'), types: { article: t('card.type.article'), news: t('card.type.news'), book: t('card.type.book'), magazine: t('card.type.magazine') } }} />
      </div>
    </>
  );
}
