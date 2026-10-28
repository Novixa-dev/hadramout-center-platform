import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Ctx } from '../lib/ctx.ts';
import { absolute } from '../lib/ctx.ts';
import { CONTENT, type ContentType } from '../lib/content-types.ts';
import { getSite } from '../lib/data.ts';
import { queryArchive } from '../lib/facets.ts';
import type { TopicNode } from '../lib/facet-core.ts';
import { FACETS, VIEWS, activeFilters, effectiveSort, parseListQuery, perPage, queryParams, sidebarFacets, toSearch, type FacetName, type ListQuery, type View } from '../lib/list-query.ts';
import { breadcrumbJsonLd, collectionJsonLd, jsonLdString } from '../lib/jsonld.ts';
import { BookCard, BookRow, EventRow, EntryList, IssueCard, Tile, VideoTile } from './Cards.tsx';
import { Pagination } from './Pagination.tsx';
import { Icon } from './Icon.tsx';
import { FacetFind, FilterBehavior, FiltersClose, FiltersToggle } from './client/FilterControls.tsx';

type Raw = Record<string, string | string[] | undefined>;

interface Props {
  ctx: Ctx;
  type: ContentType;
  /** path without language prefix used for form action and pagination, e.g. "/articles" or "/topics/13" */
  basePath: string;
  searchParams: Raw;
  /** filters fixed by the page itself (topic landing pages) */
  fixed?: { category?: number };
  /** facets not to offer */
  hide?: FacetName[];
  title: string;
  crumbs: { name: string; path: string }[];
  description?: string;
}

const TOP_AUTHORS = 40;
/** a facet list longer than this gets its own find-as-you-type box */
const FIND_FROM = 8;

