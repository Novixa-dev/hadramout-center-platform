import { parse, HTMLElement, TextNode } from 'node-html-parser';
import type { Node } from 'node-html-parser';
import { sanitizeBody, sanitizeText, excerptFrom, htmlToText } from '../lib/sanitize.ts';
import { parseArabicDate, toIsoDate } from '../lib/dates.ts';
import { splitAuthors, toLatinDigits } from '../lib/arabic.ts';

/**
 * Parser for the legacy hadramout.center site (Next.js App Router, streamed HTML).
 * Pure functions only: network access lives in crawl.ts so everything here is testable
 * against saved pages.
 */

export const LEGACY_BASE = 'https://hadramout.center';

export type PostType = 'news' | 'article' | 'book' | 'magazine' | 'event' | 'forum' | 'video';

/** legacy URL section for each content type */
export const SECTIONS: Record<PostType, string> = {
  news: 'news',
  article: 'articles',
  book: 'books',
  magazine: 'magazines',
  event: 'events',
  forum: 'forum',
  video: 'videos',
};

export type DatePrecision = 'day' | 'month' | 'year' | 'estimated' | 'none';

export interface SnapshotPost {
  id: number;
  type: PostType;
  status: 'published';
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  coverAlt: string;
  publishedAt: string | null;
  datePrecision: DatePrecision;
  fields: Record<string, string>;
  data: Record<string, unknown>;
  legacyUrl: string;
  authors: string[];
  terms: { taxonomy: string; name: string }[];
}

export interface ParseResult {
  post: SnapshotPost | null;
  warnings: string[];
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

/** Next.js streams Suspense content into `<div hidden id="S:n">`. Return the content root. */
export function contentRoot(html: string): HTMLElement {
  const segments = [...html.matchAll(/<div hidden id="S:\d+">([\s\S]*?)<\/div><script/g)].map((m) => m[1] as string);
  const meaningful = segments.filter((s) => s.length > 100 && /<h[12][\s>]/.test(s));
  const pick = meaningful.at(-1) ?? segments.filter((s) => s.length > 100).at(-1);
  if (pick) return parse(pick);
  const doc = parse(html);
  return doc.querySelector('main') ?? doc;
}

function text(el: HTMLElement | null | undefined): string {
  return el ? sanitizeText(el.text) : '';
}

/** Real image URL behind a `/_next/image?url=…` proxy path. */
export function unwrapNextImage(src: string | undefined): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, LEGACY_BASE);
    const inner = u.pathname === '/_next/image' ? u.searchParams.get('url') : null;
    const target = inner ?? u.href;
    return /^https?:\/\//.test(target) ? target : new URL(target, LEGACY_BASE).href;
  } catch {
    return null;
  }
}

function mainImage(root: HTMLElement): { url: string | null; alt: string } {
  const img = root.querySelector('img[data-nimg]') ?? root.querySelector('img');
  return { url: unwrapNextImage(img?.getAttribute('src')), alt: sanitizeText(img?.getAttribute('alt') ?? '') };
}

const MEETING_PATTERN = /zoom\.us|meeting\s*id|passcode|passcode:|معرف\s*الاجتماع|رمز\s*(?:المرور|الدخول)|كلمة\s*(?:المرور|السر)|للانضمام\s*عبر\s*(?:ال)?زوم/i;

/** Remove video-meeting credentials and rewrite Facebook emoji hotlinks to plain emoji. */
export function cleanLegacyBody(el: HTMLElement): HTMLElement {
  for (const img of el.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (/static\.[a-z]+\.fbcdn\.net\/images\/emoji/.test(src)) {
      img.replaceWith(new TextNode(img.getAttribute('alt') ?? ''));
    }
  }
  for (const p of el.querySelectorAll('p')) {
    if (MEETING_PATTERN.test(p.text) || MEETING_PATTERN.test(p.innerHTML)) p.remove();
  }
  for (const a of el.querySelectorAll('a')) {
    if (/zoom\.us/i.test(a.getAttribute('href') ?? '')) a.remove();
  }
  return el;
}

const DATELINE = /^[\u0600-\u06FF\s]{2,25}\s*\/\s*[\u0600-\u06FF\s]{2,30}$/;

/** First short "المكلا / إعلام المركز" line becomes a field instead of body text. */
function takeDateline(el: HTMLElement): string {
  const first = el.querySelector('p');
  if (!first) return '';
  const t = sanitizeText(first.text);
  if (t.length <= 60 && DATELINE.test(t)) {
    first.remove();
    return t;
  }
  return '';
}

const ARABIC_DATE = /(\d{1,2})\s+([\u0621-\u064A]+(?:\s+[\u0621-\u064A]+)?)\s+(\d{4})/;

