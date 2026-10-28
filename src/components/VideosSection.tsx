import Image from 'next/image';
import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { coverOf, docHref, displayDate } from '../lib/ctx.ts';
import type { Doc } from '../lib/data.ts';
import { trInfo } from '../lib/data.ts';
import { Icon } from './Icon.tsx';
import { textAttrs } from './Cards.tsx';
import { VideoPlayerModal } from './client/VideoPlayerModal.tsx';

interface VideosSectionProps {
  ctx: Ctx;
  videos: Doc[];
}

export function VideosSection({ ctx, videos }: VideosSectionProps) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  if (!videos.length) return null;

  const isDuo = videos.length === 2;

  return (
    <section className="videos-section cv" aria-labelledby="videos-section-title" data-aos="fade-up">
      <div className="container videos-section__container">
        {/* ── Section Header ────────────────────────────────────────── */}
        <div className="videos-section__header">
          <div className="videos-section__title-group">
            <h2 id="videos-section-title" className="videos-section__title">
              {isAr ? 'المرئيات' : 'Videos'}
            </h2>
            <span className="videos-section__underline" aria-hidden="true" />
          </div>

          <Link href={href('/videos')} className="videos-section__more">
            <span>{isAr ? 'عرض الكل' : 'View all'}</span>
            <Icon name="arrow" className="videos-section__arrow" />
          </Link>
        </div>

        {/* ── Video Gallery Grid ────────────────────────────────────── */}
        <div className={`videos-section__grid ${isDuo ? 'videos-section__grid--duo' : ''}`}>
          {videos.map((doc) => {
            const tr = trInfo(doc, lang.code);
            const poster = doc.youtubeId
              ? `https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg`
              : null;
            const c = coverOf(doc);
            const src = c?.src ?? poster;
            const videoUrl = docHref(ctx, 'video', doc.id);
            const dateStr = displayDate(doc, lang.code);
            const guest = (doc.guest as string | undefined) || null;
            const duration = (doc.duration as string | undefined) || null;

            return (
              <article key={doc.id} className="video-card-v2">
                <div className="video-card-v2__thumb-wrapper">
                  {src ? (
                    <Image
                      src={src}
                      alt={doc.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
                      className="video-card-v2__img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="video-card-v2__fallback" aria-hidden="true">
                      <span className="video-card-v2__fallback-pattern" />
                      <Icon name="rosette" className="video-card-v2__fallback-rosette" />
                      <span className="video-card-v2__fallback-badge">
                        {isAr ? 'مركز حضرموت للتوثيق والنشر' : 'Hadramout Center Platform'}
                      </span>
                    </div>
                  )}

                  <div className="video-card-v2__scrim" aria-hidden="true" />

                  {/* Accessible circular green play button with direct playback */}
                  <VideoPlayerModal
                    youtubeId={doc.youtubeId as string | undefined}
                    videoUrl={videoUrl}
                    title={doc.title}
                    label={isAr ? 'تشغيل الفيديو' : 'Play video'}
                    closeLabel={isAr ? 'إغلاق' : 'Close'}
                  />

                  {duration ? (
                    <span className="video-card-v2__duration">{duration}</span>
                  ) : null}
                </div>

                <div className="video-card-v2__content">
                  <h3 className="video-card-v2__title" {...textAttrs(tr.titleLang, lang.code)}>
                    <Link href={videoUrl} className="video-card-v2__title-link">
                      {doc.title}
                    </Link>
                  </h3>

                  {guest || dateStr ? (
                    <div className="video-card-v2__meta">
                      {guest ? (
                        <span className="video-card-v2__guest">
                          <Icon name="user" className="video-card-v2__meta-icon" />
                          <span>{guest}</span>
                        </span>
                      ) : null}
                      {dateStr ? (
                        <span className="video-card-v2__date">
                          <Icon name="calendar" className="video-card-v2__meta-icon" />
                          <time dateTime={doc.publishedAt || undefined}>{dateStr}</time>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