function TopicFacet({ ctx, roots, counts, selected }: { ctx: Ctx; roots: TopicNode[]; counts: Map<number, number>; selected?: number }) {
  const { t } = ctx;
  const nodes = roots
    .map((r) => {
      const kids = r.children.map((c) => ({ ...c, n: counts.get(c.id) ?? 0 })).filter((c) => c.n > 0 || c.id === selected);
      const own = counts.get(r.id) ?? 0;
      const total = own + kids.reduce((s, c) => s + c.n, 0);
      return { r, kids, total, own };
    })
    .filter((x) => x.total > 0 || x.r.id === selected);
  return (
    <details className="facet" open>
      <summary>{t('list.topic')}</summary>
      <div className="facet__list facet__list--tall">
        <label className="check">
          <input type="radio" name="category" value="" defaultChecked={!selected} />
          <span>{t('list.all')}</span>
        </label>
        {nodes.map(({ r, kids, total }) => (
          <details key={r.id} className="tree-parent" open={selected === r.id || kids.some((c) => c.id === selected)}>
            <summary>
              <label className="check">
                <input type="radio" name="category" value={r.id} defaultChecked={selected === r.id} />
                <span dir="auto">{r.name}</span>
                <span className="count">{total}</span>
              </label>
            </summary>
            {kids.length ? (
              <div className="tree-children">
                {kids.map((c) => (
                  <label key={c.id} className="check">
                    <input type="radio" name="category" value={c.id} defaultChecked={selected === c.id} />
                    <span dir="auto">{c.name}</span>
                    <span className="count">{c.n}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </details>
        ))}
      </div>
    </details>
  );
}

export async function Listing({ ctx, type, basePath, searchParams, fixed, hide = [], title, crumbs, description }: Props) {
  const { t, href, lang } = ctx;
  const info = CONTENT[type];
  const parsed: ListQuery = parseListQuery(searchParams, type);
  const q: ListQuery = fixed?.category ? { ...parsed, category: fixed.category } : parsed;
  const facets = FACETS[type].filter((f) => !hide.includes(f));
  const views = VIEWS[type];
  const sort = effectiveSort(q);
  const limit = perPage(type, q.view);
  const res = await queryArchive({ type, lang: lang.code, q: q.q, year: q.year, category: q.category, author: q.author, pdf: q.pdf, when: q.when, sort, page: q.page, limit });
  // a page beyond the last one does not exist: 404 instead of serving the last page again under an endless set of URLs
  if (q.page > res.pages) notFound();
  const site = await getSite(lang.code);

  const base = href(basePath);
  // a topic landing page carries its category in the path, never in the query string
  const params = (patch: Partial<Record<keyof ListQuery, unknown>>) => {
    const p = queryParams(q, type, { page: 1, ...patch });
    if (fixed?.category) delete p.category;
    return p;
  };
  const link = (patch: Partial<Record<keyof ListQuery, unknown>>) => `${base}${toSearch(params(patch))}`;
  // filters the visitor chose (a fixed topic is part of the page, not a removable chip)
  const userActive = activeFilters(parsed).filter((f) => !(fixed?.category && f === 'topic'));
  const sidebar = sidebarFacets(facets);
  const hasFacets = sidebar.length > 0;
  const hasSearch = facets.includes('q');
  const topics = res.topics;
  const counts = res.counts;

  const chips: { key: string; label: string; remove: string }[] = [];
  if (q.q && userActive.includes('q')) chips.push({ key: 'q', label: t('list.chip.q', { v: q.q }), remove: link({ q: undefined }) });
  if (q.category && userActive.includes('topic')) chips.push({ key: 'topic', label: t('list.chip.topic', { v: topics?.byId.get(q.category)?.name ?? String(q.category) }), remove: link({ category: undefined }) });
  if (q.year) chips.push({ key: 'year', label: t('list.chip.year', { v: q.year }), remove: link({ year: undefined }) });
  if (q.author) chips.push({ key: 'author', label: t('list.chip.author', { v: res.authorNames.get(q.author) ?? String(q.author) }), remove: link({ author: undefined }) });
  if (q.pdf) chips.push({ key: 'pdf', label: t('list.pdfOnly'), remove: link({ pdf: undefined }) });
  if (q.when) chips.push({ key: 'when', label: q.when === 'upcoming' ? t('list.upcoming') : t('list.past'), remove: link({ when: undefined }) });

  // author facet: the most prolific authors in the current result set (+ the chosen one)
  const authorOptions = [...counts.authors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_AUTHORS)
    .map(([id, n]) => ({ id, n, name: res.authorNames.get(id) ?? '' }))
    .filter((a) => a.name);
  if (q.author && !authorOptions.some((a) => a.id === q.author) && res.authorNames.get(q.author)) authorOptions.push({ id: q.author, n: counts.authors.get(q.author) ?? 0, name: res.authorNames.get(q.author) as string });
  const years = [...counts.years.entries()].sort((a, b) => b[0] - a[0]);

  const sortOptions: [string, string][] = [
    ...(q.q ? ([['relevance', t('list.sort.relevance')]] as [string, string][]) : []),
    ['newest', t('list.sort.newest')],
    ['oldest', t('list.sort.oldest')],
    ['title', t('list.sort.title')],
  ];

  const items = res.docs;
  const gridClass = type === 'book' || type === 'magazine' ? 'results-grid results-grid--books' : 'results-grid';
  const clearHref = base;
  const jsonLd = [
    collectionJsonLd({
      name: title,
      description,
      url: absolute(`/${lang.code}${basePath}`),
      lang: lang.tag,
      org: { name: site.name, origin: absolute(''), logo: absolute('/icons/icon-512.png') },
      items: items.slice(0, 20).map((d) => ({ name: d.title, url: absolute(`/${lang.code}/${info.route}/${d.id}`) })),
      total: res.total,
    }),
    breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, ...crumbs.map((c) => ({ name: c.name, url: absolute(`/${lang.code}${c.path}`) })), { name: title, url: absolute(`/${lang.code}${basePath}`) }]),
  ];
  const showCount = res.total === res.all ? t('list.count', { count: res.total }) : t('list.count.of', { count: res.total, all: res.all });

  return (
    <>
      <div className={`container listing ${hasFacets ? '' : 'listing--plain'}`} data-aos="fade-up">
        {hasFacets ? (
          <>
            <aside className="filters" id="filters" tabIndex={-1} aria-label={t('list.filters')}>
              <div className="filters__head">
                <h2>{t('list.filters')}{userActive.length ? <span className="badge" aria-label={t('list.active')}>{userActive.length}</span> : null}</h2>
                {userActive.length ? <Link className="filters__reset" href={clearHref}>{t('list.clear')}</Link> : null}
                <FiltersClose label={t('nav.close')} />
              </div>
              <form id="filter-form" className="filters__form" method="get" action={base}>
                {q.view !== views[0] ? <input type="hidden" name="view" value={q.view} /> : null}
                {facets.includes('when') ? (
                  <details className="facet" open>
                    <summary>{t('meta.date')}</summary>
                    <div className="facet__list">
                      <label className="check"><input type="radio" name="when" value="" defaultChecked={!q.when} /><span>{t('list.all')}</span></label>
                      <label className="check"><input type="radio" name="when" value="upcoming" defaultChecked={q.when === 'upcoming'} disabled={!counts.upcoming && q.when !== 'upcoming'} /><span>{t('list.upcoming')}</span><span className="count">{counts.upcoming}</span></label>
                      <label className="check"><input type="radio" name="when" value="past" defaultChecked={q.when === 'past'} disabled={!counts.past && q.when !== 'past'} /><span>{t('list.past')}</span><span className="count">{counts.past}</span></label>
                    </div>
                  </details>
                ) : null}
                {facets.includes('topic') && topics ? <TopicFacet ctx={ctx} roots={topics.roots} counts={counts.categories} selected={q.category} /> : null}
                {facets.includes('year') && years.length ? (
                  <details className="facet" open={Boolean(q.year) || years.length <= 14}>
                    <summary>{t('list.year')}</summary>
                    <div className="facet__list">
                      <label className="check"><input type="radio" name="year" value="" defaultChecked={!q.year} /><span>{t('list.all')}</span></label>
                      {years.map(([y, n]) => (
                        <label key={y} className="check"><input type="radio" name="year" value={y} defaultChecked={q.year === y} /><span>{y}</span><span className="count">{n}</span></label>
                      ))}
                    </div>
                  </details>
                ) : null}
                {facets.includes('author') && authorOptions.length ? (
                  <details className="facet" open={Boolean(q.author)}>
                    <summary>{t('list.author')}</summary>
                    {authorOptions.length > FIND_FROM ? <FacetFind label={t('list.facet.find')} none={t('list.facet.none')} /> : null}
                    <div className="facet__list">
                      <label className="check"><input type="radio" name="author" value="" defaultChecked={!q.author} /><span>{t('list.all')}</span></label>
                      {authorOptions.map((a) => (
                        <label key={a.id} className="check"><input type="radio" name="author" value={a.id} defaultChecked={q.author === a.id} /><span dir="auto">{a.name}</span><span className="count">{a.n}</span></label>
                      ))}
                    </div>
                    <p style={{ marginBlockStart: '0.4rem' }}><Link className="link-arrow" href={href('/authors')}>{t('list.allAuthors')} <Icon name="arrow" /></Link></p>
                  </details>
                ) : null}
                {facets.includes('pdf') && (counts.pdf > 0 || q.pdf) ? (
                  <details className="facet" open>
                    <summary>{t('list.availability')}</summary>
                    <div className="facet__list">
                      <label className="check"><input type="checkbox" name="pdf" value="1" defaultChecked={Boolean(q.pdf)} /><span>{t('list.pdfOnly')}</span><span className="count">{counts.pdf}</span></label>
                    </div>
                  </details>
                ) : null}
                <div className="filters__actions">
                  <button className="btn btn--primary" type="submit">{t('list.apply', { count: res.total })}</button>
                  {userActive.length ? <Link className="btn btn--ghost" href={clearHref}>{t('list.clear')}</Link> : null}
                </div>
              </form>
            </aside>
            <div className="filters-scrim" aria-hidden="true" />
          </>
        ) : hasSearch ? (
          // sections without a sidebar still get the search bar and the sort menu: they submit this (hidden) form through their form attribute
          <form id="filter-form" method="get" action={base} hidden>
            {q.view !== views[0] ? <input type="hidden" name="view" value={q.view} /> : null}
          </form>
        ) : null}

        <section aria-labelledby="results-h" className="results">
          {hasSearch ? (
            <div className="list-search" role="search">
              <div className="list-search__field">
                <Icon name="search" className="icon list-search__icon" />
                <label className="sr-only" htmlFor="list-q">{t('list.search')}</label>
                <input id="list-q" form="filter-form" className="input" type="search" name="q" defaultValue={q.q ?? ''} placeholder={t('list.search.in', { section: title })} autoComplete="off" enterKeyHint="search" />
                {q.q ? <Link className="list-search__clear" href={link({ q: undefined })} aria-label={t('list.search.clear')}><Icon name="close" /></Link> : null}
              </div>
              <button className="btn btn--primary" type="submit" form="filter-form">{t('nav.search')}</button>
            </div>
          ) : null}
          <div className="toolbar">
            <div className="cluster" style={{ '--gap': '0.6rem' } as React.CSSProperties}>
              {hasFacets ? <FiltersToggle label={t('list.filters')} count={userActive.length} /> : null}
              <h2 id="results-h" className="toolbar__count" aria-live="polite" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--step--1)' }}>{showCount}</h2>
            </div>
            <div className="toolbar__tools">
              {(hasFacets || hasSearch) && (type !== 'video' || q.q) ? (
                <>
                  <label className="sr-only" htmlFor="sort">{t('list.sort')}</label>
                  <select id="sort" name="sort" form="filter-form" className="select" defaultValue={sort} data-default={q.q ? 'relevance' : q.when === 'upcoming' ? 'oldest' : 'newest'}>
                    {sortOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </>
              ) : null}
              {views.length > 1 ? (
                <nav className="seg" aria-label={t('list.view')}>
                  {views.map((v: View) => (
                    <Link key={v} href={link({ view: v })} aria-current={q.view === v ? 'true' : undefined} aria-label={t(`list.view.${v}`)} title={t(`list.view.${v}`)}>
                      <Icon name={v === 'grid' ? 'grid' : 'list'} />
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
          </div>

          {chips.length ? (
            <ul className="chips active-filters" aria-label={t('list.active')}>
              {chips.map((c) => (
                <li key={c.key}>
                  <Link className="chip chip--lg chip--gold chip--remove" href={c.remove} aria-label={`${t('list.remove')}: ${c.label}`}>
                    {c.label} <Icon name="close" />
                  </Link>
                </li>
              ))}
              <li><Link className="btn btn--ghost btn--sm" href={clearHref}>{t('list.clear')}</Link></li>
            </ul>
          ) : null}

          {items.length === 0 ? (
            <div className="empty" role="status" style={{ marginBlockStart: '1.5rem' }}>
              <Icon name="search" />
              <h3>{t('list.empty')}</h3>
              <p>{userActive.length ? t('list.empty.filters') : t('list.empty.none')}</p>
              {userActive.length ? <Link className="btn btn--primary btn--sm" href={clearHref}>{t('list.clear')}</Link> : null}
            </div>
          ) : type === 'article' ? (
            <EntryList ctx={ctx} docs={items} type="article" compact={q.view === 'compact'} />
          ) : type === 'event' || type === 'forum' ? (
            <div className="event-list">{items.map((d) => <EventRow key={d.id} ctx={ctx} doc={d} type={type} />)}</div>
          ) : type === 'book' && q.view === 'list' ? (
            <div className="stack-list book-rows" style={{ marginBlockStart: '1rem' }}>{items.map((d, i) => <BookRow key={d.id} ctx={ctx} doc={d} eager={i < 3 && q.page === 1} />)}</div>
          ) : type === 'news' && q.view === 'list' ? (
            <div className="stack-list" style={{ marginBlockStart: '1rem' }}>{items.map((d, i) => <Tile key={d.id} ctx={ctx} doc={d} type="news" row eager={i < 2 && q.page === 1} />)}</div>
          ) : (
            <div className={gridClass}>
              {items.map((d, i) => {
                const eager = i < 4 && q.page === 1;
                return type === 'book' ? <BookCard key={d.id} ctx={ctx} doc={d} eager={eager} /> : type === 'magazine' ? <IssueCard key={d.id} ctx={ctx} doc={d} eager={eager} /> : type === 'video' ? <VideoTile key={d.id} ctx={ctx} doc={d} /> : <Tile key={d.id} ctx={ctx} doc={d} type={type} eager={eager} />;
              })}
            </div>
          )}
          <Pagination ctx={ctx} page={res.page} pages={res.pages} basePath={basePath} query={params({})} />
        </section>
        {hasFacets || hasSearch ? <FilterBehavior formId="filter-form" /> : null}
      </div>
      {hasFacets ? <noscript><style>{'.filters{position:static!important;transform:none!important;visibility:visible!important}.filters-toggle,.filters__close{display:none!important}'}</style></noscript> : null}
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(j) }} />)}
    </>
  );
}

