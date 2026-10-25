import Link from 'next/link';
import Image from 'next/image';
import type { Ctx } from '../lib/ctx.ts';
import type { Doc } from '../lib/data.ts';
import { trInfo } from '../lib/data.ts';
import { coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { dayOf, monthShort } from '../lib/dates.ts';
import { stripReferenceLine } from '../lib/seo-text.ts';
import { Icon, type IconName } from './Icon.tsx';
import { textAttrs } from './Cards.tsx';

export function EditorialSectionHead({
  title,
  href,
  more,
  icon,
}: {
  title: string;
  href?: string;
  more?: string;
  icon?: IconName;
}) {
  return (
    <div className="editorial-head">
      <div className="editorial-head__title-group">
        {icon ? (
          <span className="editorial-head__icon" aria-hidden="true">
            <Icon name={icon} />
          </span>
        ) : null}
        <h2 className="editorial-head__title">{title}</h2>
      </div>
      {href && more ? (
        <Link href={href} className="editorial-head__more">
          <span>{more}</span>
          <Icon name="arrow" className="editorial-head__arrow" />
        </Link>
      ) : null}
    </div>
  );
}

export function FeaturedNewsCard({
  ctx,
  doc,
  eager = false,
}: {
  ctx: Ctx;
  doc: Doc;
  eager?: boolean;
}) {
  const { lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const date = displayDate(doc, lang.code);
  const cover = coverOf(doc);
  const excerpt = stripReferenceLine(doc.excerpt);
  const cat = doc.category && typeof doc.category === 'object' ? doc.category.name : ctx.t('card.type.news');
  const link = docHref(ctx, 'news', doc.id);

  return (
    <article className="editorial-featured">
      <div className="editorial-featured__media">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(max-width: 992px) 100vw, 750px"
            priority={eager}
            className="editorial-featured__img"
          />
        ) : (
          <div className="editorial-placeholder-cover" aria-hidden="true">
            {doc.title}
          </div>
        )}
        <span className="editorial-featured__badge">{cat}</span>
      </div>
      <div className="editorial-featured__body">
        <div className="editorial-meta-row">
          {date ? (
            <time dateTime={doc.publishedAt ?? undefined} className="editorial-meta-date">
              <Icon name="calendar" className="editorial-meta-icon" />
              <span>{date}</span>
            </time>
          ) : null}
        </div>
        <h3 className="editorial-featured__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={link}>{doc.title}</Link>
        </h3>
        {excerpt ? (
          <p className="editorial-featured__excerpt" {...textAttrs(tr.excerptLang, lang.code)}>
            {excerpt}
          </p>
        ) : null}
        <div className="editorial-featured__footer">
          <Link href={link} className="editorial-read-more">
            <span>{lang.code === 'ar' ? 'اقرأ المزيد' : 'Read more'}</span>
            <Icon name="arrow" className="editorial-arrow" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SupportingNewsCard({ ctx, doc }: { ctx: Ctx; doc: Doc }) {
  const { lang } = ctx;
  const tr = trInfo(doc, lang.code);
  const date = displayDate(doc, lang.code);
  const cover = coverOf(doc);
  const cat = doc.category && typeof doc.category === 'object' ? doc.category.name : ctx.t('card.type.news');
  const link = docHref(ctx, 'news', doc.id);

  return (
    <article className="editorial-row">
      <div className="editorial-row__media">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(max-width: 600px) 105px, 135px"
            className="editorial-row__img"
          />
        ) : (
          <div className="editorial-placeholder-thumb" aria-hidden="true" />
        )}
      </div>
      <div className="editorial-row__body">
        <div className="editorial-meta-row">
          <span className="editorial-row__badge">{cat}</span>
          {date ? (
            <time dateTime={doc.publishedAt ?? undefined} className="editorial-meta-date">
              <Icon name="calendar" className="editorial-meta-icon" />
              <span>{date}</span>
            </time>
          ) : null}
        </div>
        <h4 className="editorial-row__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={link}>{doc.title}</Link>
        </h4>
      </div>
    </article>
  );
}

export function DateBadge({
  iso,
  lang,
  past,
}: {
  iso?: string;
  lang: string;
  past?: boolean;
}) {
  if (!iso) return null;
  const day = dayOf(iso);
  const month = monthShort(iso, lang);
  return (
    <div className={`editorial-date-badge ${past ? 'editorial-date-badge--past' : ''}`} aria-hidden="true">
      <strong className="editorial-date-badge__day">{day}</strong>
      <span className="editorial-date-badge__month">{month}</span>
    </div>
  );
}

