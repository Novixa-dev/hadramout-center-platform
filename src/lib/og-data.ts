import { authorsOf, coverOf, displayDate, makeCtx, isLocale } from './ctx.ts';
import { typeFromRoute } from './content-types.ts';
import { getDoc, getSite } from './data.ts';
import { loadConfig } from '../config.ts';
import { drawable, loadCoverBytes, type OgInput } from './og.ts';

const host = () => new URL(loadConfig().siteUrl).host;
const isArabicText = (s: string) => /\p{Script=Arabic}/u.test(s);

/** Card for one document of the archive; null when it does not exist or is not published. */
export async function docCard(lang: string, kind: string, id: number): Promise<{ input: OgInput; version: string } | null> {
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
  const issue = info.type === 'magazine' && doc.issueNumber ? t('meta.issue', { n: Number(doc.issueNumber) }) : '';
  const who = isEvent ? (doc.speaker as string | undefined) : authors.join('، ');
  const meta = [issue, who, info.type === 'book' && doc.year ? String(doc.year) : date].filter(Boolean).join(' · ');
  const c = coverOf(doc, 'large');
  const coverSrc = c?.src ?? (doc.youtubeId ? `https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg` : null);
  const cover = await loadCoverBytes(coverSrc);
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
      host: host(),
    },
  };
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

export const PAGE_CARD_KEYS = Object.keys(PAGE_TITLES);

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