function firstDate(root: HTMLElement): { start: string | null; end: string | null } {
  for (const span of root.querySelectorAll('span')) {
    const t = toLatinDigits(sanitizeText(span.text));
    const all = [...t.matchAll(new RegExp(ARABIC_DATE, 'g'))];
    if (all.length) {
      const iso = (m: RegExpMatchArray) => toIsoDate(parseArabicDate(m[0]));
      return { start: iso(all[0] as RegExpMatchArray), end: all[1] ? iso(all[1]) : null };
    }
  }
  return { start: null, end: null };
}

function dateFromBody(plain: string): string | null {
  const m = toLatinDigits(plain).match(/التاريخ\s*:?\s*[^\d]{0,25}?(\d{1,2}\s+[\u0621-\u064A]+\s+\d{4})/);
  return m ? toIsoDate(parseArabicDate(m[1] as string)) : null;
}

/** Year/month encoded in the upload path of a legacy media URL: /media/2026/06/file.png */
export function uploadMonth(url: string | null): string | null {
  const m = url?.match(/\/media\/(\d{4})\/(\d{2})\//);
  return m ? `${m[1]}-${m[2]}-01` : null;
}

function labeledValue(plain: string, labels: string[]): string {
  for (const label of labels) {
    const m = plain.match(new RegExp(`${label}\\s*:\\s*([^\\n\\r]+)`));
    if (m) return sanitizeText(m[1] as string).replace(/[.،]+$/, '');
  }
  return '';
}

function eventFields(bodyHtml: string): Record<string, string> {
  const plain = bodyHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
  const stripped = plain.replace(/<[^>]+>/g, '');
  const fields: Record<string, string> = {};
  const speaker = labeledValue(stripped, ['(?:تحدث|يتحدث|تحدّث|يتحدّث)\\s+فيها', 'المتحدث', 'المحاضر']);
  const moderator = labeledValue(stripped, ['(?:يديرها|أدايرها|اديرها|يدير الندوة|تديرها)', 'إدارة الندوة']);
  const time = labeledValue(stripped, ['التوقيت', 'الوقت']);
  const venue = labeledValue(stripped, ['المكان', 'مكان الفعالية']);
  if (speaker) fields.speaker = speaker;
  if (moderator) fields.moderator = moderator;
  if (time) fields.time_text = time;
  if (venue) fields.venue = venue;
  return fields;
}

function youtubeId(src: string | undefined | null): string | null {
  const m = src?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/);
  return m ? (m[1] as string) : null;
}

const NUMBER_WORDS = /\d+/;

// ── Per-type parsers ─────────────────────────────────────────────────────────

function base(id: number, type: PostType): SnapshotPost {
  return {
    id,
    type,
    status: 'published',
    title: '',
    excerpt: '',
    body: '',
    cover: null,
    coverAlt: '',
    publishedAt: null,
    datePrecision: 'none',
    fields: {},
    data: {},
    legacyUrl: `${LEGACY_BASE}/${SECTIONS[type]}/${id}`,
    authors: [],
    terms: [],
  };
}

function finish(post: SnapshotPost, rawBody: string): SnapshotPost {
  post.body = sanitizeBody(rawBody);
  post.title = sanitizeText(post.title);
  post.excerpt = excerptFrom(post.body, 220);
  return post;
}

function parseNews(id: number, root: HTMLElement): ParseResult {
  const post = base(id, 'news');
  post.title = text(root.querySelector('h1'));
  const body = root.querySelector('#post-content');
  const warnings: string[] = [];
  if (!body) warnings.push('missing #post-content');
  const img = mainImage(root);
  post.cover = img.url;
  post.coverAlt = img.alt;
  const { start } = firstDate(root);
  if (start) {
    post.publishedAt = start;
    post.datePrecision = 'day';
  } else {
    warnings.push('missing date');
  }
  if (body) {
    cleanLegacyBody(body);
    const dateline = takeDateline(body);
    if (dateline) post.fields.dateline = dateline;
  }
  return { post: finish(post, body?.innerHTML ?? ''), warnings };
}

function parseEventLike(id: number, root: HTMLElement, type: 'event' | 'forum'): ParseResult {
  const post = base(id, type);
  post.title = text(root.querySelector('h1'));
  const body = root.querySelector('#post-content');
  const warnings: string[] = [];
  if (!body) warnings.push('missing #post-content');
  if (body) cleanLegacyBody(body);
  const bodyHtml = body?.innerHTML ?? '';
  const plain = htmlToText(bodyHtml);

  const header = firstDate(root);
  const fromBody = dateFromBody(plain);
  const start = header.start ?? fromBody;
  if (start) {
    post.publishedAt = start;
    post.datePrecision = 'day';
    post.data.event_date = start;
    if (header.end && header.end !== start) post.data.end_date = header.end;
  } else {
    warnings.push('missing event date');
  }
  Object.assign(post.fields, eventFields(bodyHtml));
  const yt = body?.querySelectorAll('iframe').map((f) => youtubeId(f.getAttribute('src'))).find(Boolean);
  if (yt) post.data.youtube_id = yt;
  const img = mainImage(root);
  if (img.url && !/fbcdn|emoji/.test(img.url)) {
    post.cover = img.url;
    post.coverAlt = img.alt;
  }
  return { post: finish(post, bodyHtml), warnings };
}