export function EventCard({
  ctx,
  doc,
  type = 'event',
}: {
  ctx: Ctx;
  doc: Doc;
  type?: 'event' | 'forum';
}) {
  const { lang, t } = ctx;
  const tr = trInfo(doc, lang.code);
  const d = (doc.eventDate as string | undefined) ?? doc.publishedAt ?? undefined;
  const today = new Date().toISOString().slice(0, 10);
  const past = d ? d.slice(0, 10) < today : true;
  const link = docHref(ctx, type, doc.id);
  const speaker = doc.speaker ? String(doc.speaker) : null;
  const venue = doc.venue ? String(doc.venue) : null;
  const timeText = doc.timeText ? String(doc.timeText) : null;
  const fullDate = d ? displayDate({ publishedAt: d, datePrecision: 'day' }, lang.code) : null;

  return (
    <article className={`editorial-event-card ${past ? 'editorial-event-card--past' : ''}`}>
      <DateBadge iso={d} lang={lang.code} past={past} />
      <div className="editorial-event-card__body">
        <h4 className="editorial-event-card__title" {...textAttrs(tr.titleLang, lang.code)}>
          <Link href={link}>{doc.title}</Link>
        </h4>
        <div className="editorial-event-card__meta">
          {speaker ? (
            <span className="editorial-event-card__meta-item">
              <Icon name="user" className="editorial-event-card__meta-icon" />
              <span>{t('meta.speaker')}: {speaker}</span>
            </span>
          ) : null}
          {venue ? (
            <span className="editorial-event-card__meta-item">
              <Icon name="pin" className="editorial-event-card__meta-icon" />
              <span>{venue}</span>
            </span>
          ) : null}
          {timeText ? (
            <span className="editorial-event-card__meta-item">
              <Icon name="clock" className="editorial-event-card__meta-icon" />
              <span>{timeText}</span>
            </span>
          ) : null}
          {fullDate ? (
            <span className="editorial-event-card__meta-item">
              <Icon name="calendar" className="editorial-event-card__meta-icon" />
              <time dateTime={d?.slice(0, 10)}>{fullDate}</time>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HomeEditorial({
  ctx,
  news,
  events,
  forum,
  upcoming,
}: {
  ctx: Ctx;
  news: Doc[];
  events: Doc[];
  forum: Doc[];
  upcoming: Doc[];
}) {
  const { t, href } = ctx;
  const leadNews = news[0];
  const supportingNews = news.slice(1);
  const eventsList = events.slice(0, 3);
  const forumList = forum.slice(0, 3);

  return (
    <section className="editorial-section" aria-label={t('home.latestNews')}>
      <div className="container">
        <div className="editorial-grid">
          {/* Column 1: Latest News */}
          <div className="editorial-col-news">
            <EditorialSectionHead
              title={t('home.latestNews')}
              href={href('/news')}
              more={t('home.news.more')}
              icon="file"
            />
            {leadNews ? (
              <div className="editorial-news-stack">
                <FeaturedNewsCard ctx={ctx} doc={leadNews} eager />
                {supportingNews.length ? (
                  <div className="editorial-supporting-list">
                    {supportingNews.map((doc) => (
                      <SupportingNewsCard key={doc.id} ctx={ctx} doc={doc} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Column 2: Latest Events & Cultural Forum */}
          <div className="editorial-col-events">
            {eventsList.length ? (
              <div className="editorial-events-block">
                <EditorialSectionHead
                  title={upcoming.length ? t('home.upcoming') : t('home.events')}
                  href={href('/events')}
                  more={t('section.viewAll')}
                  icon="calendar"
                />
                <div className="editorial-events-list">
                  {eventsList.map((doc) => (
                    <EventCard key={doc.id} ctx={ctx} doc={doc} type="event" />
                  ))}
                </div>
              </div>
            ) : null}

            {forumList.length ? (
              <div className="editorial-forum-block">
                <EditorialSectionHead
                  title={t('home.forum')}
                  href={href('/forum')}
                  more={t('section.viewAll')}
                  icon="rosette"
                />
                <div className="editorial-events-list">
                  {forumList.map((doc) => (
                    <EventCard key={doc.id} ctx={ctx} doc={doc} type="forum" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
