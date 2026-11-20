import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite, listAnnouncements } from '../../../../lib/data.ts';
import { announcementEventsJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { mediaUrl } from '../../../../lib/media-links.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { CrumbsJsonLd } from '../../../../components/CrumbsJsonLd.tsx';
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
  const site = await getSite(locale);
  const events = announcementEventsJsonLd(
    items.map((a) => ({ id: a.id, title: a.title, excerpt: a.excerpt, eventDate: a.eventDate, venue: a.venue, image: mediaUrl(a.cover) ? absolute(mediaUrl(a.cover) as string) : null })),
    { pageUrl: absolute(`/${locale}/announcements`), lang: ctx.lang.tag, org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') } },
  );
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('announcements.title') }]} title={t('announcements.title')} lead={t('announcements.lead')} />
      <div className="container section announce-list">
        {items.length ? items.map((a) => <AnnouncementCard key={a.id} ctx={ctx} item={a} host={host} />) : <p className="empty-state">{t('announcements.empty')}</p>}
      </div>
      <CrumbsJsonLd ctx={ctx} name={t('announcements.title')} path="/announcements" />
      {events ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(events) }} /> : null}
    </>
  );
}
