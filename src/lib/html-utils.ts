import { htmlToText } from './sanitize.ts';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Add stable ids to h2/h3 in sanitized HTML and return the table of contents. */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let n = 0;
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const text = htmlToText(inner);
    if (!text) return `<h${level}>${inner}</h${level}>`;
    const id = `s${++n}`;
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}
