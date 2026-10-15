import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx, docHref } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { snippetFor } from '../../../../db/search.ts';
import { COLLECTION_SLUGS, typeFromSlug, type CollectionSlug } from '../../../../lib/content-types.ts';
import { recordSearch, runSearch } from '../../../../lib/search-page.ts';
import { getTopics } from '../../../../lib/facets.ts';
import type { Sort } from '../../../../lib/facet-core.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Pagination } from '../../../../components/Pagination.tsx';
import { SearchBox } from '../../../../components/client/SearchBox.tsx';
import { FilterBehavior, FiltersClose, FiltersToggle } from '../../../../components/client/FilterControls.tsx';
import { searchLabels } from '../../../../components/Shell.tsx';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const posInt = (v: string) => (/^\d{1,9}$/.test(v) && Number(v) > 0 ? Number(v) : undefined);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/search', title: ctx.t('search.title'), description: ctx.t('search.hint'), card: { key: 'search' }, noindex: true });
}

function Highlighted({ text, q }: { text: string; q: string }) {
  const s = snippetFor(text, q);
  return (
    <p dir="auto">
      {s.before ? '… ' : ''}
      {s.words.map((w, i) => <span key={i}>{s.marks.has(i) ? <mark>{w}</mark> : w}{' '}</span>)}
      {s.after ? '…' : ''}
    </p>
  );
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const sp = await searchParams;
  const q = one(sp.q).replace(/\s+/g, ' ').trim().slice(0, 120);
  const kindRaw = one(sp.type);
  const kind = (COLLECTION_SLUGS as readonly string[]).includes(kindRaw) ? (kindRaw as CollectionSlug) : undefined;
  const year = posInt(one(sp.year));
  const author = posInt(one(sp.author));
  const sortRaw = one(sp.sort);
  const sort: Sort = sortRaw === 'newest' || sortRaw === 'oldest' ? sortRaw : 'relevance';
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = q ? await runSearch({ q, lang: locale, kind, year, author, sort, page }) : null;
  if (result) recordSearch(q, result.total);
  const topics = result && result.total === 0 ? await getTopics(locale) : null;

  const allKinds = result ? Object.values(result.kindCounts).reduce((a, b) => a + b, 0) : 0;
  const years = result ? [...result.counts.years.entries()].sort((a, b) => b[0] - a[0]) : [];
  const authorOptions = result
    ? [...result.counts.authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({ id, n, name: result.authorNames.get(id) ?? '' })).filter((a) => a.name)
    : [];
  if (result && author && !authorOptions.some((a) => a.id === author) && result.authorNames.get(author)) authorOptions.push({ id: author, n: result.counts.authors.get(author) ?? 0, name: result.authorNames.get(author) as string });

  const params2 = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const base: Record<string, string | undefined> = { q, type: kind, year: year ? String(year) : undefined, author: author ? String(author) : undefined, sort: sort !== 'relevance' ? sort : undefined, ...patch };
    for (const [k, v] of Object.entries(base)) if (v) u.set(k, v);
    const s = u.toString();
    return `${href('/search')}${s ? `?${s}` : ''}`;
  };
  const active = [kind, year, author].filter(Boolean).length;

  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('search.title') }]} title={t('search.title')}>
        <div style={{ marginBlockStart: '1rem', maxInlineSize: '44rem' }}>
          <SearchBox action={href('/search')} lang={locale} labels={searchLabels(ctx)} size="lg" defaultValue={q} />
          <p style={{ fontSize: 'var(--step--1)', color: 'var(--muted)', marginBlockStart: '0.6rem' }}>{t('search.hint')}</p>
        </div>
      </PageHead>

      {!result ? (
        <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
          <div className="empty">
            <Icon name="search" />
            <h2 style={{ fontFamily: 'var(--font-ui)' }}>{t('search.start.title')}</h2>
            <p>{t('search.start.text')}</p>
            <ul className="chips" style={{ justifyContent: 'center' }}>
              {([['/articles', 'nav.articles'], ['/books', 'nav.books'], ['/magazines', 'nav.magazines'], ['/topics', 'nav.topics'], ['/authors', 'nav.authors']] as const).map(([path, key]) => (
                <li key={path}><Link className="chip chip--lg chip--outline" href={href(path)}>{t(key)}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="container listing">
          <aside className="filters" id="filters" tabIndex={-1} aria-label={t('list.filters')}>
            <div className="filters__head">
              <h2>{t('list.filters')}</h2>
              <FiltersClose label={t('nav.close')} />
            </div>
            <form id="filter-form" className="filters__form" method="get" action={href('/search')}>
              <input type="hidden" name="q" value={q} />
              {sort !== 'relevance' ? <input type="hidden" name="sort" value={sort} /> : null}
              <details className="facet" open>
                <summary>{t('search.type')}</summary>
                <div className="facet__list">
                  <label className="check"><input type="radio" name="type" value="" defaultChecked={!kind} /><span>{t('list.all')}</span><span className="count">{allKinds}</span></label>
                  {COLLECTION_SLUGS.filter((s) => (result.kindCounts[s] ?? 0) > 0 || s === kind).map((s) => (
                    <label key={s} className="check"><input type="radio" name="type" value={s} defaultChecked={kind === s} /><span>{t(`type.${s}`)}</span><span className="count">{result.kindCounts[s] ?? 0}</span></label>
                  ))}
                </div>
              </details>
              {years.length ? (
                <details className="facet" open={Boolean(year) || years.length <= 12}>
                  <summary>{t('list.year')}</summary>
                  <div className="facet__list">
                    <label className="check"><input type="radio" name="year" value="" defaultChecked={!year} /><span>{t('list.all')}</span></label>
                    {years.map(([y, n]) => <label key={y} className="check"><input type="radio" name="year" value={y} defaultChecked={year === y} /><span>{y}</span><span className="count">{n}</span></label>)}
                  </div>
                </details>
              ) : null}
              {authorOptions.length ? (
                <details className="facet" open={Boolean(author)}>
                  <summary>{t('list.author')}</summary>
                  <div className="facet__list">
                    <label className="check"><input type="radio" name="author" value="" defaultChecked={!author} /><span>{t('list.all')}</span></label>
                    {authorOptions.map((a) => <label key={a.id} className="check"><input type="radio" name="author" value={a.id} defaultChecked={author === a.id} /><span>{a.name}</span><span className="count">{a.n}</span></label>)}
                  </div>
                </details>
              ) : null}
              <div className="filters__actions">
                <button className="btn btn--primary" type="submit">{t('list.apply', { count: result.total })}</button>
                {active ? <Link className="btn btn--ghost" href={params2({ type: undefined, year: undefined, author: undefined })}>{t('list.clear')}</Link> : null}
              </div>
            </form>
          </aside>
          <div className="filters-scrim" aria-hidden="true" />

          <section className="results" aria-labelledby="results-h">
            <div className="toolbar">
              <div className="cluster" style={{ '--gap': '0.6rem' } as React.CSSProperties}>
                <FiltersToggle label={t('list.filters')} count={active} />
                <h2 id="results-h" className="toolbar__count" aria-live="polite" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--step--1)' }}>{result.total ? t('search.results', { count: result.total, q }) : t('search.none', { q })}</h2>
              </div>
              <div className="toolbar__tools">
                <label className="sr-only" htmlFor="sort">{t('list.sort')}</label>
                <select id="sort" name="sort" form="filter-form" className="select" defaultValue={sort} data-default="relevance">
                  <option value="relevance">{t('list.sort.relevance')}</option>
                  <option value="newest">{t('list.sort.newest')}</option>
                  <option value="oldest">{t('list.sort.oldest')}</option>
                </select>
              </div>
            </div>
            {active ? (
              <ul className="chips active-filters" aria-label={t('list.active')}>
                {kind ? <li><Link className="chip chip--lg chip--gold chip--remove" href={params2({ type: undefined })}>{t(`type.${kind}`)} <Icon name="close" /></Link></li> : null}
                {year ? <li><Link className="chip chip--lg chip--gold chip--remove" href={params2({ year: undefined })}>{t('list.chip.year', { v: year })} <Icon name="close" /></Link></li> : null}
                {author ? <li><Link className="chip chip--lg chip--gold chip--remove" href={params2({ author: undefined })}>{t('list.chip.author', { v: result.authorNames.get(author) ?? author })} <Icon name="close" /></Link></li> : null}
              </ul>
            ) : null}
            {result.usedLang !== locale ? <p className="notice notice--warn" style={{ marginBlockStart: '1rem' }}>{t('tr.missingNotice')}</p> : null}

            {result.items.length === 0 ? (
              <div className="empty" role="status" style={{ marginBlockStart: '1.5rem' }}>
                <Icon name="search" />
                <h3>{t('search.none.title')}</h3>
                <p>{t('search.none.tips')}</p>
                {active ? <Link className="btn btn--primary btn--sm" href={params2({ type: undefined, year: undefined, author: undefined })}>{t('list.clear')}</Link> : null}
                {result.popular.length ? (
                  <div>
                    <p style={{ fontWeight: 700, marginBlockEnd: '0.5rem' }}>{t('search.popular')}</p>
                    <ul className="chips" style={{ justifyContent: 'center' }}>{result.popular.map((p) => <li key={p}><Link className="chip chip--lg chip--outline" href={`${href('/search')}?q=${encodeURIComponent(p)}`}>{p}</Link></li>)}</ul>
                  </div>
                ) : null}
                {topics && topics.roots.length ? (
                  <div>
                    <p style={{ fontWeight: 700, marginBlockEnd: '0.5rem' }}>{t('search.browseTopics')}</p>
                    <ul className="chips" style={{ justifyContent: 'center' }}>{topics.roots.filter((r) => r.total > 0).slice(0, 8).map((r) => <li key={r.id}><Link className="chip chip--lg chip--outline" href={href(`/topics/${r.id}`)}>{r.name}</Link></li>)}</ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                {result.items.map(({ doc, kind: k }) => {
                  const info = typeFromSlug(k);
                  if (!info) return null;
                  const authorsText = (doc.authors ?? []).filter((a): a is { id: number; name: string } => typeof a === 'object').map((a) => a.name).join('، ');
                  return (
                    <article key={`${k}:${doc.id}`} className="hit">
                      <p className="kicker">{t(`type.${k}`)}{authorsText ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {authorsText}</span> : null}</p>
                      <h3><Link href={docHref(ctx, info.type, doc.id)}>{doc.title}</Link></h3>
                      <Highlighted text={htmlToText(doc.body ?? '') || doc.excerpt || ''} q={q} />
                    </article>
                  );
                })}
              </div>
            )}
            <Pagination ctx={ctx} page={result.page} pages={result.pages} basePath="/search" query={{ q, type: kind, year: year ? String(year) : undefined, author: author ? String(author) : undefined, sort: sort !== 'relevance' ? sort : undefined }} />
          </section>
          <FilterBehavior formId="filter-form" />
        </div>
      )}
    </>
  );
}
