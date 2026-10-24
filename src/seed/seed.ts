import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { Payload } from 'payload';
import { authorKey } from '../lib/arabic.ts';
import { sanitizeText } from '../lib/sanitize.ts';
import { CONTENT, type ContentType } from '../lib/content-types.ts';
import { DEFAULT_GLOSSARY, DEFAULT_PAGES, DEFAULT_TIMELINE } from './defaults.ts';
import type { Snapshot } from '../importer/crawl.ts';
import type { SnapshotPost } from '../importer/legacy.ts';

export function readSnapshot(file: string): Snapshot {
  return JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as Snapshot;
}

export interface SeedReport {
  created: number;
  updated: number;
  skippedEdited: number;
  authors: number;
  categories: number;
}

const CTX = { fromImport: true, skipHooks: true } as const;
const OPTS = { overrideAccess: true, depth: 0, locale: 'ar' as const, context: CTX };

/** Most common spelling of each author (ties: the longer, more complete one). */
function canonicalAuthors(posts: SnapshotPost[]): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const p of posts) {
    for (const raw of p.authors) {
      const name = sanitizeText(raw);
      const key = authorKey(name);
      if (!key) continue;
      const v = counts.get(key) ?? new Map<string, number>();
      v.set(name, (v.get(name) ?? 0) + 1);
      counts.set(key, v);
    }
  }
  const out = new Map<string, string>();
  for (const [key, v] of counts) {
    const best = [...v].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0];
    if (best) out.set(key, best[0]);
  }
  return out;
}

async function findOne(payload: Payload, collection: string, where: Record<string, unknown>): Promise<{ id: number } | null> {
  const r = await payload.find({ collection: collection as never, where: where as never, limit: 1, depth: 0, overrideAccess: true, pagination: false });
  return (r.docs[0] as unknown as { id: number } | undefined) ?? null;
}

function typeFields(p: SnapshotPost, ids: { authors: number[]; category?: number; magazine?: number }): Record<string, unknown> {
  const f = p.fields;
  const d = p.data;
  switch (p.type) {
    case 'news':
      return { dateline: f.dateline };
    case 'article':
      return { authors: ids.authors, category: ids.category, magazine: ids.magazine };
    case 'book':
      return { authors: ids.authors, publisher: f.publisher, edition: f.edition, editor: f.editor, translator: f.translator, year: d.year, pdf: d.pdf };
    case 'magazine':
      return { issueNumber: d.issue_number, pdf: d.pdf };
    case 'event':
    case 'forum':
      return { speaker: f.speaker, moderator: f.moderator, venue: f.venue, timeText: f.time_text, eventDate: d.event_date, endDate: d.end_date, youtubeId: d.youtube_id };
    case 'video':
      return { youtubeId: d.youtube_id, embedUrl: d.embed_url };
  }
}

