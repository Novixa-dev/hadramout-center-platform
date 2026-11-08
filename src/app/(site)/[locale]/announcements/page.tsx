import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAnnouncements } from '../../../../lib/data.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { AnnouncementCard } from '../../../../components/AnnouncementCard.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/announcements', title: ctx.t('announcements.title'), description: ctx.t('announcements.lead'), card: { key: 'announcements' } });
}

/** Current announcements (expired ones drop off by themselves), soonest first, each with calendar links. */
export default async function AnnouncementsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t } = ctx;
  const items = await listAnnouncements(locale);
  const host = new URL(absolute('')).host;
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('announcements.title') }]} title={t('announcements.title')} lead={t('announcements.lead')} />
      <div className="container section announce-list">
        {items.length ? items.map((a) => <AnnouncementCard key={a.id} ctx={ctx} item={a} host={host} />) : <p className="empty-state">{t('announcements.empty')}</p>}
      </div>
    </>
  );
}
