import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAudio } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { AudioItem } from '../../../../components/AudioItem.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/audio', title: ctx.t('audio.title'), description: ctx.t('audio.lead'), card: { key: 'audio' } });
}

/** «المكتبة السمعية»: every published recording; Saqaya episodes are here too and on their own page. */
export default async function AudioPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const items = await listAudio(locale);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('audio.title') }]} title={t('audio.title')} lead={t('audio.lead')} />
      <div className="container section media-list">
        <p className="media-list__aside">
          <Link href={href('/podcast')}>{t('nav.podcast')}</Link> · <Link href={href('/videos')}>{t('nav.videos')}</Link>
        </p>
        {items.length ? items.map((item) => <AudioItem key={item.id} ctx={ctx} item={item} />) : <p className="empty-state">{t('audio.empty')}</p>}
      </div>
    </>
  );
}