function parseBook(id: number, root: HTMLElement): ParseResult {
  const post = base(id, 'book');
  const warnings: string[] = [];
  const h1 = root.querySelector('h1');
  post.title = text(h1);
  const img = mainImage(root);
  post.cover = img.url;
  post.coverAlt = img.alt || post.title;
  // The description is the element right after <h1>.
  const desc = h1?.parentNode instanceof HTMLElement ? h1.parentNode.querySelector('div') : null;
  if (desc) cleanLegacyBody(desc);
  const bodyHtml = desc?.innerHTML ?? '';

  const extra: Record<string, string> = {};
  for (const p of root.querySelectorAll('p')) {
    const spans = p.querySelectorAll('span');
    if (spans.length >= 2) {
      const label = text(spans[0]);
      const value = text(spans[1]);
      if (label && value) extra[label] = value;
    }
  }
  const author = extra['تأليف'] ?? extra['المؤلف'] ?? '';
  if (author) {
    post.fields.author = author;
    post.authors = splitAuthors(author);
  } else {
    warnings.push('missing author');
  }
  if (extra['الناشر']) post.fields.publisher = extra['الناشر'];
  if (extra['رقم الطبعة'] ?? extra['الطبعة']) post.fields.edition = (extra['رقم الطبعة'] ?? extra['الطبعة']) as string;
  if (extra['ترجمة']) post.fields.translator = extra['ترجمة'];
  const editor = extra['تحقيق'];
  if (editor) {
    // Some books put the author inside the editor line: "تأليف د. فلان".
    const asAuthor = editor.match(/^تأليف\s*:?\s*(.+)$/);
    if (asAuthor && !post.fields.author) {
      post.fields.author = asAuthor[1] as string;
      post.authors = splitAuthors(post.fields.author);
      const at = warnings.indexOf('missing author');
      if (at >= 0) warnings.splice(at, 1);
    } else {
      post.fields.editor = editor;
    }
  }
  const publishedYear = toLatinDigits(extra['تاريخ النشر'] ?? '').match(/(1[89]\d{2}|20\d{2})/);
  if (publishedYear) post.data.year = Number(publishedYear[1]);
  const known = new Set(['تأليف', 'المؤلف', 'الناشر', 'رقم الطبعة', 'الطبعة', 'ترجمة', 'تحقيق', 'تاريخ النشر']);
  const leftovers = Object.fromEntries(Object.entries(extra).filter(([k]) => !known.has(k)));
  if (Object.keys(leftovers).length) post.data.legacy_extra = leftovers;

  const pdf = root.querySelector('a[href$=".pdf"]')?.getAttribute('href');
  if (pdf) post.data.pdf = new URL(pdf, LEGACY_BASE).href;

  if (typeof post.data.year === 'number') {
    post.publishedAt = `${post.data.year}-01-01`;
    post.datePrecision = 'year';
  } else {
    // No year on the legacy page: sort by upload month, but never present it as a publication year.
    const month = uploadMonth(post.cover);
    if (month) {
      post.publishedAt = month;
      post.datePrecision = 'estimated';
    }
    warnings.push('missing publication year');
  }
  return { post: finish(post, bodyHtml), warnings };
}

function parseArticle(id: number, root: HTMLElement): ParseResult {
  const post = base(id, 'article');
  const warnings: string[] = [];
  post.title = text(root.querySelector('h2'));
  const body = root.querySelector('#post-content');
  if (!body) warnings.push('missing #post-content');
  if (body) cleanLegacyBody(body);

  const header = root.querySelector('h2')?.nextElementSibling ?? root;
  const ps = header.querySelectorAll('p');
  const category = text(ps[0]);
  const author = text(ps[1]);
  if (category) post.terms.push({ taxonomy: 'article_category', name: category });
  else warnings.push('missing category');
  if (author) {
    post.fields.author = author;
    post.authors = splitAuthors(author);
  } else {
    warnings.push('missing author');
  }
  const issueLink = root.querySelector('a[href^="/magazines/"]');
  if (issueLink) {
    const m = (issueLink.getAttribute('href') ?? '').match(/\/magazines\/(\d+)/);
    if (m) post.data.magazine_id = Number(m[1]);
    post.data.magazine_label = text(issueLink);
  }
  return { post: finish(post, body?.innerHTML ?? ''), warnings };
}