/** Load the legacy snapshot into Payload. Safe to repeat: human-edited documents are never overwritten. */
export async function seedSnapshot(payload: Payload, snapshot: Snapshot, log: (m: string) => void = () => {}): Promise<SeedReport> {
  const report: SeedReport = { created: 0, updated: 0, skippedEdited: 0, authors: 0, categories: 0 };

  // authors
  const authorIds = new Map<string, number>();
  for (const [key, name] of canonicalAuthors(snapshot.posts)) {
    let a = await findOne(payload, 'authors', { nameKey: { equals: key } });
    if (!a) {
      a = (await payload.create({ collection: 'authors', data: { name, nameKey: key }, ...OPTS })) as unknown as { id: number };
      report.authors++;
    }
    authorIds.set(key, a.id);
  }
  // categories
  const categoryIds = new Map<string, number>();
  for (const p of snapshot.posts) {
    for (const t of p.terms) {
      if (t.taxonomy !== 'article_category' || categoryIds.has(t.name)) continue;
      let c = await findOne(payload, 'categories', { name: { equals: t.name } });
      if (!c) {
        c = (await payload.create({ collection: 'categories', data: { name: t.name, kind: 'article' }, ...OPTS })) as unknown as { id: number };
        report.categories++;
      }
      categoryIds.set(t.name, c.id);
    }
  }
  log(`authors ${authorIds.size}, categories ${categoryIds.size}`);

  // magazines first (articles point at them), then everything else
  const order: ContentType[] = ['magazine', 'news', 'article', 'book', 'event', 'forum', 'video'];
  const legacyToNew = new Map<string, number>();
  for (const type of order) {
    const info = CONTENT[type];
    const posts = snapshot.posts.filter((p) => p.type === type);
    let n = 0;
    for (const p of posts) {
      const existing = (await payload.find({ collection: info.slug, where: { legacyId: { equals: p.id } }, limit: 1, depth: 0, overrideAccess: true, pagination: false })).docs[0] as unknown as
        | { id: number; edited?: boolean; source?: string }
        | undefined;
      if (existing && (existing.edited || existing.source !== 'legacy')) {
        report.skippedEdited++;
        legacyToNew.set(`${type}:${p.id}`, existing.id);
        continue;
      }
      const data = {
        title: p.title,
        excerpt: p.excerpt,
        ...(info.slug !== 'videos' || p.body ? { body: p.body } : {}),
        coverUrl: p.cover ?? undefined,
        coverAlt: p.coverAlt || undefined,
        status: p.status,
        publishedAt: p.publishedAt ?? undefined,
        datePrecision: p.datePrecision,
        legacyId: p.id,
        legacyUrl: p.legacyUrl,
        source: 'legacy',
        ...typeFields(p, {
          authors: p.authors.map((a) => authorIds.get(authorKey(sanitizeText(a)))).filter((x): x is number => Boolean(x)),
          category: categoryIds.get(p.terms.find((t) => t.taxonomy === 'article_category')?.name ?? ''),
          magazine: p.data.magazine_id ? legacyToNew.get(`magazine:${String(p.data.magazine_id)}`) : undefined,
        }),
      };
      if (existing) {
        await payload.update({ collection: info.slug, id: existing.id, data: data as never, ...OPTS });
        legacyToNew.set(`${type}:${p.id}`, existing.id);
        report.updated++;
      } else {
        const created = (await payload.create({ collection: info.slug, data: data as never, ...OPTS })) as unknown as { id: number };
        legacyToNew.set(`${type}:${p.id}`, created.id);
        report.created++;
      }
      if (++n % 100 === 0) log(`  ${type}: ${n}/${posts.length}`);
    }
    log(`✔ ${type}: ${posts.length}`);
  }
  return report;
}

/** Pages, timeline, glossary and site settings that the legacy site does not provide. */
export async function seedDefaults(payload: Payload): Promise<void> {
  for (const p of DEFAULT_PAGES) {
    if (!(await findOne(payload, 'pages', { slug: { equals: p.slug } }))) {
      await payload.create({ collection: 'pages', data: { slug: p.slug, title: p.title, body: p.body, status: 'published' }, ...OPTS });
    }
  }
  if ((await payload.count({ collection: 'timeline', overrideAccess: true })).totalDocs === 0) {
    for (const e of DEFAULT_TIMELINE) {
      await payload.create({ collection: 'timeline', data: { title: e.title, body: e.body, era: e.era, yearFrom: e.yearFrom, yearTo: e.yearTo, source: e.source, status: 'published' }, ...OPTS });
    }
  }
  for (const g of DEFAULT_GLOSSARY) {
    if (!(await findOne(payload, 'glossary', { and: [{ termAr: { equals: g.termAr } }, { lang: { equals: g.lang } }] }))) {
      await payload.create({ collection: 'glossary', data: { termAr: g.termAr, lang: g.lang as never, translation: g.translation, kind: g.kind }, ...OPTS });
    }
  }
  await payload.updateGlobal({
    slug: 'site',
    data: {
      name: 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر',
      shortName: 'مركز حضرموت',
      tagline: 'مركز علمي مستقل يُعنى بدراسة تاريخ حضرموت وحضارتها وأعلامها وتوثيقها ونشرها',
      description: 'يعد مركز حضرموت للدراسات التاريخية والتوثيق والنشر من المراكز العلمية المستقلة، يمارس نشاطه في مجالات الدراسات والبحوث التاريخية والترجمة والتوثيق والنشر، ويخصص حيزاً كبيراً من نشاطه العلمي لدراسة تاريخ حضرموت وحضارتها وأعلامها.',
      address: 'عمارة باشريف، بجانب مسجد الغالبي، حي الشهيد خالد، المكلا، الجمهورية اليمنية',
      email: 'info@hadramout.center',
      whatsapp: [
        { label: 'المكلا', number: '00967773570194' },
        { label: 'الرياض', number: '00966556408983' },
      ],
      social: {
        x: 'https://x.com/HadramoutCenter',
        facebook: 'https://www.facebook.com/hadramout.center/',
        instagram: 'https://instagram.com/hadramoutcenter',
        telegram: 'https://t.me/hadramoutcenter',
        youtube: 'https://www.youtube.com/@hadramoutcenter',
      },
    } as never,
    overrideAccess: true,
    locale: 'ar',
    depth: 0,
  });
}

