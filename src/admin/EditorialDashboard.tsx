import type { CollectionSlug, Payload, Where } from 'payload';
import { loadConfig } from '../config.ts';
import { dashboardStrings, fill } from './i18n.ts';
import { listUrl } from './links.ts';

/**
 * The admin home, above Payload's own collection list: what needs attention, the state of every content type
 * (published / drafts / archived, each a link to the filtered list), the latest edits, today's machine-translation
 * budget and shortcuts. Every number is a real count run with the signed-in user's own access (overrideAccess: false),
 * so a role never sees numbers it cannot open, and nothing is shown that the database does not hold.
 */

type Role = 'admin' | 'editor' | 'reviewer';
interface Props {
  payload: Payload;
  user?: { id?: number | string; name?: string; role?: Role; collection?: string } | null;
  i18n?: { language?: string };
}

const CONTENT: { slug: CollectionSlug; ar: string; en: string }[] = [
  { slug: 'news', ar: 'الأخبار', en: 'News' },
  { slug: 'articles', ar: 'المقالات والدراسات', en: 'Articles & studies' },
  { slug: 'books', ar: 'الكتب', en: 'Books' },
  { slug: 'magazines', ar: 'أعداد المجلة', en: 'Magazine issues' },
  { slug: 'events', ar: 'المؤتمرات والندوات', en: 'Conferences & seminars' },
  { slug: 'forum-events', ar: 'منتدى عميد الوفاء', en: 'Forum' },
  { slug: 'videos', ar: 'المرئيات', en: 'Videos' },
];

const GUIDE_URL = 'https://github.com/Novixa-dev/hadramout-center-platform/blob/master/docs/06-handover/admin-guide-ar.md';

type Recent = { slug: string; type: string; id: number | string; title: string; status?: string; updatedAt: string };