function parseMagazine(id: number, root: HTMLElement): ParseResult {
  const post = base(id, 'magazine');
  const warnings: string[] = [];
  const h1 = root.querySelector('h1');
  post.title = text(h1);
  const img = mainImage(root);
  post.cover = img.url;
  post.coverAlt = img.alt || post.title;
  const pdf = root.querySelector('a[href$=".pdf"]')?.getAttribute('href');
  if (pdf) post.data.pdf = new URL(pdf, LEGACY_BASE).href;
  else warnings.push('missing pdf');
  const num = toLatinDigits(post.title).match(NUMBER_WORDS);
  if (num) post.data.issue_number = Number(num[0]);
  else warnings.push('missing issue number');

  // Body = the block that follows the header block (cover + title + download).
  let header: HTMLElement | null = h1 ?? null;
  while (header?.parentNode instanceof HTMLElement && header.parentNode !== root && !header.parentNode.nextElementSibling) {
    header = header.parentNode;
  }
  let bodyEl: HTMLElement | null = null;
  let cursor: HTMLElement | null = h1 ?? null;
  while (cursor && !bodyEl) {
    const parent: Node | null = cursor.parentNode;
    const next = cursor.nextElementSibling;
    if (next && /<p[\s>]/.test(next.outerHTML)) bodyEl = next;
    else cursor = parent instanceof HTMLElement ? parent : null;
  }
  if (bodyEl) cleanLegacyBody(bodyEl);
  else warnings.push('missing contents body');
  const month = uploadMonth(post.cover);
  if (month) {
    post.publishedAt = month;
    post.datePrecision = 'month';
  }
  return { post: finish(post, bodyEl?.innerHTML ?? ''), warnings };
}

function parseVideo(id: number, root: HTMLElement): ParseResult {
  const post = base(id, 'video');
  const warnings: string[] = [];
  post.title = text(root.querySelector('h1'));
  const iframe = root.querySelector('iframe');
  const src = iframe?.getAttribute('src') ?? '';
  const yt = youtubeId(src);
  if (yt) {
    post.data.youtube_id = yt;
    post.cover = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
    post.coverAlt = post.title;
  } else if (src) {
    post.data.embed_url = src;
  } else {
    warnings.push('missing video embed');
  }
  const desc = root.querySelector('p');
  return { post: finish(post, desc ? `<p>${desc.innerHTML}</p>` : ''), warnings };
}

/** Parse one legacy detail page. Returns post=null when it is a 404/empty page. */
export function parseDetail(type: PostType, id: number, html: string): ParseResult {
  if (/لم نتمكن من العثور على الصفحة/.test(html) && !/id="post-content"/.test(html)) {
    return { post: null, warnings: ['page not found'] };
  }
  const root = contentRoot(html);
  let result: ParseResult;
  switch (type) {
    case 'news': result = parseNews(id, root); break;
    case 'event': result = parseEventLike(id, root, 'event'); break;
    case 'forum': result = parseEventLike(id, root, 'forum'); break;
    case 'book': result = parseBook(id, root); break;
    case 'article': result = parseArticle(id, root); break;
    case 'magazine': result = parseMagazine(id, root); break;
    case 'video': result = parseVideo(id, root); break;
  }
  if (result.post && !result.post.title) {
    result.warnings.push('missing title');
    return { post: null, warnings: result.warnings };
  }
  return result;
}

/** Item ids found on a legacy listing page for a section. */
export function listingIds(section: string, html: string): number[] {
  const ids = new Set<number>();
  const re = new RegExp(`href="/${section}/(\\d+)"`, 'g');
  for (const m of html.matchAll(re)) ids.add(Number(m[1]));
  return [...ids];
}

// ── Date estimation for items the legacy site never dated ────────────────────

/**
 * News items carry real dates and share the WordPress id sequence with every other post type,
 * so ids order content in time. Interpolate to *estimate* a sortable date (never displayed).
 */
export function makeDateEstimator(points: { id: number; date: string }[]): (id: number) => string | null {
  const pts = points
    .map((p) => ({ id: p.id, t: Date.parse(`${p.date}T12:00:00Z`) }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.id - b.id);
  return (id: number) => {
    if (pts.length === 0) return null;
    const first = pts[0] as { id: number; t: number };
    const last = pts.at(-1) as { id: number; t: number };
    let t: number;
    if (id <= first.id) t = first.t;
    else if (id >= last.id) t = last.t;
    else {
      let lo = 0;
      let hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if ((pts[mid] as { id: number }).id <= id) lo = mid;
        else hi = mid;
      }
      const a = pts[lo] as { id: number; t: number };
      const b = pts[hi] as { id: number; t: number };
      t = a.t + ((b.t - a.t) * (id - a.id)) / (b.id - a.id || 1);
    }
    return new Date(t).toISOString().slice(0, 10);
  };
}
