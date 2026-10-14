import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, makeCtx, docHref } from '../../../../lib/ctx.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { extras } from '../../../../lib/extras.ts';
import { searchIndex, snippetFor } from '../../../../db/search.ts';
import { getDocsByIds, type Doc } from '../../../../lib/data.ts';
import { CONTENT, COLLECTION_SLUGS, typeFromSlug, type CollectionSlug } from '../../../../lib/content-types.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { Icon } from '../../../../components/Icon.tsx';
import { Pagination } from '../../../../components/Pagination.tsx';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const PER_PAGE = 15;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  return buildMetadata({ ctx, path: '/search', title: ctx.t('search.title'), noindex: true });
}

function Highlighted({ text, q }: { text: string; q: string }) {
  const s = snippetFor(text, q);
  return (
    <p style={{ color: 'var(--text-2)' }}>
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
  const q = one(sp.q).trim().slice(0, 120);
  const kind = (COLLECTION_SLUGS as readonly string[]).includes(one(sp.type)) ? one(sp.type) : '';
  const page = Math.max(1, Number(one(sp.page)) || 1);

  let total = 0;
  let items: { doc: Doc; kind: CollectionSlug }[] = [];
  let usedLang = locale;
  if (q) {
    const res = searchIndex(extras(), { q, lang: locale, kinds: kind ? [kind] : undefined, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
    total = res.total;
    usedLang = res.lang;
    const byKind = new Map<CollectionSlug, number[]>();
    for (const h of res.hits) byKind.set(h.kind as CollectionSlug, [...(byKind.get(h.kind as CollectionSlug) ?? []), h.id]);
    const loaded = new Map<string, Doc>();
    for (const [k, ids] of byKind) for (const d of await getDocsByIds(k, ids, locale)) loaded.set(`${k}:${d.id}`, d);
    items = res.hits.flatMap((h) => {
      const doc = loaded.get(`${h.kind}:${h.id}`);
      return doc ? [{ doc, kind: h.kind as CollectionSlug }] : [];
    });
    try {
      extras().run(
        "INSERT INTO search_queries (day, q, count, results) VALUES (date('now'), ?, 1, ?) ON CONFLICT(day, q) DO UPDATE SET count = count + 1, results = excluded.results",
        q.toLowerCase(),
        total,
      );
    } catch {
      /* statistics are best-effort */
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{t('search.title')}</h1>
          <form className="searchbox" role="search" action={href('/search')} style={{ marginBlockStart: '1rem', maxInlineSize: '40rem' }}>
            <Icon name="search" className="icon searchbox__icon" />
            <label className="sr-only" htmlFor="q">{t('search.title')}</label>
            <input id="q" className="input" type="search" name="q" defaultValue={q} placeholder={t('search.placeholder')} autoComplete="off" />
            {kind ? <input type="hidden" name="type" value={kind} /> : null}
          </form>
          <p style={{ fontSize: 'var(--step--1)' }}>{t('search.hint')}</p>
        </div>
      </div>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-5)' }}>
        {q ? (
          <>
            <div className="cluster" style={{ marginBlockEnd: '1rem' }} aria-label={t('search.type')}>
              <Link className="chip chip--lg" href={`${href('/search')}?q=${encodeURIComponent(q)}`} aria-current={kind ? undefined : 'true'}>{t('list.all')}</Link>
              {COLLECTION_SLUGS.map((s) => (
                <Link key={s} className="chip chip--lg" href={`${href('/search')}?q=${encodeURIComponent(q)}&type=${s}`} aria-current={kind === s ? 'true' : undefined}>{t(`type.${s}`)}</Link>
              ))}
            </div>
            <p className="result-count" aria-live="polite">{total ? t('search.results', { count: total, q }) : t('search.none', { q })}</p>
            {usedLang !== locale ? <p className="notice notice--warn">{t('tr.missingNotice')}</p> : null}
            <div>
              {items.map(({ doc, kind: k }) => {
                const info = typeFromSlug(k);
                return (
                  <article key={`${k}:${doc.id}`} className="search-hit">
                    <p className="eyebrow">{t(`type.${k}`)}</p>
                    <h3><Link href={docHref(ctx, (info as { type: keyof typeof CONTENT }).type, doc.id)}>{doc.title}</Link></h3>
                    <Highlighted text={htmlToText(doc.body ?? '') || doc.excerpt || ''} q={q} />
                  </article>
                );
              })}
            </div>
            <Pagination ctx={ctx} page={page} pages={Math.ceil(total / PER_PAGE)} basePath="/search" query={{ q, type: kind || undefined }} />
          </>
        ) : null}
      </div>
    </>
  );
}
