import type { CollectionSlug, Payload, Where } from 'payload';
import { loadConfig } from '../config.ts';
import { dashboardStrings, fill, waitingLine } from './i18n.ts';
import { listUrl } from './links.ts';
import { ScholarlyNormalizerWidget } from './components/ScholarlyNormalizerWidget.tsx';
import { Icon, type IconName } from './icons.tsx';

/**
 * The admin home, above Payload's own collection list. Mobile first, in order of urgency:
 * - a masthead that says in one sentence how much is waiting
 * - what needs attention (requests, receipts, reviews…) as one list; empty queues are named once, quietly
 * - creating new content, recent edits, the state of every section (published / drafts / archived)
 * - the scholarly punctuation tool, today's machine-translation budget and shortcuts
 * On a wide screen the same blocks sit in two columns (custom.scss, container query on .hc-dash).
 * Every number is a real count run with the signed-in user's own access (overrideAccess: false).
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
  { slug: 'audio', ar: 'الصوتيات والبودكاست', en: 'Audio & Podcasts' },
  { slug: 'videos', ar: 'المرئيات', en: 'Videos' },
  { slug: 'encyclopedia', ar: 'الموسوعة الحضرمية', en: 'Encyclopedia' },
  { slug: 'announcements', ar: 'الإعلانات والبيانات', en: 'Announcements' },
  { slug: 'partners', ar: 'الشركاء والجهات', en: 'Partners' },
  { slug: 'pages', ar: 'الصفحات التعريفية', en: 'Pages' },
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
      return null;
    }
  };

  const [newOrders, newPledges, newVolunteers, newReceipts] = await Promise.all((['orders', 'pledges', 'volunteers', 'receipts'] as const).map((c) => (staff ? count(c, { status: { equals: 'new' } }) : null)));
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

  // Everything that waits for someone. Items with something new become rows; the rest are named once, quietly, below them.
  // `upkeep` is the editors' own backlog (articles without a topic): listed, but not counted as people waiting for an answer.
  type Task = { key: string; icon: IconName; label: string; quiet: string; n: number | null; href: string; hint: string; upkeep?: boolean };
  const all: Task[] = [
    { key: 'receipts', icon: 'receipt', label: t.newReceipts, quiet: t.qReceipts, n: newReceipts, href: listUrl('receipts', { status: { equals: 'new' } }), hint: t.newReceiptsHint },
    { key: 'orders', icon: 'cart', label: t.newOrders, quiet: t.qOrders, n: newOrders, href: listUrl('orders', { status: { equals: 'new' } }), hint: t.newRequestsHint },
    { key: 'pledges', icon: 'heart', label: t.newPledges, quiet: t.qPledges, n: newPledges, href: listUrl('pledges', { status: { equals: 'new' } }), hint: t.newRequestsHint },
    { key: 'volunteers', icon: 'hand', label: t.newVolunteers, quiet: t.qVolunteers, n: newVolunteers, href: listUrl('volunteers', { status: { equals: 'new' } }), hint: t.newRequestsHint },
    { key: 'messages', icon: 'message', label: t.newMessages, quiet: t.qMessages, n: newMessages, href: listUrl('messages', { status: { equals: 'new' } }), hint: t.newMessagesHint },
    { key: 'reviews', icon: 'review', label: t.pendingReviews, quiet: t.qReviews, n: pendingReviews, href: listUrl('reviews', { status: { equals: 'pending' } }), hint: t.pendingReviewsHint },
    { key: 'tr', icon: 'language', label: t.translationIssues, quiet: t.qTranslation, n: staff ? null : translationIssues, href: listUrl('messages', { kind: { equals: 'translation_issue' }, status: { equals: 'new' } }), hint: t.translationIssuesHint },
    { key: 'uncat', icon: 'tag', label: t.uncategorised, quiet: t.qUncategorised, n: uncategorised, href: listUrl('articles', { category: { exists: 'false' }, status: { equals: 'published' } }), hint: t.uncategorisedHint, upkeep: true },
  ];
  const tasks = all.filter((task) => task.n !== null);
  const active = tasks.filter((task) => !task.upkeep && (task.n ?? 0) > 0);
  const quiet = tasks.filter((task) => task.n === 0);
  const upkeep = tasks.filter((task) => task.upkeep && (task.n ?? 0) > 0);
  const waitingTotal = active.reduce((sum, task) => sum + (task.n ?? 0), 0);
  const row = (task: Task) => (
    <li key={task.key}>
      <a href={task.href} className="hc-inbox__row" data-key={task.key} data-count={task.n ?? 0}>
        <span className="hc-inbox__icon"><Icon name={task.icon} /></span>
        <span className="hc-inbox__text">
          <span className="hc-inbox__label">{task.label}</span>
          <span className="hc-inbox__hint">{task.hint}</span>
        </span>
        <span className="hc-inbox__n">{nf.format(task.n ?? 0)}</span>
        <span className="hc-inbox__go"><Icon name="chevron" /></span>
      </a>
    </li>
  );
  const showEvent = latestEvent !== null && staff;
  const waiting = waitingLine(lang, waitingTotal, (n) => nf.format(n));
  const roleName = role === 'admin' ? t.roleAdmin : role === 'reviewer' ? t.roleReviewer : t.roleEditor;

  return (
    <div className="hc-dash">
      {/* a div, not <header>: Payload's app header is already the page's banner landmark */}
      <div className="hc-mast">
        <p className="hc-mast__meta">
          <span>{df.format(new Date())}</span>
          <span className={`hc-badge hc-badge--${role}`}>{roleName}</span>
        </p>
        <h1 className="hc-dash__title">{fill(t.greeting, { name: user.name ?? '' })}</h1>
        <p className="hc-mast__line">{staff ? waiting : t.leadReviewer}</p>
        {staff && waitingTotal > 0 ? <p className="hc-mast__hint">{t.waitingHint}</p> : null}
      </div>

      <div className="hc-dash__cols">
        <div className="hc-dash__col hc-dash__col--main">
          <section aria-labelledby="hc-dash-attention" className="hc-box hc-box--inbox">
            <h2 id="hc-dash-attention" className="hc-box__title">{t.attention}</h2>
            {active.length ? (
              <ul className="hc-inbox" role="list">
                {active.map(row)}
              </ul>
            ) : (
              <p className="hc-box__empty">{t.allClear}</p>
            )}
            {quiet.length ? (
              <p className="hc-inbox__quiet">
                <span>{t.nothingNewIn}</span>{' '}
                {quiet.map((task, i) => (
                  <span key={task.key}>
                    <a href={task.href} data-key={task.key} data-count={0}>{task.quiet}</a>
                    {i < quiet.length - 1 ? (lang === 'ar' ? '، ' : ', ') : null}
                  </span>
                ))}
              </p>
            ) : null}
            {upkeep.length || showEvent ? (
              <div className="hc-upkeep">
                <h3 className="hc-upkeep__title">{t.upkeep}</h3>
                {upkeep.length ? (
                  <ul className="hc-inbox hc-inbox--upkeep" role="list">
                    {upkeep.map(row)}
                  </ul>
                ) : null}
                {showEvent ? (
                  <a className="hc-inbox__event" href={listUrl('events')}>
                    <Icon name="calendar" />
                    <span>
                      {t.latestEvent}: <strong>{latestEvent ? df.format(new Date(latestEvent)) : t.noEvent}</strong>
                      <span className="hc-inbox__event-hint">{t.latestEventHint}</span>
                    </span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>

          <section aria-labelledby="hc-dash-content" className="hc-box hc-box--content">
            <h2 id="hc-dash-content" className="hc-box__title">{t.content}</h2>
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
                              <Icon name="plus" />
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

          <section aria-labelledby="hc-dash-normalizer" className="hc-box hc-box--tool">
            <ScholarlyNormalizerWidget lang={lang} />
          </section>
        </div>

        <div className="hc-dash__col hc-dash__col--side">
          {staff ? (
            <section aria-labelledby="hc-dash-create" className="hc-box hc-box--create">
              <h2 id="hc-dash-create" className="hc-box__title">{t.quickActions}</h2>
              <div className="hc-create">
                {(
                  [
                    ['news', 'news', t.newNews],
                    ['articles', 'article', t.newArticle],
                    ['pages', 'page', t.newPage],
                    ['audio', 'audio', t.newAudio],
                    ['announcements', 'announcement', t.newAnnouncement],
                  ] as const
                ).map(([slug, icon, label], i) => (
                  <a key={slug} href={`/admin/collections/${slug}/create`} className={`hc-create__btn${i === 0 ? ' hc-create__btn--primary' : ''}`}>
                    <Icon name={icon} />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="hc-dash-recent" className="hc-box hc-box--recent">
            <h2 id="hc-dash-recent" className="hc-box__title">{t.recent}</h2>
            {recent.length ? (
              <ol className="hc-recent" role="list">
                {recent.map((r) => (
                  <li key={`${r.slug}-${r.id}`}>
                    <a href={`/admin/collections/${r.slug}/${r.id}`} className="hc-recent__title" dir="auto">
                      {r.title}
                    </a>
                    <span className="hc-recent__meta">
                      <span className={`hc-status hc-status--${r.status ?? 'draft'}`}>{statusLabel(r.status)}</span>
                      <span>{r.type}</span>
                      <time dateTime={r.updatedAt}>{dtf.format(new Date(r.updatedAt))}</time>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hc-box__empty">{t.recentEmpty}</p>
            )}
          </section>

          {usage !== null ? (
            <section aria-labelledby="hc-dash-tr" className="hc-box hc-box--usage">
              <h2 id="hc-dash-tr" className="hc-box__title">{t.translation}</h2>
              {usage > 0 && limit > 0 ? (
                <>
                  <p className="hc-meter-label">{fill(t.translationUsed, { used: nf.format(usage), limit: nf.format(limit) })}</p>
                  <meter className="hc-meter" min={0} max={limit} low={limit * 0.7} high={limit * 0.9} optimum={0} value={Math.min(usage, limit)}>
                    {Math.round((usage / limit) * 100)}%
                  </meter>
                </>
              ) : (
                <p className="hc-box__empty">{t.translationNone}</p>
              )}
            </section>
          ) : null}

          <nav aria-labelledby="hc-dash-quick" className="hc-box hc-box--links">
            <h2 id="hc-dash-quick" className="hc-box__title">{t.quick}</h2>
            <ul className="hc-quick" role="list">
              <li><a href={`/${lang}`} target="_blank" rel="noopener"><Icon name="external" />{t.viewSite}</a></li>
              <li><a href="/admin/account"><Icon name="user" />{t.profile}</a></li>
              {role === 'admin' ? <li><a href="/admin/collections/users"><Icon name="users" />{t.users}</a></li> : null}
              <li><a href={GUIDE_URL} target="_blank" rel="noopener"><Icon name="book" />{t.guide}</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
