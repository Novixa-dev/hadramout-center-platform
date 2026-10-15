/**
 * Pure text helpers for page metadata (no framework or database imports, so they are unit-testable).
 * Limits follow what search engines and messengers actually display: ≈60 characters of title,
 * ≈155–160 of description, ≈90 for social titles.
 */

const WS = /\s+/g;

/** Collapse whitespace and cut at a word boundary with an ellipsis when longer than `max`. */
export function clip(text: string | null | undefined, max: number): string {
  const t = (text ?? '').replace(WS, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const atWord = cut.replace(/[\s,;:،؛.\-–—]+\S*$/u, '');
  return `${(atWord.length >= max * 0.6 ? atWord : cut).replace(/[\s,;:،؛.\-–—]+$/u, '')}…`;
}

/** Remove Markdown/HTML leftovers and decorative leading phrases from a candidate description. */
export function cleanDescription(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[*_`#>]+/g, '')
    .replace(WS, ' ')
    .trim();
}

/** Leaves room for the " | site name" suffix so the full <title> stays near 60–70 characters. */
export const titlePart = (title: string) => clip(title, 54);
export const socialTitle = (title: string) => clip(title, 90);

/** First non-empty candidate, cleaned and clipped to the search-result length. */
export function describe(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    const t = cleanDescription(c);
    if (t.length >= 20) return clip(t, 158);
  }
  for (const c of candidates) {
    const t = cleanDescription(c);
    if (t) return clip(t, 158);
  }
  return '';
}

/** Dates in metadata must be real ISO strings; anything else is dropped rather than guessed. */
export function isoOrUndefined(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Handle from a profile URL like https://x.com/hadramout_c (for twitter:site). */
export function twitterHandle(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const m = url.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})\/?(?:\?.*)?$/);
  return m ? `@${m[1]}` : undefined;
}

/** Page suffix for paginated archive pages, e.g. "المقالات — صفحة 2". */
export function withPage(title: string, page: number, label: string): string {
  return page > 1 ? `${title} — ${label}` : title;
}
