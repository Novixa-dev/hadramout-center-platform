import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Ctx } from '../lib/ctx.ts';
import { absolute, coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { getSite, trInfo } from '../lib/data.ts';
import { queryArchive } from '../lib/facets.ts';
import {
  activeFilters,
  effectiveSort,
  parseListQuery,
  perPage,
  queryParams,
  toSearch,
  type ListQuery,
} from '../lib/list-query.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { stripReferenceLine } from '../lib/seo-text.ts';
import { Pagination } from './Pagination.tsx';
import { Icon } from './Icon.tsx';
import { FilterBehavior, FiltersClose, FiltersToggle } from './client/FilterControls.tsx';

type Raw = Record<string, string | string[] | undefined>;

interface NewsListingProps {
  ctx: Ctx;
  basePath: string;
  searchParams: Raw;
  title: string;
  description?: string;
}

export async function NewsListing({
  ctx,
  basePath,
  searchParams,
  title,
  description,
}: NewsListingProps) {
  const { t, href, lang } = ctx;
  const isAr = lang.code === 'ar';
  const q: ListQuery = parseListQuery(searchParams, 'news');
  const sort = effectiveSort(q);
  const limit = perPage('news', q.view);

  const res = await queryArchive({
    type: 'news',
    lang: lang.code,
    q: q.q,
    year: q.year,
    sort,
    page: q.page,
    limit,
  });

  if (q.page > res.pages) notFound();
  const site = await getSite(lang.code);

  const base = href(basePath);
  const params = (patch: Partial<Record<keyof ListQuery, unknown>>) => {
    return queryParams(q, 'news', { page: 1, ...patch });
  };
  const link = (patch: Partial<Record<keyof ListQuery, unknown>>) =>
    `${base}${toSearch(params(patch))}`;

  const userActive = activeFilters(q);
  const counts = res.counts;
  const years = [...counts.years.entries()].sort((a, b) => b[0] - a[0]);

  const chips: { key: string; label: string; remove: string }[] = [];
  if (q.q) {
    chips.push({
      key: 'q',
      label: isAr ? `البحث: ${q.q}` : `Search: ${q.q}`,
      remove: link({ q: undefined }),
    });
  }
  if (q.year) {
    chips.push({
      key: 'year',
      label: isAr ? `السنة: ${q.year}` : `Year: ${q.year}`,
      remove: link({ year: undefined }),
    });
  }

  const sortOptions: [string, string][] = [
    ...(q.q ? ([['relevance', isAr ? 'الأكثر صلة' : 'Most relevant']] as [string, string][]) : []),
    ['newest', isAr ? 'الأحدث أولاً' : 'Newest first'],
    ['oldest', isAr ? 'الأقدم أولاً' : 'Oldest first'],
    ['title', isAr ? 'العنوان (أ – ي)' : 'Title (A–Z)'],
  ];

  const items = res.docs;
  const isPageOneUnfiltered = q.page === 1 && !q.q && !q.year && q.view !== 'list';
  const featuredItem = isPageOneUnfiltered && items.length > 0 ? items[0] : null;
  const standardItems = isPageOneUnfiltered ? items.slice(1) : items;

  const showCountText =
    res.total === res.all
      ? isAr
        ? `${res.total} خبراً`
        : `${res.total} news stories`
      : isAr
        ? `${res.total} من أصل ${res.all} خبر`
        : `${res.total} of ${res.all} stories`;

  const clearHref = base;
  const jsonLd = [
    collectionJsonLd({
      name: title,
      description,
      url: absolute(`/${lang.code}${basePath}`),
      lang: lang.tag,
      org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') },
      items: items.slice(0, 20).map((d) => ({
        name: d.title,
        url: absolute(`/${lang.code}/news/${d.id}`),
      })),
      total: res.total,
    }),
    breadcrumbJsonLd([
      { name: t('nav.home'), url: absolute(`/${lang.code}`) },
      { name: title, url: absolute(`/${lang.code}${basePath}`) },
    ]),
  ];

  return (
    <>
      <div className="container news-listing-page listing" data-aos="fade-up">
        {/* ── Sidebar Filters ────────────────────────────────────────────── */}
        <aside className="filters news-filters" id="filters" tabIndex={-1} aria-label={isAr ? 'تصفية الأخبار' : 'Filter News'}>
          <div className="news-filters__head">
            <div className="news-filters__title-wrap">
              <Icon name="sliders" className="news-filters__head-icon" />
              <h2>{isAr ? 'تصفية الأخبار' : 'Filter News'}</h2>
              {userActive.length ? (
                <span className="news-filters__active-badge" aria-label={t('list.active')}>
                  {userActive.length}
                </span>
              ) : null}
            </div>

            {userActive.length ? (
              <Link className="news-filters__reset" href={clearHref}>
                {isAr ? 'إعادة تعيين' : 'Reset'}
              </Link>
            ) : null}

            <FiltersClose label={t('nav.close')} />
          </div>

          <form id="filter-form" className="news-filters__form filters__form" method="get" action={base}>
            {q.view !== 'grid' ? <input type="hidden" name="view" value={q.view} /> : null}

            <div className="news-facet">
              <div className="news-facet__header">
                <Icon name="calendar" className="news-facet__header-icon" />
                <span className="news-facet__title">{isAr ? 'السنة' : 'Year'}</span>
              </div>

              <div className="news-facet__list">
                <label className={`news-facet__item ${!q.year ? 'news-facet__item--active' : ''}`}>
                  <input
                    type="radio"
                    name="year"
                    value=""
                    defaultChecked={!q.year}
                    className="news-facet__radio"
                  />
                  <span className="news-facet__label">{isAr ? 'جميع السنوات' : 'All Years'}</span>
                  <span className="news-facet__count">{res.all}</span>
                </label>

                {years.map(([y, n]) => {
                  const isActive = q.year === y;
                  return (
                    <label
                      key={y}
                      className={`news-facet__item ${isActive ? 'news-facet__item--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="year"
                        value={y}
                        defaultChecked={isActive}
                        className="news-facet__radio"
                      />
                      <span className="news-facet__label">{y}</span>
                      <span className="news-facet__count">{n}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="news-filters__actions filters__actions">
              <button className="news-filters__apply-btn btn btn--primary" type="submit">
                {isAr ? `تطبيق التصفية (${res.total})` : `Apply Filter (${res.total})`}
              </button>
              {userActive.length ? (
                <Link className="news-filters__clear-btn btn btn--ghost" href={clearHref}>
                  {isAr ? 'مسح التصفية' : 'Clear'}
                </Link>
              ) : null}
            </div>
          </form>
        </aside>

        <div className="filters-scrim" aria-hidden="true" />

        {/* ── Main Content Area ─────────────────────────────────────────── */}
        <section aria-labelledby="news-results-heading" className="news-results-content results">
          {/* ── Search & Sorting Toolbar ─────────────────────────────────── */}
          <div className="news-search-toolbar">
            <div className="news-search-toolbar__search-row" role="search">
              <div className="news-search-toolbar__field">
                <Icon name="search" className="news-search-toolbar__icon" />
                <label className="sr-only" htmlFor="news-q">
                  {isAr ? 'البحث في أخبار المركز' : 'Search news'}
                </label>
                <input
                  id="news-q"
                  form="filter-form"
                  className="news-search-toolbar__input"
                  type="search"
                  name="q"
                  defaultValue={q.q ?? ''}
                  placeholder={isAr ? 'ابحث في أخبار المركز وأنشطته وفعالياته…' : 'Search center news, activities, and events…'}
                  autoComplete="off"
                  enterKeyHint="search"
                />
                {q.q ? (
                  <Link
                    className="news-search-toolbar__clear"
                    href={link({ q: undefined })}
                    aria-label={t('list.search.clear')}
                    title={isAr ? 'مسح البحث' : 'Clear search'}
                  >
                    <Icon name="close" />
                  </Link>
                ) : null}
              </div>

              <button
                className="news-search-toolbar__submit-btn btn btn--primary"
                type="submit"
                form="filter-form"
              >
                <span>{isAr ? 'بحث' : 'Search'}</span>
              </button>
            </div>

            <div className="news-search-toolbar__meta-row">
              <div className="news-search-toolbar__meta-start">
                <FiltersToggle label={isAr ? 'تصفية' : 'Filter'} count={userActive.length} />
                <div className="news-search-toolbar__count" id="news-results-heading" aria-live="polite">
                  <span className="news-search-toolbar__count-dot" aria-hidden="true" />
                  <span>{showCountText}</span>
                </div>
              </div>

              <div className="news-search-toolbar__meta-end">
                <div className="news-search-toolbar__sort-wrap">
                  <label htmlFor="news-sort" className="news-search-toolbar__sort-label">
                    <Icon name="sliders" className="news-search-toolbar__sort-icon" />
                    <span>{isAr ? 'الترتيب:' : 'Sort:'}</span>
                  </label>
                  <select
                    id="news-sort"
                    name="sort"
                    form="filter-form"
                    className="news-search-toolbar__sort-select select"
                    defaultValue={sort}
                    data-default={q.q ? 'relevance' : 'newest'}
                  >
                    {sortOptions.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <nav className="news-search-toolbar__views seg" aria-label={t('list.view')}>
                  <Link
                    href={link({ view: 'grid' })}
                    aria-current={q.view === 'grid' ? 'true' : undefined}
                    aria-label={isAr ? 'عرض شبكي' : 'Grid view'}
                    title={isAr ? 'عرض شبكي' : 'Grid view'}
                    className={`news-view-btn ${q.view === 'grid' ? 'news-view-btn--active' : ''}`}
                  >
                    <Icon name="grid" />
                  </Link>
                  <Link
                    href={link({ view: 'list' })}
                    aria-current={q.view === 'list' ? 'true' : undefined}
                    aria-label={isAr ? 'عرض طولي' : 'List view'}
                    title={isAr ? 'عرض طولي' : 'List view'}
                    className={`news-view-btn ${q.view === 'list' ? 'news-view-btn--active' : ''}`}
                  >
                    <Icon name="list" />
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* ── Active Filter Chips ─────────────────────────────────────── */}
          {chips.length ? (
            <ul className="news-active-chips" aria-label={t('list.active')}>
              {chips.map((c) => (
                <li key={c.key}>
                  <Link className="news-active-chip" href={c.remove} aria-label={`${t('list.remove')}: ${c.label}`}>
                    <span>{c.label}</span>
                    <Icon name="close" className="news-active-chip__icon" />
                  </Link>
                </li>
              ))}
              <li>
                <Link className="news-active-chips__clear-all" href={clearHref}>
                  {isAr ? 'مسح الكل' : 'Clear all'}
                </Link>
              </li>
            </ul>
          ) : null}

          {/* ── Empty State ─────────────────────────────────────────────── */}
          {items.length === 0 ? (
            <div className="news-empty-state" role="status">
              <div className="news-empty-state__icon-wrap">
                <Icon name="search" className="news-empty-state__icon" />
              </div>
              <h3 className="news-empty-state__title">{isAr ? 'لا توجد أخبار مطابقة' : 'No news found'}</h3>
              <p className="news-empty-state__desc">
                {userActive.length
                  ? isAr
                    ? 'لم نتمكن من العثور على أخبار تطابق شروط التصفية المحددة. جرب اختيار سنة أخرى أو تغيير كلمة البحث.'
                    : 'No news matches the selected filters. Try another year or search keyword.'
                  : isAr
                    ? 'لا تتوفر أخبار منشورة حالياً في هذا القسم.'
                    : 'No news published in this section yet.'}
              </p>
              {userActive.length ? (
                <Link className="news-empty-state__btn btn btn--primary btn--sm" href={clearHref}>
                  {isAr ? 'إعادة ضبط التصفية' : 'Reset filters'}
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              {/* ── Featured Lead Story (Page 1) ────────────────────────── */}
              {featuredItem ? (
                <article className="news-card-lead">
                  <div className="news-card-lead__media">
                    <span className="news-card-lead__badge">
                      <span className="news-card-lead__badge-dot" aria-hidden="true" />
                      <span>{isAr ? 'خبر رئيسي' : 'Featured Story'}</span>
                    </span>

                    <Link
                      href={docHref(ctx, 'news', featuredItem.id)}
                      className="news-card-lead__media-link"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {coverOf(featuredItem) ? (
                        <Image
                          src={coverOf(featuredItem)!.src}
                          alt={coverOf(featuredItem)!.alt || featuredItem.title}
                          fill
                          priority
                          sizes="(max-width: 900px) 100vw, 55vw"
                          className="news-card-lead__img"
                        />
                      ) : (
                        <div className="news-card-lead__placeholder">
                          <Icon name="rosette" className="news-card-lead__placeholder-icon" />
                          <span>{featuredItem.title}</span>
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="news-card-lead__content">
                    <div className="news-card-lead__meta-top">
                      <span className="news-card-lead__category">
                        {isAr ? 'أخبار المركز والأنشطة' : 'Center News'}
                      </span>
                      {displayDate(featuredItem, lang.code) ? (
                        <span className="news-card-lead__date">
                          <Icon name="calendar" className="news-card-lead__meta-icon" />
                          <time dateTime={featuredItem.publishedAt ?? undefined}>
                            {displayDate(featuredItem, lang.code)}
                          </time>
                        </span>
                      ) : null}
                    </div>

                    <h2 className="news-card-lead__title">
                      <Link href={docHref(ctx, 'news', featuredItem.id)}>
                        {featuredItem.title}
                      </Link>
                    </h2>

                    {stripReferenceLine(featuredItem.excerpt) ? (
                      <p className="news-card-lead__excerpt">
                        {stripReferenceLine(featuredItem.excerpt)}
                      </p>
                    ) : null}

                    <div className="news-card-lead__footer">
                      <Link
                        href={docHref(ctx, 'news', featuredItem.id)}
                        className="news-card-lead__cta-btn"
                      >
                        <span>{isAr ? 'قراءة الخبر كاملاً' : 'Read full story'}</span>
                        <Icon name="arrow" className="news-card-lead__cta-arrow" />
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null}

              {/* ── Standard News Feed (Grid or List View) ──────────────── */}
              {q.view === 'list' ? (
                <div className="news-feed-list">
                  {items.map((doc, idx) => {
                    const cover = coverOf(doc);
                    const date = displayDate(doc, lang.code);
                    const tr = trInfo(doc, lang.code);
                    const excerpt = stripReferenceLine(doc.excerpt);
                    const itemHref = docHref(ctx, 'news', doc.id);

                    return (
                      <article key={doc.id} className="news-card-row">
                        <div className="news-card-row__media">
                          <span className="news-card-row__badge">{isAr ? 'خبر' : 'News'}</span>
                          <Link href={itemHref} className="news-card-row__media-link" tabIndex={-1} aria-hidden="true">
                            {cover ? (
                              <Image
                                src={cover.src}
                                alt={cover.alt || doc.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 220px"
                                priority={idx < 2 && q.page === 1}
                                loading={idx < 2 && q.page === 1 ? undefined : 'lazy'}
                                className="news-card-row__img"
                              />
                            ) : (
                              <div className="news-card-row__placeholder">
                                <Icon name="rosette" />
                              </div>
                            )}
                          </Link>
                        </div>

                        <div className="news-card-row__content">
                          <div className="news-card-row__meta">
                            {date ? (
                              <span className="news-card-row__date">
                                <Icon name="calendar" className="news-card-row__meta-icon" />
                                <time dateTime={doc.publishedAt ?? undefined}>{date}</time>
                              </span>
                            ) : null}
                            <span className="news-card-row__tag">{isAr ? 'مركز حضرموت' : 'Hadhramout Center'}</span>
                          </div>

                          <h3 className="news-card-row__title">
                            <Link href={itemHref} dir={tr.titleLang === 'ar' ? 'rtl' : undefined}>
                              {doc.title}
                            </Link>
                          </h3>

                          {excerpt ? <p className="news-card-row__excerpt">{excerpt}</p> : null}

                          <div className="news-card-row__footer">
                            <Link href={itemHref} className="news-card-row__link">
                              <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                              <Icon name="arrow" className="news-card-row__arrow" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="news-feed-grid">
                  {standardItems.map((doc, idx) => {
                    const cover = coverOf(doc);
                    const date = displayDate(doc, lang.code);
                    const tr = trInfo(doc, lang.code);
                    const excerpt = stripReferenceLine(doc.excerpt);
                    const itemHref = docHref(ctx, 'news', doc.id);

                    return (
                      <article key={doc.id} className="news-card-standard">
                        <div className="news-card-standard__media">
                          <span className="news-card-standard__badge">{isAr ? 'خبر' : 'News'}</span>
                          <Link href={itemHref} className="news-card-standard__media-link" tabIndex={-1} aria-hidden="true">
                            {cover ? (
                              <Image
                                src={cover.src}
                                alt={cover.alt || doc.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                                priority={idx < 2 && q.page === 1}
                                loading={idx < 2 && q.page === 1 ? undefined : 'lazy'}
                                className="news-card-standard__img"
                              />
                            ) : (
                              <div className="news-card-standard__placeholder">
                                <Icon name="rosette" className="news-card-standard__placeholder-icon" />
                                <span>{doc.title}</span>
                              </div>
                            )}
                          </Link>
                        </div>

                        <div className="news-card-standard__content">
                          <div className="news-card-standard__meta">
                            {date ? (
                              <span className="news-card-standard__date">
                                <Icon name="calendar" className="news-card-standard__meta-icon" />
                                <time dateTime={doc.publishedAt ?? undefined}>{date}</time>
                              </span>
                            ) : null}
                            <span className="news-card-standard__tag">
                              {isAr ? 'أخبار المركز' : 'Center News'}
                            </span>
                          </div>

                          <h3 className="news-card-standard__title">
                            <Link href={itemHref} dir={tr.titleLang === 'ar' ? 'rtl' : undefined} title={doc.title}>
                              {doc.title}
                            </Link>
                          </h3>

                          {excerpt ? (
                            <p className="news-card-standard__excerpt">{excerpt}</p>
                          ) : null}

                          <div className="news-card-standard__footer">
                            <Link href={itemHref} className="news-card-standard__btn">
                              <span>{isAr ? 'اقرأ الخبر' : 'Read story'}</span>
                              <Icon name="arrow" className="news-card-standard__arrow" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Pagination ──────────────────────────────────────────────── */}
          <div className="news-pagination-wrap">
            <Pagination
              ctx={ctx}
              page={res.page}
              pages={res.pages}
              basePath={basePath}
              query={params({})}
            />
          </div>
        </section>

        {/* Client script behavior for desktop auto-submit and mobile bottom-sheet */}
        <FilterBehavior formId="filter-form" />
      </div>

      {jsonLd.map((j, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(j) }}
        />
      ))}
    </>
  );
}
