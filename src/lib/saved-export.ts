/**
 * Export formats for the browser-local reading list. The list stores only what the reader saved (title, URL, kind),
 * so each record is exported as a web page with an access date: no authors, years or publishers are invented.
 */
import { bibEsc } from './citations.ts';

export interface SavedItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim();
const abs = (origin: string, url: string): string => (/^https?:\/\//i.test(url) ? url : `${origin}${url}`);
const ymd = (d: Date): [number, number, number] => [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
const pad = (n: number): string => String(n).padStart(2, '0');

/** RIS (EndNote, Zotero, Mendeley, RefWorks). */
export function toRis(items: SavedItem[], origin: string, accessed: Date): string {
  const [y, m, d] = ymd(accessed);
  return items.map((i) => `TY  - ELEC\r\nTI  - ${oneLine(i.title)}\r\nUR  - ${abs(origin, i.url)}\r\nY2  - ${y}/${pad(m)}/${pad(d)}\r\nER  - \r\n`).join('');
}

/** BibTeX/BibLaTeX: braces around the title keep capitalisation, special characters are escaped. */
const bibEscape = (s: string): string => bibEsc(oneLine(s));

export function toBibtex(items: SavedItem[], origin: string, accessed: Date): string {
  const [y, m, d] = ymd(accessed);
  const used = new Set<string>();
  return items
    .map((i) => {
      let key = `hc-${i.type}-${i.id}`.replace(/[^A-Za-z0-9_-]/g, '');
      while (used.has(key)) key += 'x';
      used.add(key);
      return `@online{${key},\n  title = {{${bibEscape(i.title)}}},\n  url = {${abs(origin, i.url)}},\n  urldate = {${y}-${pad(m)}-${pad(d)}},\n  organization = {Hadhramout Center},\n}\n`;
    })
    .join('\n');
}

/** CSL-JSON (Zotero, Mendeley, Pandoc, citation-js). */
export function toCslJson(items: SavedItem[], origin: string, accessed: Date): string {
  const [y, m, d] = ymd(accessed);
  const records = items.map((i) => ({
    id: `hc-${i.type}-${i.id}`,
    type: 'webpage',
    title: oneLine(i.title),
    URL: abs(origin, i.url),
    publisher: 'Hadhramout Center',
    accessed: { 'date-parts': [[y, m, d]] },
  }));
  return JSON.stringify(records, null, 2);
}
