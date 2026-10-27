import Link from 'next/link';
import Image from 'next/image';
import type { Ctx } from '../lib/ctx.ts';
import type { Doc } from '../lib/data.ts';
import { trInfo } from '../lib/data.ts';
import { coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { dayOf, monthShort } from '../lib/dates.ts';
import { stripReferenceLine } from '../lib/seo-text.ts';
import { Icon } from './Icon.tsx';
import { textAttrs } from './Cards.tsx';

interface HomeEditorialProps {
  ctx: Ctx;
  news: Doc[];
  events: Doc[];
  forum: Doc[];
  upcoming: Doc[];
}

export function HomeEditorial({ ctx, news, events, forum }: HomeEditorialProps) {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  const leadNews = news[0];
  const leadNewsTr = leadNews ? trInfo(leadNews, lang.code) : null;
  const leadNewsDate = leadNews ? displayDate(leadNews, lang.code) : null;
  const leadNewsCover = leadNews ? coverOf(leadNews, 'large') : null;
  const leadNewsExcerpt = leadNews ? stripReferenceLine(leadNews.excerpt) : null;
  const leadNewsCategory =
    leadNews?.category && typeof leadNews.category === 'object'
      ? leadNews.category.name
      : isAr
      ? 'خبر'
      : 'News';
  const leadNewsHref = leadNews ? docHref(ctx, 'news', leadNews.id) : href('/news');

  // Combine latest events and forum items up to 4 items for balanced visual height
  const combinedEvents: (Doc & { isForum?: boolean })[] = [
    ...events.slice(0, 3).map((e) => ({ ...e, isForum: false })),
    ...forum.slice(0, 2).map((f) => ({ ...f, isForum: true })),
  ].slice(0, 4);

  return (
    <section className="news-events-section" aria-labelledby="news-events-heading">
      <div className="container">
        {/* Section Header */}
        <div className="news-events-head">
          <div className="news-events-head__info">
            <span className="news-events-head__badge">
              <Icon name="file" className="news-events-head__badge-icon" />
              <span>{isAr ? 'الأخبار والأنشطة' : 'News & Activities'}</span>
            </span>
            <h2 id="news-events-heading" className="news-events-head__title">
              {isAr ? 'آخر الأخبار والفعاليات' : 'Latest News & Events'}
            </h2>
            <p className="news-events-head__lead">
              {isAr
                ? 'متابعة شاملة لجديد أنشطة المركز، الزيارات والندوات واللقاءات العلمية والثقافية'
                : 'Comprehensive coverage of Center activities, symposiums, and cultural milestones'}
            </p>
          </div>
          <div className="news-events-head__actions">
            <Link href={href('/news')} className="news-events-head__btn">
              <span>{isAr ? 'كافة الأخبار' : 'All News'}</span>
              <Icon name="arrow" className="news-events-head__btn-arrow" />
            </Link>
            <Link href={href('/events')} className="news-events-head__btn news-events-head__btn--secondary">
              <span>{isAr ? 'كافة الفعاليات' : 'All Events'}</span>
              <Icon name="arrow" className="news-events-head__btn-arrow" />
            </Link>
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="news-events-layout">
          {/* Column 1 (Right in RTL): Featured News Card */}
          {leadNews ? (
            <div className="news-col-featured">
              <article className="featured-news-card">
                <div className="featured-news-card__media">
                  {leadNewsCover ? (
                    <Image
                      src={leadNewsCover.src}
                      alt={leadNewsCover.alt || leadNews.title}
                      fill
                      sizes="(max-width: 960px) 100vw, 680px"
                      priority
                      className="featured-news-card__img"
                    />
                  ) : (
                    <div className="featured-news-card__placeholder" aria-hidden="true" />
                  )}
                  <div className="featured-news-card__badge-wrap">
                    <span className="featured-news-card__badge">{leadNewsCategory}</span>
                  </div>
                </div>

                <div className="featured-news-card__content">
                  <h3
                    className="featured-news-card__title"
                    {...(leadNewsTr ? textAttrs(leadNewsTr.titleLang, lang.code) : {})}
                  >
                    <Link href={leadNewsHref}>{leadNews.title}</Link>
                  </h3>

                  {leadNewsExcerpt ? (
                    <p
                      className="featured-news-card__summary"
                      {...(leadNewsTr ? textAttrs(leadNewsTr.excerptLang, lang.code) : {})}
                    >
                      {leadNewsExcerpt}
                    </p>
                  ) : null}

                  <div className="featured-news-card__footer">
                    {leadNewsDate ? (
                      <time
                        dateTime={leadNews.publishedAt ?? undefined}
                        className="featured-news-card__date"
                      >
                        <Icon name="calendar" className="featured-news-card__date-icon" />
                        <span>{leadNewsDate}</span>
                      </time>
                    ) : null}

                    <Link
                      href={leadNewsHref}
                      className="featured-news-card__cta"
                      aria-label={isAr ? `قراءة الخبر: ${leadNews.title}` : `Read news: ${leadNews.title}`}
                      title={isAr ? 'قراءة الخبر' : 'Read article'}
                    >
                      <Icon name="arrow" className="featured-news-card__cta-arrow" />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          ) : null}

          {/* Column 2 (Left in RTL): Events List */}
          <div className="news-col-events">
            <div className="events-list-wrapper">
              <div className="events-list-head">
                <div className="events-list-head__title-wrap">
                  <Icon name="calendar" className="events-list-head__icon" />
                  <h3 className="events-list-head__title">
                    {isAr ? 'أحدث الفعاليات والمؤتمرات' : 'Upcoming & Recent Events'}
                  </h3>
                </div>
              </div>

              <div className="events-list-items">
                {combinedEvents.map((item) => {
                  const itemTr = trInfo(item, lang.code);
                  const d = (item.eventDate as string | undefined) ?? item.publishedAt ?? undefined;
                  const itemHref = docHref(ctx, item.isForum ? 'forum' : 'event', item.id);
                  const itemCover = coverOf(item, 'thumb');
                  const day = d ? dayOf(d) : '';
                  const month = d ? monthShort(d, lang.code) : '';
                  const speaker = item.speaker ? String(item.speaker) : null;
                  const venue = item.venue ? String(item.venue) : null;
                  const timeText = item.timeText ? String(item.timeText) : null;

                  return (
                    <article key={item.id} className="event-item">
                      {/* Thumbnail Column */}
                      <div className="event-item__thumb-col">
                        {itemCover ? (
                          <div className="event-item__thumb">
                            <Image
                              src={itemCover.src}
                              alt=""
                              fill
                              sizes="112px"
                              className="event-item__img"
                            />
                          </div>
                        ) : (
                          <div
                            className="event-item__thumb event-item__thumb--placeholder"
                            aria-hidden="true"
                          >
                            <Icon
                              name={item.isForum ? 'users' : 'calendar'}
                              className="event-item__placeholder-icon"
                            />
                          </div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="event-item__content-col">
                        <span className="event-item__category">
                          {item.isForum
                            ? isAr
                              ? 'منتدى عميد الوفاء'
                              : 'Cultural Forum'
                            : isAr
                            ? 'فعالية علمية'
                            : 'Academic Event'}
                        </span>
                        <h4
                          className="event-item__title"
                          {...textAttrs(itemTr.titleLang, lang.code)}
                        >
                          <Link href={itemHref}>{item.title}</Link>
                        </h4>
                        <div className="event-item__meta">
                          {speaker ? (
                            <span className="event-item__meta-item">
                              <Icon name="user" className="event-item__meta-icon" />
                              <span>{speaker}</span>
                            </span>
                          ) : null}
                          {venue ? (
                            <span className="event-item__meta-item">
                              <Icon name="pin" className="event-item__meta-icon" />
                              <span>{venue}</span>
                            </span>
                          ) : null}
                          {timeText ? (
                            <span className="event-item__meta-item">
                              <Icon name="clock" className="event-item__meta-icon" />
                              <span>{timeText}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Date Badge Column */}
                      {d && day && month ? (
                        <div className="event-item__date-col">
                          <div className="event-date-badge" aria-hidden="true">
                            <span className="event-date-badge__day">{day}</span>
                            <span className="event-date-badge__month">{month}</span>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <div className="events-list-footer">
                <Link href={href('/events')} className="events-list-all-link">
                  <span>{isAr ? 'استعراض كافة الفعاليات والمؤتمرات' : 'View all events & conferences'}</span>
                  <Icon name="arrow" className="events-list-all-link__arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
