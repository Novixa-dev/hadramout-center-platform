import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absolute, isLocale, makeCtx } from '../../../../lib/ctx.ts';
import { getSite } from '../../../../lib/data.ts';
import { listAuthors } from '../../../../lib/facets.ts';
import { buildMetadata } from '../../../../lib/seo.ts';
import { breadcrumbJsonLd, jsonLdString } from '../../../../lib/jsonld.ts';
import { normalizeArabic } from '../../../../lib/arabic.ts';
import { PageHead } from '../../../../components/PageHead.tsx';
import { Icon } from '../../../../components/Icon.tsx';

export const dynamic = 'force-dynamic'; // reads searchParams

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Index letter: Arabic names are grouped by their normalised first letter (أ إ آ ا together); other scripts by upper-case initial. */
function letterOf(name: string, lang: string): string {
  const cleaned = name.replace(/^(?:ال|أ\.?\s?د\.?|د\.|الشيخ|الدكتور|الأستاذ|الاستاذ)\s*/u, '').trim() || name;
  const first = Array.from(lang === 'ar' ? normalizeArabic(cleaned) : cleaned.normalize('NFD').replace(/\p{M}/gu, ''))[0] ?? '#';
  const l = first.toLocaleUpperCase(lang);
  return /[\p{L}]/u.test(l) ? (l === 'ا' ? 'أ' : l) : '#';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ctx = makeCtx(locale);
  const authors = await listAuthors(locale);
  return buildMetadata({ ctx, path: '/authors', title: ctx.t('authors.title'), description: `${ctx.t('authors.lead')} ${ctx.t('authors.meta', { count: authors.length })}`, card: { key: 'authors' } });
}

export default async function AuthorsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ctx = makeCtx(locale);
  const { t, href, lang } = ctx;
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? '';
  const [authors, site] = await Promise.all([listAuthors(locale, q || undefined), getSite(locale)]);
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const groups = new Map<string, typeof authors>();
  for (const a of authors) {
    const l = letterOf(a.name, locale);
    groups.set(l, [...(groups.get(l) ?? []), a]);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : collator.compare(a, b)));
  const ld = breadcrumbJsonLd([{ name: t('nav.home'), url: absolute(`/${lang.code}`) }, { name: t('authors.title'), url: absolute(`/${lang.code}/authors`) }]);
  void site;
  return (
    <>
      <PageHead ctx={ctx} crumbs={[{ name: t('authors.title') }]} title={t('authors.title')} lead={t('authors.lead')}>
        <form role="search" action={href('/authors')} className="sbox" style={{ marginBlockStart: '1rem', maxInlineSize: '30rem' }}>
          <div className="sbox__row">
            <div className="sbox__field">
              <Icon name="search" className="icon sbox__icon" />
              <label className="sr-only" htmlFor="aq">{t('authors.search')}</label>
              <input id="aq" className="input" type="search" name="q" defaultValue={q} placeholder={t('authors.search')} autoComplete="off" />
            </div>
            <button className="btn btn--primary" type="submit">{t('nav.search')}</button>
          </div>
        </form>
      </PageHead>
      <div className="container section" style={{ paddingBlockStart: 'var(--space-5)' }}>
        <p className="toolbar__count" style={{ marginBlockEnd: '0.75rem' }} aria-live="polite">{t('authors.count', { count: authors.length })}</p>
        {letters.length > 1 ? (
          <nav className="az" aria-label={t('authors.index')}>
            {letters.map((l) => <a key={l} href={`#l-${encodeURIComponent(l)}`}>{l}</a>)}
          </nav>
        ) : null}
        {authors.length === 0 ? (
          <div className="empty"><Icon name="search" /><h2>{t('list.empty')}</h2>{q ? <Link className="btn btn--primary btn--sm" href={href('/authors')}>{t('list.clear')}</Link> : null}</div>
        ) : (
          <div className="author-groups">
            {letters.map((l) => (
              <section key={l} id={`l-${encodeURIComponent(l)}`} className="author-group" aria-labelledby={`h-${encodeURIComponent(l)}`}>
                <h2 id={`h-${encodeURIComponent(l)}`}>{l}</h2>
                <ul className="author-list">
                  {(groups.get(l) ?? []).map((a) => (
                    <li key={a.id}>
                      <Link href={href(`/authors/${a.id}`)}>{a.name}</Link>
                      <span className="n">{t('authors.works', { count: a.count })}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
