import { cleanPersonName } from './arabic.ts';

export type CiteKind = 'book' | 'article' | 'news' | 'magazine' | 'web';
export type CiteStyle = 'apa' | 'mla' | 'chicago' | 'harvard';

export interface CiteSource {
  kind: CiteKind;
  title: string;
  authors: string[];
  year?: number | null;
  /** full ISO date when known (news) */
  date?: string | null;
  publisher?: string;
  edition?: string;
  editors?: string[];
  translators?: string[];
  /** magazine / site the item appeared in */
  containerTitle?: string;
  issue?: number | null;
  url: string;
  /** ISO date the page was read */
  accessed: string;
  lang: string;
  isbn?: string;
  /** text for an unknown year ("n.d." / "د.ت.") */
  noYear: string;
}

interface Name {
  family: string;
  given: string;
}

const isArabicScript = (s: string) => /[؀-ۿ]/.test(s);

/** Split "Dr. Ahmed Hadi Ba Harith" / "د. أحمد هادي باحارثة" into family (last word) and given names. */
export function parseName(raw: string): Name {
  const cleaned = isArabicScript(raw) ? cleanPersonName(raw) : raw.replace(/^(?:Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Sheikh)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { family: parts[0] ?? '', given: '' };
  return { family: parts.at(-1) as string, given: parts.slice(0, -1).join(' ') };
}

const initials = (given: string) =>
  given
    .split(/\s+/)
    .filter(Boolean)
    .map((g) => `${[...g][0]?.toUpperCase() ?? ''}.`)
    .join(' ');

/** "Family, G. G." for Latin names; "Family، Given" for Arabic-script names. */
function inverted(raw: string, style: 'initials' | 'full'): string {
  const n = parseName(raw);
  if (!n.given) return n.family;
  if (isArabicScript(raw)) return `${n.family}، ${n.given}`;
  return `${n.family}, ${style === 'initials' ? initials(n.given) : n.given}`;
}

function direct(raw: string): string {
  const n = parseName(raw);
  return n.given ? `${n.given} ${n.family}` : n.family;
}

function listNames(names: string[], style: 'apa' | 'mla' | 'chicago' | 'harvard', arabic: boolean): string {
  if (names.length === 0) return '';
  const sep = arabic ? '، ' : ', ';
  const and = arabic ? ' و' : style === 'apa' ? ', & ' : ', and ';
  const fmt = (n: string, i: number) => (i === 0 || style === 'apa' || style === 'harvard' ? inverted(n, style === 'chicago' || style === 'mla' ? 'full' : 'initials') : direct(n));
  const f = names.map(fmt);
  if (f.length === 1) return f[0] as string;
  if (f.length === 2) return `${f[0]}${arabic ? ' و' : style === 'apa' ? ', & ' : ' and '}${f[1]}`;
  if (style === 'mla') return `${f[0]}, et al.`;
  if (f.length > 6 && style === 'apa') return `${f.slice(0, 6).join(sep)}, … ${f.at(-1)}`;
  return `${f.slice(0, -1).join(sep)}${and}${f.at(-1)}`;
}

const yearOf = (s: CiteSource) => (s.year ? String(s.year) : s.date ? s.date.slice(0, 4) : s.noYear);
const end = (s: string) => (/[.؟!?]$/.test(s) ? s : `${s}.`);

export function formatCitation(s: CiteSource, style: CiteStyle): string {
  const arabic = isArabicScript(s.title);
  const authors = listNames(s.authors, style, arabic);
  const year = yearOf(s);
  const parts: string[] = [];
  const ed = s.edition ? `(${s.edition})` : '';
  const translators = s.translators?.length ? `${arabic ? 'ترجمة' : 'Trans.'} ${s.translators.join(arabic ? '، ' : ', ')}` : '';
  const editors = s.editors?.length ? `${arabic ? 'تحقيق' : 'Ed.'} ${s.editors.join(arabic ? '، ' : ', ')}` : '';
  const accessed = s.accessed.slice(0, 10);
  const host = s.containerTitle ?? '';
  const isBook = s.kind === 'book';

  switch (style) {
    case 'apa': {
      if (authors) parts.push(end(authors));
      parts.push(`(${year}).`);
      parts.push(end(`${s.title}${ed ? ` ${ed}` : ''}${translators || editors ? ` (${[translators, editors].filter(Boolean).join('; ')})` : ''}`));
      if (!isBook && host) parts.push(end(`${host}${s.issue ? (arabic ? `، العدد ${s.issue}` : `, ${s.issue}`) : ''}`));
      if (isBook && s.publisher) parts.push(end(s.publisher));
      parts.push(s.url);
      break;
    }
    case 'mla': {
      if (authors) parts.push(end(authors));
      parts.push(end(`${s.title}`));
      const tail = [host && (s.issue ? `${host}${arabic ? '، ع' : ', no. '}${s.issue}` : host), isBook ? s.publisher : undefined, s.edition, year !== s.noYear ? year : undefined, s.url].filter(Boolean);
      parts.push(end(tail.join(arabic ? '، ' : ', ')));
      parts.push(end(`${arabic ? 'تاريخ الاطلاع' : 'Accessed'} ${accessed}`));
      break;
    }
    case 'chicago': {
      if (authors) parts.push(end(authors));
      parts.push(end(s.title));
      if (translators) parts.push(end(translators));
      if (editors) parts.push(end(editors));
      const tail = [host && (s.issue ? `${host}${arabic ? '، العدد' : ' no. '}${s.issue}` : host), isBook ? s.publisher : undefined, year !== s.noYear ? year : s.noYear].filter(Boolean);
      parts.push(end(tail.join(arabic ? '، ' : ', ')));
      parts.push(end(s.url));
      break;
    }
    case 'harvard': {
      if (authors) parts.push(authors);
      parts.push(`(${year})`);
      parts.push(end(`${s.title}${ed ? ` ${ed}` : ''}`));
      if (host) parts.push(end(`${host}${s.issue ? `, ${s.issue}` : ''}`));
      if (isBook && s.publisher) parts.push(end(s.publisher));
      parts.push(`${arabic ? 'متاح على' : 'Available at'}: ${s.url} (${arabic ? 'تاريخ الاطلاع' : 'Accessed'}: ${accessed}).`);
      break;
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const bibEsc = (v: string) => v.replace(/([&%$#_{}])/g, '\\$1');

export function bibKey(s: CiteSource): string {
  const fam = parseName(s.authors[0] ?? 'hc').family.replace(/[^\p{L}\p{N}]/gu, '') || 'hc';
  return `${fam}${s.year ?? 'nd'}${[...s.title.replace(/[^\p{L}]/gu, '')].slice(0, 3).join('')}`;
}

export function toBibtex(s: CiteSource): string {
  const type = s.kind === 'book' ? 'book' : s.kind === 'article' || s.kind === 'magazine' ? 'article' : 'misc';
  const fields: [string, string | undefined][] = [
    ['author', s.authors.map((a) => inverted(a, 'full').replace('،', ',')).join(' and ') || undefined],
    ['title', `{${bibEsc(s.title)}}`],
    ['year', s.year ? String(s.year) : undefined],
    ['publisher', s.kind === 'book' ? s.publisher : undefined],
    ['edition', s.edition],
    [type === 'article' ? 'journal' : 'howpublished', s.containerTitle],
    ['number', s.issue ? String(s.issue) : undefined],
    ['isbn', s.isbn],
    ['url', s.url],
    ['urldate', s.accessed.slice(0, 10)],
    ['language', s.lang],
  ];
  const body = fields.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${k === 'title' ? v : bibEsc(v as string)}}`);
  return `@${type}{${bibKey(s)},\n${body.join(',\n')}\n}\n`;
}

export function toRis(s: CiteSource): string {
  const ty = s.kind === 'book' ? 'BOOK' : s.kind === 'article' || s.kind === 'magazine' ? 'JOUR' : s.kind === 'news' ? 'NEWS' : 'ELEC';
  const lines: [string, string | undefined][] = [
    ['TY', ty],
    ...s.authors.map((a): [string, string] => ['AU', inverted(a, 'full')]),
    ['TI', s.title],
    ['PY', s.year ? String(s.year) : s.date?.slice(0, 4)],
    ['DA', s.date?.replaceAll('-', '/')],
    ['PB', s.publisher],
    ['ET', s.edition],
    ['JO', s.containerTitle],
    ['IS', s.issue ? String(s.issue) : undefined],
    ['SN', s.isbn],
    ['UR', s.url],
    ['Y2', s.accessed.slice(0, 10).replaceAll('-', '/')],
    ['LA', s.lang],
    ['ER', ''],
  ];
  return lines.filter(([, v]) => v !== undefined).map(([k, v]) => `${k}  - ${v}`).join('\r\n') + '\r\n';
}

export function toCslJson(s: CiteSource): string {
  const type = s.kind === 'book' ? 'book' : s.kind === 'article' || s.kind === 'magazine' ? 'article-journal' : s.kind === 'news' ? 'article-newspaper' : 'webpage';
  const item = {
    id: bibKey(s),
    type,
    title: s.title,
    author: s.authors.map((a) => {
      const n = parseName(a);
      return { family: n.family, given: n.given };
    }),
    issued: s.year ? { 'date-parts': [[s.year]] } : s.date ? { 'date-parts': [s.date.split('-').map(Number)] } : undefined,
    publisher: s.publisher,
    edition: s.edition,
    'container-title': s.containerTitle,
    issue: s.issue ?? undefined,
    ISBN: s.isbn,
    URL: s.url,
    accessed: { 'date-parts': [s.accessed.slice(0, 10).split('-').map(Number)] },
    language: s.lang,
  };
  return JSON.stringify([item], null, 2);
}

/** Google Scholar / Zotero friendly <meta> tags (Highwire Press names). */
export function scholarMeta(s: CiteSource, pdf?: string | null): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {
    citation_title: s.title,
    citation_language: s.lang,
    citation_abstract_html_url: s.url,
  };
  if (s.authors.length) out.citation_author = s.authors.map((a) => cleanPersonName(a));
  const date = s.date ? s.date.replaceAll('-', '/') : s.year ? String(s.year) : undefined;
  if (date) out.citation_publication_date = date;
  if (s.kind === 'book') {
    if (s.publisher) out.citation_publisher = s.publisher;
    if (s.isbn) out.citation_isbn = s.isbn;
  } else if (s.containerTitle) {
    out.citation_journal_title = s.containerTitle;
    if (s.issue) out.citation_issue = String(s.issue);
  }
  if (pdf) out.citation_pdf_url = pdf;
  return out;
}
