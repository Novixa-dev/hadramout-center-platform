import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Ctx } from '../lib/ctx.ts';
import { absolute, coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { getSite, trInfo, type Doc } from '../lib/data.ts';
import { queryArchive } from '../lib/facets.ts';
import {
  effectiveSort,
  parseListQuery,
  queryParams,
  toSearch,
  type ListQuery,
} from '../lib/list-query.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { Pagination } from './Pagination.tsx';
import { Icon } from './Icon.tsx';
import { textAttrs } from './Cards.tsx';
import { VideoPlayerModal } from './client/VideoPlayerModal.tsx';

type Raw = Record<string, string | string[] | undefined>;

interface VideosListingProps {
  ctx: Ctx;
  basePath: string;
  searchParams: Raw;
  title: string;
  description?: string;
}

export async function VideosListing({
  ctx,
  basePath,
  searchParams,
  title,
  description,
}: VideosListingProps) {
  const { t, href, lang } = ctx;
  const isAr = lang.code === 'ar';

  const q: ListQuery = parseListQuery(searchParams, 'video');
  const sort = effectiveSort(q);
  const limit = 12;

  const res = await queryArchive({
    type: 'video',
    lang: lang.code,
    q: q.q,
    sort,
    page: q.page,
    limit,
  });

  if (q.page > res.pages) notFound();
  const site = await getSite(lang.code);

  const base = href(basePath);
  const link = (patch: Partial<Record<keyof ListQuery, unknown>>) => {
    return `${base}${toSearch(queryParams(q, 'video', { page: 1, ...patch }))}`;
  };

  const items = res.docs;
  const clearHref = base;

  const paginationQuery: Record<string, string | undefined> = {};
  if (q.q) paginationQuery.q = q.q;

  const jsonLd = [
    collectionJsonLd({
      name: title,
      description,
      url: absolute(`/${lang.code}${basePath}`),
      lang: lang.tag,
      org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') },
      items: items.slice(0, 20).map((d) => ({
        name: d.title,
        url: absolute(`/${lang.code}/videos/${d.id}`),
      })),
      total: res.total,
    }),
    breadcrumbJsonLd([
      { name: t('nav.home'), url: absolute(`/${lang.code}`) },
      { name: title, url: absolute(`/${lang.code}${basePath}`) },
    ]),
  ];

  return (
    <div className="media-gallery-page" dir="rtl">
      {/* ── Breadcrumbs & Hero Header ── */}
      <section className="media-gallery-hero">
        <div className="container">
          <nav className="media-gallery-breadcrumbs" aria-label={t('a11y.breadcrumb')}>
            <ol className="media-gallery-breadcrumbs__list">
              <li className="media-gallery-breadcrumbs__item">
                <Link href={href('/')}>{t('nav.home')}</Link>
              </li>
              <li className="media-gallery-breadcrumbs__sep" aria-hidden="true">
                <Icon name="arrow" />
              </li>
              <li
                className="media-gallery-breadcrumbs__item media-gallery-breadcrumbs__item--current"
                aria-current="page"
              >
                {title}
              </li>
            </ol>
          </nav>

          <div className="media-gallery-hero__header">
            <h1 className="media-gallery-hero__title">{title}</h1>
            <div className="media-gallery-hero__gold-line" aria-hidden="true" />
            <p className="media-gallery-hero__lead">
              <span>{description || (isAr ? 'ندوات وحوارات ولقاءات علمية مسجّلة عن تاريخ حضرموت وثقافتها.' : 'Seminars, dialogues, and scholarly sessions on Hadramout history.')}</span>
              <span className="media-gallery-hero__count-badge">
                {isAr ? `${res.total} مرئيات` : `${res.total} videos`}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Gallery Content ── */}
      <div className="container media-gallery-content">
        {/* Search & Meta Bar */}
        <div className="media-gallery-toolbar">
          <form className="media-gallery-search" method="get" action={base}>
            <div className="media-gallery-search__input-wrap">
              <Icon name="search" className="media-gallery-search__icon" />
              <input
                type="search"
                name="q"
                defaultValue={q.q ?? ''}
                className="media-gallery-search__input"
                placeholder={isAr ? 'ابحث في المرئيات...' : 'Search in videos...'}
                aria-label={isAr ? 'ابحث في المرئيات' : 'Search in videos'}
              />
              {q.q ? (
                <Link
                  href={link({ q: undefined })}
                  className="media-gallery-search__clear"
                  aria-label={t('list.clear')}
                >
                  <Icon name="close" />
                </Link>
              ) : null}
            </div>
            <button type="submit" className="media-gallery-search__btn">
              <Icon name="search" />
              <span>{t('home.search.submit')}</span>
            </button>
          </form>

          <div className="media-gallery-count-pill">
            <span>{isAr ? `إجمالي المرئيات: ${res.total}` : `Total videos: ${res.total}`}</span>
          </div>
        </div>

        {/* ── 2-Column Responsive Video Grid ── */}
        {items.length === 0 ? (
          <div className="media-gallery-empty">
            <div className="media-gallery-empty__icon-wrap">
              <Icon name="play" />
            </div>
            <h3 className="media-gallery-empty__title">{t('list.empty')}</h3>
            <p className="media-gallery-empty__text">
              {isAr
                ? 'لا توجد مرئيات تطابق معايير البحث الحالية. جرّب تعديل الكلمات المفتاحية.'
                : 'No videos match your search query.'}
            </p>
            {q.q ? (
              <Link href={clearHref} className="btn btn--primary btn--sm">
                {isAr ? 'عرض كافة المرئيات' : 'View all videos'}
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="media-gallery-grid">
            {items.map((doc: Doc) => {
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
                <article key={doc.id} className="media-video-card">
                  <div className="media-video-card__thumb-wrap">
                    {src ? (
                      <Image
                        src={src}
                        alt={doc.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 750px"
                        className="media-video-card__img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="media-video-card__fallback" aria-hidden="true">
                        <span className="media-video-card__fallback-badge">
                          {isAr ? 'مركز حضرموت للتوثيق والنشر' : 'Hadramout Center Platform'}
                        </span>
                      </div>
                    )}

                    {/* Translucent Dark Overlay */}
                    <div className="media-video-card__overlay" aria-hidden="true" />

                    {/* Circular Green Play Button */}
                    <VideoPlayerModal
                      youtubeId={doc.youtubeId as string | undefined}
                      videoUrl={videoUrl}
                      title={doc.title}
                      label={isAr ? 'تشغيل الفيديو' : 'Play video'}
                      closeLabel={isAr ? 'إغلاق' : 'Close'}
                    />

                    {duration ? (
                      <span className="media-video-card__duration">{duration}</span>
                    ) : null}
                  </div>

                  <div className="media-video-card__content">
                    <h2 className="media-video-card__title" {...textAttrs(tr.titleLang, lang.code)}>
                      <Link href={videoUrl} className="media-video-card__title-link">
                        {doc.title}
                      </Link>
                    </h2>

                    {guest || dateStr ? (
                      <div className="media-video-card__meta">
                        {guest ? (
                          <span className="media-video-card__guest">
                            <Icon name="user" className="media-video-card__meta-icon" />
                            <span>{guest}</span>
                          </span>
                        ) : null}
                        {dateStr ? (
                          <span className="media-video-card__date">
                            <Icon name="calendar" className="media-video-card__meta-icon" />
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
        )}

        {/* Pagination */}
        {res.pages > 1 ? (
          <div className="media-gallery-pagination-wrap">
            <Pagination
              ctx={ctx}
              page={res.page}
              pages={res.pages}
              basePath={basePath}
              query={paginationQuery}
            />
          </div>
        ) : null}
      </div>

      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }}
        />
      ))}
    </div>
  );
}
