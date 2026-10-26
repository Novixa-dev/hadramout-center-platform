import { authorsOf, coverOf, displayDate, makeCtx, isLocale } from './ctx.ts';
import { typeFromRoute } from './content-types.ts';
import { getAuthor, getDoc, getSite } from './data.ts';
import { queryArchive } from './facets.ts';
import { getPayloadClient } from './runtime.ts';
import { loadConfig } from '../config.ts';
import { drawable, loadBodyPhoto, loadCoverBytes, type OgInput } from './og.ts';

const host = () => new URL(loadConfig().siteUrl).host;
const isArabicText = (s: string) => /\p{Script=Arabic}/u.test(s);

/** Card for one document of the archive; null when it does not exist or is not published. */
export async function docCard(lang: string, kind: string, id: number): Promise<{ input: OgInput; version: string } | null> {
  if (kind === 'pages') return staticPageCard(lang, id);
  if (kind === 'authors') return authorCard(lang, id);
  const info = typeFromRoute(kind);
  if (!info || !isLocale(lang)) return null;
  let useLang = lang;
  let doc = await getDoc(info.type, id, lang);
  if (!doc) return null;
  if (!drawable(doc.title)) {
    const ar = await getDoc(info.type, id, 'ar');
    if (ar) {
      doc = ar;
      useLang = 'ar';
    }
  }
  const ctx = makeCtx(useLang);
  const { t } = ctx;
  const site = await getSite(useLang);
  const category = typeof doc.category === 'object' && doc.category ? doc.category.name : null;
  const authors = authorsOf(doc).map((a) => a.name);
  const eventDate = (doc.eventDate as string | undefined) ?? doc.publishedAt ?? undefined;
  const isEvent = info.type === 'event' || info.type === 'forum';
  const date = isEvent ? displayDate({ publishedAt: eventDate, datePrecision: 'day' }, useLang) : displayDate(doc, useLang);
  // the issue number is left out when the title already carries it ("مجلة حضرموت الثقافية العدد 41")
  const issue = info.type === 'magazine' && doc.issueNumber && !new RegExp(`(^|\\D)${Number(doc.issueNumber)}(\\D|$)`).test(doc.title) ? t('meta.issue', { n: Number(doc.issueNumber) }) : '';
  const who = isEvent ? (doc.speaker as string | undefined) : authors.join('، ');
  const meta = [issue, who, info.type === 'book' && doc.year ? String(doc.year) : date].filter(Boolean).join(' · ');
  const c = coverOf(doc, 'large');
  const coverSrc = c?.src ?? (doc.youtubeId ? `https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg` : null);
  // articles rarely have a cover; their first real illustration makes a far better preview than plain text
  const own = await loadCoverBytes(coverSrc);
  const bodyPhoto = !own && !coverSrc && typeof doc.body === 'string' ? await loadBodyPhoto(doc.body) : null;
  const cover = own ?? bodyPhoto;
  const title = doc.title;
  return {
    version: `${doc.updatedAt ?? ''}`,
    input: {
      dir: isArabicText(title) ? 'rtl' : ctx.lang.dir,
      org: drawable(site.name) ? site.name : (await getSite('ar')).name,
      kicker: category ?? t(`card.type.${info.type}`),
      title,
      meta: meta || undefined,
      cover,
      frame: Boolean(bodyPhoto),
      host: host(),
    },
  };
}

/** Card for an author page: the name and how much of their work the archive holds; null for authors without published work (they have no page). */
async function authorCard(lang: string, id: number): Promise<{ input: OgInput; version: string } | null> {
  if (!isLocale(lang)) return null;
  let useLang = lang;
  let author = await getAuthor(id, lang);
  if (author && !drawable(author.name)) {
    author = await getAuthor(id, 'ar');
    useLang = 'ar';
  }
  if (!author) return null;
  const [articles, books] = await Promise.all([queryArchive({ type: 'article', lang: useLang, author: id, limit: 1 }), queryArchive({ type: 'book', lang: useLang, author: id, limit: 1 })]);
  const works = articles.total + books.total;
  if (works === 0) return null;
  const ctx = makeCtx(useLang);
  const site = await getSite(useLang);
  return {
    version: `a${articles.total}-${books.total}`,
    input: { dir: isArabicText(author.name) ? 'rtl' : ctx.lang.dir, org: drawable(site.name) ? site.name : (await getSite('ar')).name, kicker: ctx.t('og.author'), title: author.name, meta: ctx.t('authors.works', { count: works }), host: host() },
  };
}

/** Card for a CMS page (about, privacy, terms…): its own title under the institution name. */
async function staticPageCard(lang: string, id: number): Promise<{ input: OgInput; version: string } | null> {
  if (!isLocale(lang)) return null;
  const payload = await getPayloadClient();
  const find = async (l: string) => {
    try {
      return (await payload.findByID({ collection: 'pages', id, depth: 0, locale: l as never, fallbackLocale: 'ar', overrideAccess: false })) as unknown as { title: string; updatedAt?: string; status?: string };
    } catch {
      return null;
    }
  };
  let page = await find(lang);
  let useLang = lang;
  if (page && !drawable(page.title)) {
    page = await find('ar');
    useLang = 'ar';
  }
  if (!page) return null;
  const ctx = makeCtx(useLang);
  const site = await getSite(useLang);
  return { version: page.updatedAt ?? '', input: { dir: isArabicText(page.title) ? 'rtl' : ctx.lang.dir, org: drawable(site.name) ? site.name : (await getSite('ar')).name, kicker: ctx.t('og.archive'), title: page.title, host: host() } };
}

const PAGE_TITLES: Record<string, { title: string; lead?: string }> = {
  home: { title: 'home.hero.title', lead: 'home.hero.lead' },
  news: { title: 'news.title' },
  articles: { title: 'articles.title', lead: 'articles.lead' },
  books: { title: 'books.title', lead: 'books.lead' },
  magazines: { title: 'magazines.title', lead: 'magazines.lead' },
  events: { title: 'events.title' },
  forum: { title: 'forum.title', lead: 'forum.intro' },
  videos: { title: 'videos.title' },
  authors: { title: 'authors.title', lead: 'authors.lead' },
  timeline: { title: 'timeline.title', lead: 'timeline.lead' },
  topics: { title: 'topics.title', lead: 'topics.lead' },
  about: { title: 'nav.about' },
  contact: { title: 'nav.contact' },
  search: { title: 'search.title' },
  saved: { title: 'saved.title' },
};

/** Card for a list/landing page (home, a section, authors…). */
export async function pageCard(lang: string, key: string): Promise<{ input: OgInput; version: string } | null> {
  const spec = PAGE_TITLES[key];
  if (!spec || !isLocale(lang)) return null;
  let ctx = makeCtx(lang);
  let site = await getSite(lang);
  if (!drawable(ctx.t(spec.title)) || !drawable(site.name)) {
    ctx = makeCtx('ar');
    site = await getSite('ar');
  }
  const { t } = ctx;
  const title = t(spec.title);
  const lead = spec.lead && key !== 'home' ? t(spec.lead) : '';
  return {
    version: 'p1',
    input: {
      dir: isArabicText(title) ? 'rtl' : ctx.lang.dir,
      org: site.name,
      kicker: key === 'home' ? t('home.hero.eyebrow') : t('og.archive'),
      title,
      meta: lead || undefined,
      host: host(),
    },
  };
}
