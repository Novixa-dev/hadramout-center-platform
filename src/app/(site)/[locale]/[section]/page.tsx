import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { typeFromRoute, type ContentType } from '../../../../lib/content-types.ts';
import { getPage, listCategories, listDocs, trInfo, yearsFor, type SortKey } from '../../../../lib/data.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { StaticPage, readyLangsOf } from '../../../../components/StaticPage.tsx';
import { buildMetadata } from '../../../../lib/seo.ts';
import { Card, EventCard } from '../../../../components/Cards.tsx';
import { Pagination } from '../../../../components/Pagination.tsx';

type Props = { params: Promise<{ locale: string; section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TITLE_KEY: Record<ContentType, string> = {
  news: 'news.title', article: 'articles.title', book: 'books.title', magazine: 'magazines.title', event: 'events.title', forum: 'forum.title', video: 'videos.title',
};
const LEAD_KEY: Partial<Record<ContentType, string>> = { article: 'articles.lead', book: 'books.lead', magazine: 'magazines.lead', forum: 'forum.intro' };
const PER_PAGE: Record<ContentType, number> = { news: 12, article: 18, book: 12, magazine: 12, event: 12, forum: 12, video: 12 };

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined): number | undefined => {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, section } = await params;
  const info = typeFromRoute(section);
  if (!isLocale(locale)) return {};
  if (!info) {
    const page = await getPage(section, locale);
    if (!page) return {};
    const pctx = makeCtx(locale);
    return buildMetadata({ ctx: pctx, path: `/${section}`, title: page.title, description: htmlToText(page.body ?? '').slice(0, 200), readyLangs: readyLangsOf(page as never), incomplete: locale !== 'ar' && trInfo(page as never, locale).status !== 'complete' });
  }
  const ctx = makeCtx(locale);
  const sp = await searchParams;
  return buildMetadata({ ctx, path: `/${section}`, title: ctx.t(TITLE_KEY[info.type]), description: LEAD_KEY[info.type] ? ctx.t(LEAD_KEY[info.type] as string) : undefined, noindex: Boolean(sp.page && Number(sp.page) > 1) || Object.keys(sp).some((k) => k !== 'page') });
}

export default async function SectionPage({ params, searchParams }: Props) {
  const { locale, section } = await params;
  const info = typeFromRoute(section);
  if (!isLocale(locale)) notFound();
  if (!info) return <StaticPage locale={locale} slug={section} />;
  const type = info.type;
  const ctx = makeCtx(locale);
  const { t, href } = ctx;
  const sp = await searchParams;
  const page = num(sp.page) ?? 1;
  const year = num(sp.year);
  const categoryId = num(sp.category);
  const sort = (['newest', 'oldest', 'title'] as const).includes(one(sp.sort) as SortKey) ? (one(sp.sort) as SortKey) : undefined;
  const when = type === 'event' || type === 'forum' ? (one(sp.when) === 'upcoming' ? 'upcoming' : one(sp.when) === 'past' ? 'past' : undefined) : undefined;

  const hasCategories = type === 'article' || type === 'book';
  const [result, years, categories] = await Promise.all([
    listDocs({ type, lang: locale, page, limit: PER_PAGE[type], year, categoryId, sort, when }),
    type === 'magazine' ? Promise.resolve([]) : yearsFor(type),
    hasCategories ? listCategories(locale, type === 'article' ? 'article' : 'book') : Promise.resolve([]),
  ]);

  const query = { year: year ? String(year) : undefined, category: categoryId ? String(categoryId) : undefined, sort, when };
  const filtered = Boolean(year || categoryId || sort || when);
  const isEvent = type === 'event' || type === 'forum';
  const lead = LEAD_KEY[type] ? t(LEAD_KEY[type] as string) : null;

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t(TITLE_KEY[type])}</h1>
          {lead ? <p>{lead}</p> : null}
        </div>
      </div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-6)' }}>
        <form className="filters" method="get" action={href(`/${section}`)}>
          {years.length ? (
            <div className="field">
              <label htmlFor="f-year">{t('list.year')}</label>
              <select id="f-year" name="year" className="select" defaultValue={year ? String(year) : ''}>
                <option value="">{t('list.all')}</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          ) : null}
          {categories.length ? (
            <div className="field">
              <label htmlFor="f-cat">{t('list.category')}</label>
              <select id="f-cat" name="category" className="select" defaultValue={categoryId ? String(categoryId) : ''}>
                <option value="">{t('list.all')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : null}
          {type !== 'magazine' ? (
            <div className="field">
              <label htmlFor="f-sort">{t('list.sort')}</label>
              <select id="f-sort" name="sort" className="select" defaultValue={sort ?? ''}>
                <option value="">{t('list.sort.newest')}</option>
                <option value="oldest">{t('list.sort.oldest')}</option>
                <option value="title">{t('list.sort.title')}</option>
              </select>
            </div>
          ) : null}
          {isEvent ? (
            <div className="field">
              <label htmlFor="f-when">{t('meta.date')}</label>
              <select id="f-when" name="when" className="select" defaultValue={when ?? ''}>
                <option value="">{t('list.all')}</option>
                <option value="upcoming">{t('list.upcoming')}</option>
                <option value="past">{t('list.past')}</option>
              </select>
            </div>
          ) : null}
          {(years.length || categories.length || type !== 'magazine' || isEvent) ? <button className="btn btn--secondary" type="submit">{t('list.filters')}</button> : null}
          {filtered ? <Link className="btn btn--ghost" href={href(`/${section}`)}>{t('list.clear')}</Link> : null}
        </form>

        <h2 className="result-count" aria-live="polite" style={{ fontSize: 'var(--step-0)', fontWeight: 400 }}>{t('list.count', { count: result.total })}</h2>
        {result.docs.length === 0 ? (
          <p className="notice">{t('list.empty')}</p>
        ) : isEvent ? (
          <div className="grid grid--wide">{result.docs.map((d) => <EventCard key={d.id} ctx={ctx} doc={d} type={type as 'event' | 'forum'} />)}</div>
        ) : (
          <div className={`grid ${type === 'book' || type === 'magazine' ? 'grid--books' : ''}`}>
            {result.docs.map((d, i) => <Card key={d.id} ctx={ctx} doc={d} type={type} eager={i < 3 && page === 1} />)}
          </div>
        )}
        <Pagination ctx={ctx} page={result.page} pages={result.pages} basePath={`/${section}`} query={query} />
      </div>
    </>
  );
}
