import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { listAudio } from '../../../../lib/data.ts';
import { latest } from '../../../../lib/facets.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { AudioItem } from '../../../../components/AudioItem.tsx';
import { EventRow, SectionHead, VideoTile } from '../../../../components/Cards.tsx';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/culture', title: ctx.t('culture.title'), description: ctx.t('culture.lead'), card: { key: 'culture' } });
}

/** Where each door of the platform leads: all of it already exists on the site. */
const DOORS: { path: string; title: string; text: string }[] = [
  { path: '/forum', title: 'culture.door.forum', text: 'culture.door.forumText' },
  { path: '/podcast', title: 'culture.door.podcast', text: 'culture.door.podcastText' },
  { path: '/audio', title: 'culture.door.audio', text: 'culture.door.audioText' },
  { path: '/videos', title: 'culture.door.videos', text: 'culture.door.videosText' },
  { path: '/about/media-work', title: 'culture.door.programmes', text: 'culture.door.programmesText' },
  { path: '/timeline', title: 'culture.door.timeline', text: 'culture.door.timelineText' },
];

/** «منصة حضرموت الثقافية»: the cultural activity of the Center in one place, drawn live from the archive. Nothing here is written for it. */
export default async function CulturePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const [forum, videos, audio] = await Promise.all([latest('forum', locale, 4), latest('video', locale, 3), listAudio(locale)]);
  const crumbs = breadcrumbJsonLd([
    { name: t('nav.home'), url: absolute(`/${lang.code}`) },
    { name: t('culture.title'), url: absolute(`/${lang.code}/culture`) },
  ]);
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('culture.title') }]} title={t('culture.title')} lead={t('culture.lead')} />
      <div className="container section stack culture">
        <nav aria-label={t('culture.doors')} className="grid grid--wide">
          {DOORS.map((d) => (
            <Link prefetch={false} key={d.path} href={href(d.path)} className="info-section culture__door">
              <strong>{t(d.title)}</strong>
              <span>{t(d.text)}</span>
            </Link>
          ))}
        </nav>
        {forum.length ? (
          <section aria-labelledby="c-forum">
            <SectionHead id="c-forum" title={t('culture.latestForum')} href={href('/forum')} more={t('culture.more')} />
            <div className="event-list">{forum.map((d) => <EventRow key={d.id} ctx={ctx} doc={d} type="forum" />)}</div>
          </section>
        ) : null}
        {videos.length ? (
          <section aria-labelledby="c-videos">
            <SectionHead id="c-videos" title={t('culture.latestVideos')} href={href('/videos')} more={t('culture.more')} />
            <div className="grid grid--wide">{videos.map((d) => <VideoTile key={d.id} ctx={ctx} doc={d} />)}</div>
          </section>
        ) : null}
        {audio.length ? (
          <section aria-labelledby="c-audio" className="media-list">
            <SectionHead id="c-audio" title={t('culture.latestAudio')} href={href('/audio')} more={t('culture.more')} />
            {audio.slice(0, 3).map((item) => <AudioItem key={item.id} ctx={ctx} item={item} />)}
          </section>
        ) : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbs) }} />
    </>
  );
}
