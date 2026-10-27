import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Ctx } from '../lib/ctx.ts';
import { absolute, displayDate, docHref, authorsOf } from '../lib/ctx.ts';
import { getSite, type Doc } from '../lib/data.ts';
import { queryArchive } from '../lib/facets.ts';
import type { TopicNode } from '../lib/facet-core.ts';
import {
  activeFilters,
  effectiveSort,
  parseListQuery,
  queryParams,
  toSearch,
  type ListQuery,
} from '../lib/list-query.ts';
import { stripReferenceLine } from '../lib/seo-text.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { Pagination } from './Pagination.tsx';
import { Icon } from './Icon.tsx';
import {
  FacetFind,
  FilterBehavior,
  FiltersClose,
  FiltersToggle,
} from './client/FilterControls.tsx';

type Raw = Record<string, string | string[] | undefined>;

interface ResearchListingProps {
  ctx: Ctx;
  node: TopicNode;
  parent: TopicNode | null;
  basePath: string;
  searchParams: Raw;
  title: string;
  description?: string;
}

const TOP_AUTHORS = 60;

export async function ResearchListing({
  ctx,
  node,
  parent,
  basePath,
  searchParams,
  title,
  description,
}: ResearchListingProps) {
  const { t, href, lang } = ctx;
  const isAr = lang.code === 'ar';

  const parsed: ListQuery = parseListQuery(searchParams, 'article');

  // Determine which category to query:
  // If parsed.category is provided and is a valid subcategory of this topic, filter by that subcategory.
  // Otherwise, filter by node.id (which encompasses all subcategories via categoryScope).
  const isSubcategorySelected =
    parsed.category && node.children.some((c) => c.id === parsed.category);
  const activeCategoryId = isSubcategorySelected ? parsed.category : undefined;
  const queryCategory = isSubcategorySelected ? parsed.category : node.id;

  const q: ListQuery = {
    ...parsed,
    category: activeCategoryId,
  };

  const sort = effectiveSort(q);
  const limit = 12;

  const res = await queryArchive({
    type: 'article',
    lang: lang.code,
    q: q.q,
    year: q.year,
    category: queryCategory,
    author: q.author,
    sort,
    page: q.page,
    limit,
  });

  if (q.page > res.pages) notFound();
  const site = await getSite(lang.code);

  const base = href(basePath);
  const link = (patch: Partial<Record<keyof ListQuery, unknown>>) => {
    const p = queryParams(
      {
        ...q,
        category: activeCategoryId,
      },
      'article',
      { page: 1, ...patch }
    );
    return `${base}${toSearch(p)}`;
  };

  const userActive = activeFilters({
    ...q,
    category: activeCategoryId,
  });

  const counts = res.counts;
  const years = [...counts.years.entries()].sort((a, b) => b[0] - a[0]);

  // Authors with articles matching other active filters
  const authorOptions = [...counts.authors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_AUTHORS)
    .map(([id, n]) => ({ id, n, name: res.authorNames.get(id) ?? '' }))
    .filter((a) => a.name);

  if (
    q.author &&
    !authorOptions.some((a) => a.id === q.author) &&
    res.authorNames.get(q.author)
  ) {
    authorOptions.push({
      id: q.author,
      n: counts.authors.get(q.author) ?? 0,
      name: res.authorNames.get(q.author) as string,
    });
  }

  const selectedAuthorName = q.author ? res.authorNames.get(q.author) : null;

  const sortOptions: [string, string][] = [
    ...(q.q ? ([['relevance', t('list.sort.relevance')]] as [string, string][]) : []),
    ['newest', t('list.sort.newest')],
    ['oldest', t('list.sort.oldest')],
    ['title', t('list.sort.title')],
  ];

  const items = res.docs;
  const clearHref = base;

  // Clean description string to prevent duplicated count if passed from topics.auto
  const cleanDescription = (description || '')
    .replace(/\s*\(\d+\s*مادة\)\.?/, '')
    .replace(/\s*\(\d+\s*items\)\.?/, '')
    .replace(/\s*\(\d+\s*materials\)\.?/, '')
    .trim();
  const displayLead =
    cleanDescription ||
    (isAr
      ? `مقالات ودراسات «${node.name}» في أرشيف المركز.`
      : `Articles and studies of "${node.name}" in the Center archive.`);
  const finalLead = displayLead.endsWith('.') ? displayLead : `${displayLead}.`;

  // Subcategory tabs: children with articles
  const kids = node.children.filter((c) => c.own > 0);

  // Pagination query dictionary
  const paginationQuery: Record<string, string | undefined> = {};
  if (q.q) paginationQuery.q = q.q;
  if (activeCategoryId) paginationQuery.category = String(activeCategoryId);
  if (q.year) paginationQuery.year = String(q.year);
  if (q.author) paginationQuery.author = String(q.author);
  if (q.sort) paginationQuery.sort = q.sort;

  const jsonLd = [
    collectionJsonLd({
      name: title,
      description,
      url: absolute(`/${lang.code}${basePath}`),
      lang: lang.tag,
      org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') },
      items: items.slice(0, 20).map((d) => ({
        name: d.title,
        url: absolute(`/${lang.code}/articles/${d.id}`),
      })),
      total: res.total,
    }),
    breadcrumbJsonLd([
      { name: t('nav.home'), url: absolute(`/${lang.code}`) },
      { name: t('topics.title'), url: absolute(`/${lang.code}/topics`) },
      ...(parent ? [{ name: parent.name, url: absolute(`/${lang.code}/topics/${parent.id}`) }] : []),
      { name: title, url: absolute(`/${lang.code}${basePath}`) },
    ]),
  ];

  return (
    <div className="research-page" dir="rtl">
      {/* ── Breadcrumbs & Hero ── */}
      <section className="research-hero">
        <div className="container">
          <nav className="research-breadcrumbs" aria-label={t('a11y.breadcrumb')}>
            <ol className="research-breadcrumbs__list">
              <li className="research-breadcrumbs__item">
                <Link href={href('/')}>{t('nav.home')}</Link>
              </li>
              <li className="research-breadcrumbs__sep" aria-hidden="true">
                <Icon name="arrow" />
              </li>
              <li className="research-breadcrumbs__item">
                <Link href={href('/topics')}>{t('topics.title')}</Link>
              </li>
              {parent ? (
                <>
                  <li className="research-breadcrumbs__sep" aria-hidden="true">
                    <Icon name="arrow" />
                  </li>
                  <li className="research-breadcrumbs__item">
                    <Link href={href(`/topics/${parent.id}`)}>{parent.name}</Link>
                  </li>
                </>
              ) : null}
              <li className="research-breadcrumbs__sep" aria-hidden="true">
                <Icon name="arrow" />
              </li>
              <li
                className="research-breadcrumbs__item research-breadcrumbs__item--current"
                aria-current="page"
              >
                {node.name}
              </li>
            </ol>
          </nav>

          <div className="research-hero__header">
            <h1 className="research-hero__title">{title}</h1>
            <div className="research-hero__gold-line" aria-hidden="true" />
            <p className="research-hero__lead">
              <span>{finalLead}</span>
              <span className="research-hero__count-badge">
                {isAr ? `${node.total} مادة` : `${node.total} materials`}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <div className="container research-content-wrap">
        {/* Mobile filter toggle */}
        <div className="research-mobile-bar">
          <FiltersToggle label={t('list.filters')} count={userActive.length} />
          <span className="research-mobile-bar__count">
            {isAr ? `${res.total} نتيجة` : `${res.total} results`}
          </span>
        </div>

        <div className="research-layout">
          {/* ── Sidebar Filters ── */}
          <aside className="research-sidebar filters" id="filters" tabIndex={-1} aria-label={t('list.filters')}>
            <div className="research-sidebar__head">
              <h2 className="research-sidebar__title">
                <Icon name="sliders" />
                <span>{isAr ? 'تصفية النتائج' : t('list.filters')}</span>
                {userActive.length ? (
                  <span className="research-sidebar__badge">{userActive.length}</span>
                ) : null}
              </h2>
              {userActive.length ? (
                <Link href={clearHref} className="research-sidebar__clear">
                  {isAr ? 'إعادة تعيين' : t('list.clear')}
                </Link>
              ) : null}
              <FiltersClose label={t('nav.close')} />
            </div>

            <form id="filter-form" className="research-sidebar__form" method="get" action={base}>
              {/* Retain current search query and category if set */}
              {q.q ? <input type="hidden" name="q" value={q.q} /> : null}
              {activeCategoryId ? <input type="hidden" name="category" value={activeCategoryId} /> : null}

              {/* Year Filter */}
              <div className="research-filter-box">
                <h3 className="research-filter-box__title">{t('list.year')}</h3>
                <div className="research-filter-box__list">
                  <label className={`research-check-row ${!q.year ? 'is-selected' : ''}`}>
                    <input type="radio" name="year" value="" defaultChecked={!q.year} />
                    <span className="research-check-row__radio" aria-hidden="true" />
                    <span className="research-check-row__label">{t('list.all')}</span>
                    <span className="research-check-row__count">{node.total}</span>
                  </label>
                  {years.map(([yr, count]) => {
                    const isSel = q.year === yr;
                    return (
                      <label key={yr} className={`research-check-row ${isSel ? 'is-selected' : ''}`}>
                        <input type="radio" name="year" value={yr} defaultChecked={isSel} />
                        <span className="research-check-row__radio" aria-hidden="true" />
                        <span className="research-check-row__label">{yr}</span>
                        <span className="research-check-row__count">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="research-filter-divider" />

              {/* Author Filter */}
              <div className="research-filter-box facet">
                <h3 className="research-filter-box__title">{t('list.author')}</h3>
                <FacetFind
                  label={isAr ? 'ابحث عن كاتب...' : 'Find author...'}
                  none={isAr ? 'لا يوجد كاتب مطابق' : 'No matching author'}
                />
                <div className="research-filter-box__list facet__list facet__list--tall">
                  <label className={`research-check-row check ${!q.author ? 'is-selected' : ''}`}>
                    <input type="radio" name="author" value="" defaultChecked={!q.author} />
                    <span className="research-check-row__radio" aria-hidden="true" />
                    <span className="research-check-row__label">{t('list.all')}</span>
                    <span className="research-check-row__count">{node.total}</span>
                  </label>
                  {authorOptions.map((a) => {
                    const isSel = q.author === a.id;
                    return (
                      <label key={a.id} className={`research-check-row check ${isSel ? 'is-selected' : ''}`}>
                        <input type="radio" name="author" value={a.id} defaultChecked={isSel} />
                        <span className="research-check-row__radio" aria-hidden="true" />
                        <span className="research-check-row__label">{a.name}</span>
                        <span className="research-check-row__count">{a.n}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {userActive.length ? (
                <div className="research-filter-actions">
                  <Link href={clearHref} className="research-filter-reset-btn">
                    <Icon name="close" />
                    <span>{isAr ? 'إعادة تعيين الفلاتر' : 'Reset filters'}</span>
                  </Link>
                </div>
              ) : null}
            </form>
          </aside>

          {/* Modal Scrim for mobile filter sheet */}
          <div className="filters-scrim" aria-hidden="true" />

          {/* ── Main Results Column ── */}
          <main className="research-main">
            {/* Search Inside Section */}
            <form className="research-search" method="get" action={base}>
              {activeCategoryId ? <input type="hidden" name="category" value={activeCategoryId} /> : null}
              {q.year ? <input type="hidden" name="year" value={q.year} /> : null}
              {q.author ? <input type="hidden" name="author" value={q.author} /> : null}
              {q.sort ? <input type="hidden" name="sort" value={q.sort} /> : null}

              <div className="research-search__input-wrap">
                <Icon name="search" className="research-search__icon" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q.q ?? ''}
                  className="research-search__input"
                  placeholder={isAr ? 'بحث داخل القسم...' : 'Search inside section...'}
                  aria-label={isAr ? 'بحث داخل القسم' : 'Search inside section'}
                />
                {q.q ? (
                  <Link
                    href={link({ q: undefined })}
                    className="research-search__clear"
                    aria-label={t('list.clear')}
                  >
                    <Icon name="close" />
                  </Link>
                ) : null}
              </div>
              <button type="submit" className="research-search__btn">
                <Icon name="search" />
                <span>{t('home.search.submit')}</span>
              </button>
            </form>

            {/* Subcategories Tabs */}
            {kids.length > 0 ? (
              <div className="research-tabs-wrapper">
                <nav className="research-tabs" aria-label={t('topics.sub')}>
                  <Link
                    href={link({ category: undefined })}
                    className={`research-tab ${!activeCategoryId ? 'is-active' : ''}`}
                  >
                    <span>{t('list.all')}</span>
                    <span className="research-tab__count">{node.total}</span>
                  </Link>
                  {kids.map((c) => {
                    const isActive = activeCategoryId === c.id;
                    return (
                      <Link
                        key={c.id}
                        href={link({ category: c.id })}
                        className={`research-tab ${isActive ? 'is-active' : ''}`}
                      >
                        <span>{c.name}</span>
                        <span className="research-tab__count">{c.own}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ) : null}

            {/* Results Summary and Sorting Bar */}
            <div className="research-results-bar">
              <div className="research-results-bar__summary">
                {selectedAuthorName ? (
                  <span className="research-results-bar__author-tag">
                    <Icon name="users" />
                    <span>{selectedAuthorName}</span>
                    <Link href={link({ author: undefined })} aria-label={t('list.clear')}>
                      <Icon name="close" />
                    </Link>
                  </span>
                ) : (
                  <span className="research-results-bar__author-all">
                    <Icon name="users" />
                    <span>{isAr ? 'كل الكتّاب' : 'All Authors'}</span>
                  </span>
                )}
                <span className="research-results-bar__count">
                  {isAr ? `عرض ${res.total} نتيجة` : `Showing ${res.total} results`}
                </span>
                <span className="research-results-bar__total">
                  {isAr ? `(بحث ${res.total} من ${res.all} نتيجة)` : `(searching ${res.total} of ${res.all} results)`}
                </span>
              </div>

              <div className="research-results-bar__sort">
                <label htmlFor="research-sort-select" className="research-results-bar__sort-label">
                  <Icon name="sliders" />
                  <span>{t('list.sort')}</span>
                </label>
                <select
                  id="research-sort-select"
                  form="filter-form"
                  name="sort"
                  defaultValue={sort}
                  className="research-results-bar__sort-select"
                >
                  {sortOptions.map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Articles List */}
            <div className="research-articles-list">
              {items.length === 0 ? (
                <div className="research-empty">
                  <div className="research-empty__icon-wrap">
                    <Icon name="file" />
                  </div>
                  <h3 className="research-empty__title">{t('list.empty')}</h3>
                  <p className="research-empty__text">
                    {isAr
                      ? 'لا توجد نتائج تطابق معايير البحث الحالية. جرّب تعديل الكلمات المفتاحية أو إزالة بعض الفلاتر.'
                      : 'No research materials match your criteria. Try adjusting your filters.'}
                  </p>
                  {userActive.length ? (
                    <Link href={clearHref} className="btn btn--primary btn--sm">
                      {isAr ? 'إعادة تعيين الفلاتر' : 'Reset filters'}
                    </Link>
                  ) : null}
                </div>
              ) : (
                items.map((doc: Doc) => {
                  const articleUrl = docHref(ctx, 'article', doc.id);
                  const authors = authorsOf(doc);
                  const authorNames = authors.map((a) => a.name).join('، ');
                  const pubDate = displayDate(doc, lang.code);
                  const excerpt = stripReferenceLine(doc.excerpt);
                  const catName =
                    doc.category && typeof doc.category === 'object'
                      ? (doc.category as { name: string }).name
                      : '';
                  const issueNumber =
                    doc.magazine && typeof doc.magazine === 'object' && doc.magazine.issueNumber
                      ? doc.magazine.issueNumber
                      : null;

                  return (
                    <article key={doc.id} className="research-article-card">
                      <div className="research-article-card__header">
                        {catName ? (
                          <span className="research-article-card__category-badge">
                            {catName}
                          </span>
                        ) : null}
                        {issueNumber ? (
                          <span className="research-article-card__issue-badge">
                            {isAr ? `العدد ${issueNumber}` : `Issue ${issueNumber}`}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="research-article-card__title">
                        <Link href={articleUrl}>{doc.title}</Link>
                      </h2>

                      {excerpt ? (
                        <p className="research-article-card__excerpt">{excerpt}</p>
                      ) : null}

                      <div className="research-article-card__footer">
                        <div className="research-article-card__meta">
                          {authorNames ? (
                            <span className="research-article-card__author">
                              <Icon name="users" className="research-article-card__meta-icon" />
                              <span>{authorNames}</span>
                            </span>
                          ) : null}
                          {pubDate ? (
                            <span className="research-article-card__date">
                              <Icon name="calendar" className="research-article-card__meta-icon" />
                              <time>{pubDate}</time>
                            </span>
                          ) : null}
                        </div>

                        <Link href={articleUrl} className="research-article-card__read-link">
                          <span>{isAr ? 'قراءة البحث' : 'Read Article'}</span>
                          <Icon name="arrow" className="research-article-card__read-arrow" />
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="research-pagination-wrap">
              <Pagination
                ctx={ctx}
                page={res.page}
                pages={res.pages}
                basePath={basePath}
                query={paginationQuery}
              />
            </div>
          </main>
        </div>
      </div>

      <FilterBehavior formId="filter-form" />
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