export async function EditorialDashboard({ payload, user, i18n }: Props) {
  if (!user) return null;
  const lang = i18n?.language === 'en' ? 'en' : 'ar';
  const t = dashboardStrings(lang);
  const role: Role = user.role ?? 'editor';
  const staff = role !== 'reviewer';
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en');
  const df = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const dtf = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const asUser = { user: user as never, overrideAccess: false } as const;

  const count = async (collection: CollectionSlug, where: Where): Promise<number | null> => {
    try {
      return (await payload.count({ collection, where, ...asUser })).totalDocs;
    } catch {
      return null; // not allowed for this role, or the collection is unavailable: the card is left out
    }
  };

  const [pendingReviews, newMessages, translationIssues, uncategorised, overview, latestEvent, recentLists, usage] = await Promise.all([
    staff ? count('reviews', { status: { equals: 'pending' } }) : null,
    staff ? count('messages', { status: { equals: 'new' } }) : null,
    count('messages', { and: [{ status: { equals: 'new' } }, { kind: { equals: 'translation_issue' } }] }),
    staff ? count('articles', { and: [{ status: { equals: 'published' } }, { category: { exists: false } }] }) : null,
    Promise.all(
      CONTENT.map(async (c) => {
        const [published, draft, archived] = await Promise.all(['published', 'draft', 'archived'].map((s) => count(c.slug, { status: { equals: s } })));
        return { ...c, published, draft, archived };
      }),
    ),
    staff
      ? payload
          .find({ collection: 'events', where: { status: { equals: 'published' } }, sort: '-eventDate', limit: 1, depth: 0, ...asUser })
          .then((r) => (r.docs[0] as { eventDate?: string } | undefined)?.eventDate ?? null)
          .catch(() => null)
      : null,
    Promise.all(
      CONTENT.map((c) =>
        payload
          .find({ collection: c.slug, sort: '-updatedAt', limit: 6, depth: 0, locale: 'ar', select: { title: true, status: true, updatedAt: true } as never, ...asUser })
          .then((r) => (r.docs as unknown as { id: number; title?: string; status?: string; updatedAt: string }[]).map((d): Recent => ({ slug: c.slug, type: lang === 'ar' ? c.ar : c.en, id: d.id, title: d.title || t.untitled, status: d.status, updatedAt: d.updatedAt })))
          .catch(() => [] as Recent[]),
      ),
    ),
    payload
      .find({ collection: 'translation-usage', where: { day: { equals: new Date().toISOString().slice(0, 10) } }, limit: 20, depth: 0, ...asUser })
      .then((r) => (r.docs as unknown as { charsIn?: number }[]).reduce((n, d) => n + (d.charsIn ?? 0), 0))
      .catch(() => null),
  ]);

  const recent = recentLists.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  const statusLabel = (s?: string) => (s === 'published' ? t.published : s === 'archived' ? t.archived : t.drafts);
  const limit = loadConfig().translation.dailyCharLimit;

  const cards: { key: string; label: string; n: number; href: string; hint: string }[] = [];
  if (pendingReviews !== null) cards.push({ key: 'reviews', label: t.pendingReviews, n: pendingReviews, href: listUrl('reviews', { status: { equals: 'pending' } }), hint: t.pendingReviewsHint });
  if (newMessages !== null) cards.push({ key: 'messages', label: t.newMessages, n: newMessages, href: listUrl('messages', { status: { equals: 'new' } }), hint: t.newMessagesHint });
  if (!staff && translationIssues !== null) cards.push({ key: 'tr', label: t.translationIssues, n: translationIssues, href: listUrl('messages', { kind: { equals: 'translation_issue' }, status: { equals: 'new' } }), hint: t.translationIssuesHint });
  if (uncategorised !== null) cards.push({ key: 'uncat', label: t.uncategorised, n: uncategorised, href: listUrl('articles', { category: { exists: 'false' }, status: { equals: 'published' } }), hint: t.uncategorisedHint });
  const waiting = cards.some((c) => c.n > 0);
  const roleName = role === 'admin' ? t.roleAdmin : role === 'reviewer' ? t.roleReviewer : t.roleEditor;

  return (
    <div className="hc-dash">
      <header className="hc-dash__head">
        <div>
          <h1 className="hc-dash__title">{fill(t.greeting, { name: user.name ?? '' })}</h1>
          <p className="hc-dash__lead">{staff ? t.leadStaff : t.leadReviewer}</p>
        </div>
        <span className={`hc-badge hc-badge--${role}`}>{roleName}</span>
      </header>

      <section aria-labelledby="hc-dash-attention" className="hc-dash__section">
        <h2 id="hc-dash-attention" className="hc-dash__h2">{t.attention}</h2>
        {!waiting ? <p className="hc-dash__clear">{t.allClear}</p> : null}
        <ul className="hc-cards" role="list">
          {cards.map((c) => (
            <li key={c.key}>
              <a href={c.href} className={`hc-card${c.n > 0 ? ' hc-card--act' : ''}`}>
                <span className="hc-card__n">{nf.format(c.n)}</span>
                <span className="hc-card__label">{c.label}</span>
                <span className="hc-card__hint">{c.hint}</span>
              </a>
            </li>
          ))}
          {latestEvent !== null && staff ? (
            <li>
              <a href={listUrl('events')} className="hc-card">
                <span className="hc-card__date">{latestEvent ? df.format(new Date(latestEvent)) : t.noEvent}</span>
                <span className="hc-card__label">{t.latestEvent}</span>
                <span className="hc-card__hint">{t.latestEventHint}</span>
              </a>
            </li>
          ) : null}
        </ul>
      </section>

      <div className="hc-dash__grid">
        <section aria-labelledby="hc-dash-content" className="hc-dash__section hc-panel">
          <h2 id="hc-dash-content" className="hc-dash__h2">{t.content}</h2>
          <div className="hc-table-wrap">
            <table className="hc-table">
              <thead>
                <tr>
                  <th scope="col">{t.section}</th>
                  <th scope="col">{t.published}</th>
                  <th scope="col">{t.drafts}</th>
                  <th scope="col">{t.archived}</th>
                  {staff ? <th scope="col"><span className="hc-sr">{t.create}</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {overview.map((c) => {
                  const name = lang === 'ar' ? c.ar : c.en;
                  const cell = (n: number | null, status: string) =>
                    n === null ? '—' : n === 0 ? <span className="hc-zero">0</span> : <a href={listUrl(c.slug, { status: { equals: status } })}>{nf.format(n)}</a>;
                  return (
                    <tr key={c.slug}>
                      <th scope="row">
                        <a href={listUrl(c.slug)}>{name}</a>
                      </th>
                      <td>{cell(c.published, 'published')}</td>
                      <td>{cell(c.draft, 'draft')}</td>
                      <td>{cell(c.archived, 'archived')}</td>
                      {staff ? (
                        <td className="hc-table__action">
                          <a className="hc-add" href={`/admin/collections/${c.slug}/create`} aria-label={fill(t.createNew, { label: name })}>
                            + {t.create}
                          </a>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="hc-dash-recent" className="hc-dash__section hc-panel">
          <h2 id="hc-dash-recent" className="hc-dash__h2">{t.recent}</h2>
          {recent.length ? (
            <ol className="hc-recent" role="list">
              {recent.map((r) => (
                <li key={`${r.slug}-${r.id}`}>
                  <a href={`/admin/collections/${r.slug}/${r.id}`} className="hc-recent__title" dir="auto">
                    {r.title}
                  </a>
                  <span className="hc-recent__meta">
                    {r.type} · <span className={`hc-status hc-status--${r.status ?? 'draft'}`}>{statusLabel(r.status)}</span> · {t.updated} {dtf.format(new Date(r.updatedAt))}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="hc-dash__clear">{t.recentEmpty}</p>
          )}
        </section>
      </div>

      <div className="hc-dash__grid hc-dash__grid--small">
        {usage !== null ? (
          <section aria-labelledby="hc-dash-tr" className="hc-dash__section hc-panel">
            <h2 id="hc-dash-tr" className="hc-dash__h2">{t.translation}</h2>
            {usage > 0 && limit > 0 ? (
              <>
                <p className="hc-meter-label">{fill(t.translationUsed, { used: nf.format(usage), limit: nf.format(limit) })}</p>
                <meter className="hc-meter" min={0} max={limit} low={limit * 0.7} high={limit * 0.9} optimum={0} value={Math.min(usage, limit)}>
                  {Math.round((usage / limit) * 100)}%
                </meter>
              </>
            ) : (
              <p className="hc-dash__clear">{t.translationNone}</p>
            )}
          </section>
        ) : null}
        <nav aria-labelledby="hc-dash-quick" className="hc-dash__section hc-panel">
          <h2 id="hc-dash-quick" className="hc-dash__h2">{t.quick}</h2>
          <ul className="hc-quick" role="list">
            <li><a href={`/${lang}`} target="_blank" rel="noopener">{t.viewSite} ↗</a></li>
            <li><a href="/admin/account">{t.profile}</a></li>
            {role === 'admin' ? <li><a href="/admin/collections/users">{t.users}</a></li> : null}
            <li><a href={GUIDE_URL} target="_blank" rel="noopener">{t.guide} ↗</a></li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
