import type { CollectionSlug, Payload, Where } from 'payload';

/**
 * "What needs attention" panel above the admin dashboard: every count is a link to the matching, pre-filtered list.
 * Counts run with the signed-in user's own access (overrideAccess: false), so a role never sees numbers it cannot open.
 */

type Role = 'admin' | 'editor' | 'reviewer';
interface Props {
  payload: Payload;
  user?: { id?: number | string; name?: string; role?: Role; collection?: string } | null;
  i18n?: { language?: string };
}

const CONTENT: { slug: CollectionSlug; ar: string; en: string }[] = [
  { slug: 'news', ar: 'الأخبار', en: 'News' },
  { slug: 'articles', ar: 'المقالات', en: 'Articles' },
  { slug: 'books', ar: 'الكتب', en: 'Books' },
  { slug: 'magazines', ar: 'أعداد المجلة', en: 'Issues' },
  { slug: 'events', ar: 'المؤتمرات والندوات', en: 'Conferences' },
  { slug: 'forum-events', ar: 'المنتدى', en: 'Forum' },
  { slug: 'videos', ar: 'المرئيات', en: 'Videos' },
];

/** `where` as the admin list understands it in the URL (`?where[status][equals]=pending`). */
function listUrl(slug: string, where: Record<string, Record<string, string>>): string {
  const q = Object.entries(where)
    .flatMap(([field, ops]) => Object.entries(ops).map(([op, v]) => `where[${field}][${op}]=${encodeURIComponent(v)}`))
    .join('&');
  return `/admin/collections/${slug}${q ? `?${q}` : ''}`;
}

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  padding: '14px 16px',
  background: 'var(--theme-elevation-0)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  textDecoration: 'none',
  color: 'inherit',
};

export async function EditorialDashboard({ payload, user, i18n }: Props) {
  if (!user) return null;
  const ar = (i18n?.language ?? 'ar') === 'ar';
  const T = (a: string, e: string) => (ar ? a : e);
  const role: Role = user.role ?? 'editor';
  const count = async (collection: CollectionSlug, where: Where) => {
    try {
      return (await payload.count({ collection, where, user: user as never, overrideAccess: false })).totalDocs;
    } catch {
      return null; // not allowed for this role, or the collection is unavailable: the card is left out
    }
  };

  const [pendingReviews, newMessages, translationIssues, uncategorised, drafts, latestEvent] = await Promise.all([
    role === 'reviewer' ? null : count('reviews', { status: { equals: 'pending' } }),
    role === 'reviewer' ? null : count('messages', { status: { equals: 'new' } }),
    count('messages', { and: [{ status: { equals: 'new' } }, { kind: { equals: 'translation_issue' } }] }),
    role === 'reviewer' ? null : count('articles', { and: [{ status: { equals: 'published' } }, { category: { exists: false } }] }),
    role === 'reviewer' ? [] : Promise.all(CONTENT.map(async (c) => ({ ...c, n: await count(c.slug, { status: { equals: 'draft' } }) }))),
    payload
      .find({ collection: 'events', where: { status: { equals: 'published' } }, sort: '-eventDate', limit: 1, depth: 0, user: user as never, overrideAccess: false })
      .then((r) => (r.docs[0] as { eventDate?: string } | undefined)?.eventDate ?? null)
      .catch(() => null),
  ]);

  const cards: { label: string; n: number; href: string; hint: string; tone: 'act' | 'info' }[] = [];
  if (pendingReviews !== null) cards.push({ label: T('مراجعات قرّاء بانتظار الموافقة', 'Reader reviews awaiting approval'), n: pendingReviews, href: listUrl('reviews', { status: { equals: 'pending' } }), hint: T('لا تظهر للعموم قبل الموافقة', 'Hidden from the public until approved'), tone: 'act' });
  if (newMessages !== null) cards.push({ label: T('رسائل جديدة من الزوار', 'New visitor messages'), n: newMessages, href: listUrl('messages', { status: { equals: 'new' } }), hint: T('تواصل، طلبات كتب، بلاغات ترجمة', 'Contact, book requests, translation reports'), tone: 'act' });
  if (role === 'reviewer' && translationIssues !== null) cards.push({ label: T('بلاغات عن أخطاء الترجمة', 'Reported translation errors'), n: translationIssues, href: listUrl('messages', { kind: { equals: 'translation_issue' }, status: { equals: 'new' } }), hint: T('صحّحها من اللغة المعنية في العنصر', 'Fix them in the item, in that language'), tone: 'act' });
  if (uncategorised !== null) cards.push({ label: T('مقالات منشورة بلا تصنيف', 'Published articles without a topic'), n: uncategorised, href: listUrl('articles', { category: { exists: 'false' }, status: { equals: 'published' } }), hint: T('التصنيف يجعلها تظهر في صفحات المواضيع', 'A topic makes them appear on topic pages'), tone: 'info' });
  const draftRows = (drafts ?? []).filter((d) => d.n);

  return (
    <section dir={ar ? 'rtl' : 'ltr'} aria-labelledby="hc-dash-title" style={{ marginBlockEnd: 28 }}>
      <h2 id="hc-dash-title" style={{ marginBlockEnd: 4 }}>
        {T('أهلاً', 'Welcome')} {user.name ?? ''}
      </h2>
      <p style={{ marginBlockStart: 0, opacity: 0.75 }}>
        {role === 'reviewer'
          ? T('دورك: مراجع ترجمة — تعدّل نصوص اللغات غير العربية فقط.', 'Your role: translation reviewer — you edit non-Arabic text only.')
          : T('ما يحتاج انتباهك الآن. كل رقم رابط إلى القائمة المصفّاة.', 'What needs your attention. Every number opens the filtered list.')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, marginBlockStart: 14 }}>
        {cards.map((c) => (
          <a key={c.label} href={c.href} style={{ ...box, borderInlineStart: `4px solid ${c.n && c.tone === 'act' ? 'var(--theme-warning-500, #c49952)' : 'var(--theme-elevation-150)'}` }}>
            <strong style={{ fontSize: 28, lineHeight: 1.1 }}>{c.n.toLocaleString(ar ? 'ar-EG-u-nu-latn' : 'en')}</strong>
            <span>{c.label}</span>
            <small style={{ opacity: 0.7 }}>{c.hint}</small>
          </a>
        ))}
        {draftRows.length ? (
          <div style={box}>
            <strong>{T('مسودات غير منشورة', 'Unpublished drafts')}</strong>
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {draftRows.map((d) => (
                <li key={d.slug}>
                  <a href={listUrl(d.slug, { status: { equals: 'draft' } })}>{ar ? d.ar : d.en}: {d.n}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {latestEvent && role !== 'reviewer' ? (
          <a href={listUrl('events', {})} style={box}>
            <strong>{T('آخر فعالية منشورة', 'Latest published event')}</strong>
            <span>{new Date(latestEvent).toLocaleDateString(ar ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <small style={{ opacity: 0.7 }}>{T('أضيفوا فعاليات المركز الأحدث ليبقى الموقع حيّاً', 'Add the latest events to keep the site current')}</small>
          </a>
        ) : null}
      </div>
    </section>
  );
}
