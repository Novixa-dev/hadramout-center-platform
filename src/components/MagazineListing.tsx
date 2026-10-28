import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Ctx } from '../lib/ctx.ts';
import { absolute, coverOf, displayDate, docHref } from '../lib/ctx.ts';
import { getSite } from '../lib/data.ts';
import { queryArchive } from '../lib/facets.ts';
import {
  activeFilters,
  effectiveSort,
  parseListQuery,
  queryParams,
  toSearch,
  type ListQuery,
} from '../lib/list-query.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { Pagination } from './Pagination.tsx';
import { Icon } from './Icon.tsx';
import { FilterBehavior, FiltersClose, FiltersToggle } from './client/FilterControls.tsx';

type Raw = Record<string, string | string[] | undefined>;

interface MagazineListingProps {
  ctx: Ctx;
  basePath: string;
  searchParams: Raw;
  title: string;
  description?: string;
}

export async function MagazineListing({
  ctx,
  basePath,
  searchParams,
  title,
  description,
}: MagazineListingProps) {
  const { t, href, lang } = ctx;
  const isAr = lang.code === 'ar';
  const q: ListQuery = parseListQuery(searchParams, 'magazine');
  const sort = effectiveSort(q);
  // 20 items per page aligns with the 5-column wide-screen grid (4 full rows of 5)
  const limit = 20;

  const res = await queryArchive({
    type: 'magazine',
    lang: lang.code,
    q: q.q,
    year: q.year,
    pdf: q.pdf,
    sort,
    page: q.page,
    limit,
  });

  if (q.page > res.pages) notFound();
  const site = await getSite(lang.code);

  const base = href(basePath);
  const params = (patch: Partial<Record<keyof ListQuery, unknown>>) => {
    return queryParams(q, 'magazine', { page: 1, ...patch });
  };
  const link = (patch: Partial<Record<keyof ListQuery, unknown>>) =>
    `${base}${toSearch(params(patch))}`;

  const userActive = activeFilters(q);
  const counts = res.counts;
  const years = [...counts.years.entries()].sort((a, b) => b[0] - a[0]);

  const chips: { key: string; label: string; remove: string }[] = [];
  if (q.q && userActive.includes('q'))
    chips.push({ key: 'q', label: t('list.chip.q', { v: q.q }), remove: link({ q: undefined }) });
  if (q.year)
    chips.push({ key: 'year', label: t('list.chip.year', { v: q.year }), remove: link({ year: undefined }) });
  if (q.pdf)
    chips.push({ key: 'pdf', label: t('list.pdfOnly'), remove: link({ pdf: undefined }) });

  const sortOptions: [string, string][] = [
    ...(q.q ? ([['relevance', t('list.sort.relevance')]] as [string, string][]) : []),
    ['newest', t('list.sort.newest')],
    ['oldest', t('list.sort.oldest')],
    ['title', t('list.sort.title')],
  ];

  const items = res.docs;
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
        url: absolute(`/${lang.code}/magazines/${d.id}`),
      })),
      total: res.total,
    }),
    breadcrumbJsonLd([
      { name: t('nav.home'), url: absolute(`/${lang.code}`) },
      { name: title, url: absolute(`/${lang.code}${basePath}`) },
    ]),
  ];

  const showCount =
    res.total === res.all
      ? t('list.count', { count: res.total })
      : t('list.count.of', { count: res.total, all: res.all });

  return (
    <div className="magazine-archive-page">
      {/* ── Section A, B, C & 6: Premium Hero Section ── */}
      <section className="magazine-hero" aria-label={title} data-aos="fade-up">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav className="magazine-hero__crumbs" aria-label={t('a11y.breadcrumb')}>
            <ol>
              <li>
                <Link href={href('/')} className="magazine-hero__crumb-link">
                  {t('nav.home')}
                </Link>
              </li>
              <li className="magazine-hero__crumb-sep" aria-hidden="true">/</li>
              <li aria-current="page">
                <span className="magazine-hero__crumb-current">{title}</span>
              </li>
            </ol>
          </nav>

          {/* Hero Grid: Title Group & Artwork */}
          <div className="magazine-hero__grid">
            <div className="magazine-hero__content">
              <div className="magazine-hero__title-group">
                <div className="magazine-hero__heading-wrap">
                  <span className="magazine-hero__badge-icon" aria-hidden="true">
                    <Icon name="layers" />
                  </span>
                  <h1 className="magazine-hero__title">{title}</h1>
                </div>
                <div className="magazine-hero__accent-bar" aria-hidden="true" />
                <p className="magazine-hero__lead">
                  {description || (isAr ? 'أعداد المجلة الدورية: دراسات وقراءات وحوارات وترجمات وإبداع.' : t('magazines.lead'))}
                </p>
              </div>
            </div>

            {/* Hero Artwork: Still life of prestigious journals & brass rosette */}
            <div className="magazine-hero__artwork-wrap" aria-hidden="true">
              <Image
                src="/legacy-media/2026/10/magazine-hero-publications.png"
                alt="مجلة حضرموت الثقافية"
                width={500}
                height={326}
                className="magazine-hero__artwork-img"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: Main Archive Browsing Area ── */}
      <section className="magazine-archive-section" data-aos="fade-up" data-aos-delay="100">
        <div className="container">
          <div className="magazine-archive__layout">
            {/* ── Section 11: Dedicated Filter Sidebar (RTL Right Column) ── */}
            <aside className="magazine-sidebar filters" id="filters" tabIndex={-1} aria-label={t('list.filters')}>
              <div className="magazine-sidebar__head filters__head">
                <div className="magazine-sidebar__head-title">
                  <Icon name="sliders" className="magazine-sidebar__head-icon" />
                  <h2>{t('list.filters')}</h2>
                  {userActive.length ? (
                    <span className="magazine-sidebar__active-badge" aria-label={t('list.active')}>
                      {userActive.length}
                    </span>
                  ) : null}
                </div>
                {userActive.length ? (
                  <Link className="magazine-sidebar__reset filters__reset" href={clearHref}>
                    {t('list.clear')}
                  </Link>
                ) : null}
                <FiltersClose label={t('nav.close')} />
              </div>

              <form id="magazine-filter-form" className="magazine-sidebar__form filters__form" method="get" action={base}>
                {/* Year Filter Group */}
                {years.length ? (
                  <div className="magazine-facet">
                    <h3 className="magazine-facet__title">{t('list.year')}</h3>
                    <div className="magazine-facet__list">
                      <label className={`magazine-check ${!q.year ? 'magazine-check--selected' : ''}`}>
                        <input type="radio" name="year" value="" defaultChecked={!q.year} />
                        <span className="magazine-check__label">{t('list.all')}</span>
                        <span className="magazine-check__count">{res.all}</span>
                      </label>
                      {years.map(([y, n]) => (
                        <label key={y} className={`magazine-check ${q.year === y ? 'magazine-check--selected' : ''}`}>
                          <input type="radio" name="year" value={y} defaultChecked={q.year === y} />
                          <span className="magazine-check__label">{y}</span>
                          <span className="magazine-check__count">{n}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Availability Filter Group */}
                <div className="magazine-facet">
                  <h3 className="magazine-facet__title">{t('list.availability')}</h3>
                  <div className="magazine-facet__list">
                    <label className={`magazine-check ${!q.pdf ? 'magazine-check--selected' : ''}`}>
                      <input type="radio" name="pdf" value="" defaultChecked={!q.pdf} />
                      <span className="magazine-check__label">{t('list.all')}</span>
                      <span className="magazine-check__count">{res.all}</span>
                    </label>
                    <label className={`magazine-check ${q.pdf ? 'magazine-check--selected' : ''}`}>
                      <input type="radio" name="pdf" value="1" defaultChecked={Boolean(q.pdf)} />
                      <span className="magazine-check__label">{t('list.pdfOnly')}</span>
                      <span className="magazine-check__count">{counts.pdf}</span>
                    </label>
                  </div>
                </div>

                <div className="magazine-sidebar__actions filters__actions">
                  <button className="magazine-sidebar__submit-btn btn btn--primary" type="submit">
                    {t('list.apply', { count: res.total })}
                  </button>
                  {userActive.length ? (
                    <Link className="magazine-sidebar__clear-btn btn btn--ghost" href={clearHref}>
                      {t('list.clear')}
                    </Link>
                  ) : null}
                </div>
              </form>
            </aside>
            <div className="filters-scrim" aria-hidden="true" />

            {/* ── Main Content Area (RTL Left Column) ── */}
            <main className="magazine-main results" aria-labelledby="results-h">
              {/* ── Section 8: Prominent Search Form ── */}
              <div className="magazine-search" role="search">
                <div className="magazine-search__field">
                  <Icon name="search" className="magazine-search__icon" />
                  <label className="sr-only" htmlFor="magazine-q">
                    {t('list.search')}
                  </label>
                  <input
                    id="magazine-q"
                    form="magazine-filter-form"
                    className="magazine-search__input"
                    type="search"
                    name="q"
                    defaultValue={q.q ?? ''}
                    placeholder={isAr ? 'ابحث في مجلة حضرموت الثقافية...' : t('list.search.in', { section: title })}
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                  {q.q ? (
                    <Link
                      className="magazine-search__clear"
                      href={link({ q: undefined })}
                      aria-label={t('list.search.clear')}
                    >
                      <Icon name="close" />
                    </Link>
                  ) : null}
                </div>
                <button
                  className="magazine-search__submit-btn btn btn--primary"
                  type="submit"
                  form="magazine-filter-form"
                >
                  {t('nav.search')}
                </button>
              </div>

              {/* ── Section 9: Result Count and Sorting Toolbar ── */}
              <div className="magazine-toolbar toolbar">
                <div className="magazine-toolbar__start cluster">
                  <FiltersToggle label={t('list.filters')} count={userActive.length} />
                  <h2
                    id="results-h"
                    className="magazine-toolbar__count toolbar__count"
                    aria-live="polite"
                  >
                    {showCount}
                  </h2>
                </div>
                <div className="magazine-toolbar__tools toolbar__tools">
                  <label className="sr-only" htmlFor="magazine-sort">
                    {t('list.sort')}
                  </label>
                  <select
                    id="magazine-sort"
                    name="sort"
                    form="magazine-filter-form"
                    className="magazine-toolbar__select select"
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
              </div>

              {/* Active Filter Chips */}
              {chips.length ? (
                <ul className="chips active-filters" aria-label={t('list.active')}>
                  {chips.map((c) => (
                    <li key={c.key}>
                      <Link
                        className="chip chip--lg chip--gold chip--remove"
                        href={c.remove}
                        aria-label={`${t('list.remove')}: ${c.label}`}
                      >
                        {c.label} <Icon name="close" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link className="btn btn--ghost btn--sm" href={clearHref}>
                      {t('list.clear')}
                    </Link>
                  </li>
                </ul>
              ) : null}

              {/* ── Section 10 & 13: Magazine Grid or Empty State ── */}
              {items.length === 0 ? (
                <div className="magazine-empty empty" role="status">
                  <div className="magazine-empty__icon-wrap">
                    <Icon name="search" />
                  </div>
                  <h3>{isAr ? 'لا توجد نتائج مطابقة لبحثك.' : t('list.empty')}</h3>
                  <p>
                    {userActive.length
                      ? (isAr ? 'جرّب تغيير كلمات البحث أو تعديل خيارات التصفية.' : t('list.empty.filters'))
                      : t('list.empty.none')}
                  </p>
                  {userActive.length ? (
                    <Link className="btn btn--primary btn--sm" href={clearHref}>
                      {t('list.clear')}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="magazine-grid">
                  {items.map((doc, idx) => {
                    const eager = idx < 5 && q.page === 1;
                    const date =
                      displayDate(doc, lang.code) ||
                      (doc.season as string | undefined) ||
                      '';
                    const n = Number(doc.issueNumber ?? 0);
                    const cover = coverOf(doc);
                    const detailHref = docHref(ctx, 'magazine', doc.id);

                    return (
                      <article key={doc.id} className="magazine-card">
                        <div className="magazine-card__cover">
                          {cover ? (
                            <Image
                              src={cover.src}
                              alt={cover.alt || doc.title}
                              fill
                              sizes="(max-width: 640px) 46vw, (max-width: 1060px) 30vw, (max-width: 1320px) 22vw, 180px"
                              priority={eager}
                              loading={eager ? undefined : 'lazy'}
                              className="magazine-card__img"
                            />
                          ) : (
                            <div className="magazine-card__placeholder" aria-hidden="true">
                              <Icon name="layers" className="magazine-card__placeholder-icon" />
                              <span>{doc.title}</span>
                            </div>
                          )}
                          <div className="magazine-card__spine" aria-hidden="true" />
                          <Link
                            href={detailHref}
                            className="magazine-card__cover-link"
                            aria-label={doc.title}
                          />
                        </div>

                        <div className="magazine-card__body">
                          <h3 className="magazine-card__title">
                            <Link href={detailHref} aria-label={doc.title}>
                              {t('meta.issue', { n: n || idx + 1 })}
                            </Link>
                          </h3>
                          {date ? <p className="magazine-card__date">{date}</p> : null}

                          <div className="magazine-card__action">
                            <Link href={detailHref} className="magazine-card__btn">
                              <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                              <Icon name="arrow" className="magazine-card__btn-arrow" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* ── Section 12: Pagination ── */}
              <Pagination
                ctx={ctx}
                page={res.page}
                pages={res.pages}
                basePath={basePath}
                query={params({})}
              />
            </main>
          </div>
        </div>
      </section>

      <FilterBehavior formId="magazine-filter-form" />

      {jsonLd.map((j, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(j) }}
        />
      ))}
    </div>
  );
}
