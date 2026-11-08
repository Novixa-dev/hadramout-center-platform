import Link from 'next/link';
import type { Ctx } from '../lib/ctx.ts';
import { absolute } from '../lib/ctx.ts';
import type { AnnouncementDoc } from '../lib/data.ts';
import { formatDate } from '../lib/dates.ts';
import { googleCalendarUrl } from '../lib/calendar.ts';
import { mediaUrl, safeHref } from '../lib/media-links.ts';
import { sanitizeBody } from '../lib/sanitize.ts';
import { Icon } from './Icon.tsx';

/**
 * One announcement: featured image, type, title, date and place, summary, and «add to Google Calendar» plus an .ics
 * download when it has a date (the Center asked for the Google Calendar option). `compact` is the home-page variant.
 */
export function AnnouncementCard({ ctx, item, host, compact = false }: { ctx: Ctx; item: AnnouncementDoc; host: string; compact?: boolean }) {
  const { t, href, lang } = ctx;
  const cover = mediaUrl(item.cover);
  const link = safeHref(item.link);
  const attachment = mediaUrl(item.attachment) ?? safeHref(item.attachmentUrl);
  const pageUrl = absolute(`/${lang.code}/announcements#announcement-${item.id}`);
  const google = item.eventDate
    ? googleCalendarUrl({ uid: `announcement-${item.id}`, host, title: item.title, start: item.eventDate, location: item.venue ?? undefined, description: item.excerpt ?? undefined, url: pageUrl })
    : null;
  const Heading = compact ? 'h3' : 'h2';
  return (
    <article className={compact ? 'announce-card announce-card--compact' : 'announce-card'} id={compact ? undefined : `announcement-${item.id}`}>
      {cover ? <img className="announce-card__img" src={cover} alt="" loading="lazy" /> : null}
      <div className="announce-card__body">
        <p className="kicker">{t(`announcements.kind.${item.kind ?? 'event'}`)}</p>
        <Heading className="announce-card__title">
          {compact ? <Link href={href(`/announcements#announcement-${item.id}`)}>{item.title}</Link> : item.title}
        </Heading>
        <p className="announce-card__meta">
          {item.eventDate ? <span><Icon name="calendar" /> {formatDate(item.eventDate, lang.tag)}</span> : null}
          {item.venue ? <span><Icon name="pin" /> {item.venue}</span> : null}
        </p>
        {item.excerpt ? <p className="announce-card__excerpt">{item.excerpt}</p> : null}
        {!compact && item.body ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body) }} /> : null}
        {!compact ? (
          <div className="cluster announce-card__actions">
            {google ? (
              <a className="btn btn--primary btn--sm" href={google} target="_blank" rel="noopener noreferrer">
                <Icon name="calendar" /> {t('announcements.google')}
              </a>
            ) : null}
            {item.eventDate ? (
              <a className="btn btn--ghost btn--sm" href={`/api/hc/ics/announcements/${item.id}.ics?lang=${lang.code}`}>
                <Icon name="download" /> {t('announcements.ics')}
              </a>
            ) : null}
            {link ? (
              <a className="btn btn--ghost btn--sm" href={link} {...(link.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                <Icon name="link" /> {t('announcements.details')}
              </a>
            ) : null}
            {attachment ? (
              <a className="btn btn--ghost btn--sm" href={attachment}>
                <Icon name="file" /> {t('announcements.attachment')}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
