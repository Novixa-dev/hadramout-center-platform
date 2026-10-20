/**
 * Open catalogue export (CSV / JSON) of the Center's publications for researchers and librarians.
 * Pure functions only: the route handler does the data loading, so the format rules are unit-tested.
 */

export interface CatalogRow {
  id: number;
  title: string;
  authors: string;
  year: number | null;
  publisher: string;
  isbn: string;
  pages: number | null;
  edition: string;
  issueNumber: number | null;
  url: string;
  pdf: string;
}

export const CATALOG_COLUMNS: (keyof CatalogRow)[] = ['id', 'title', 'authors', 'year', 'publisher', 'isbn', 'pages', 'edition', 'issueNumber', 'url', 'pdf'];

interface SourceDoc {
  id: number;
  title: string;
  authors?: unknown;
  year?: number | null;
  publisher?: string | null;
  isbn?: string | null;
  pages?: number | null;
  edition?: string | null;
  issueNumber?: number | null;
  pdf?: string | null;
}

const authorNames = (authors: unknown): string =>
  (Array.isArray(authors) ? authors : [])
    .map((a) => (a && typeof a === 'object' ? String((a as { name?: unknown }).name ?? '') : ''))
    .filter(Boolean)
    .join('; ');

/** Maps stored documents to export rows. Missing values stay empty (never guessed). */
export function toCatalogRows(docs: SourceDoc[], pageUrl: (id: number) => string, absolutize: (path: string) => string): CatalogRow[] {
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    authors: authorNames(d.authors),
    year: d.year ?? null,
    publisher: d.publisher ?? '',
    isbn: d.isbn ?? '',
    pages: d.pages ?? null,
    edition: d.edition ?? '',
    issueNumber: d.issueNumber ?? null,
    url: pageUrl(d.id),
    pdf: d.pdf ? absolutize(d.pdf) : '',
  }));
}

/** Spreadsheet programs run cells that start with these characters as formulas; a leading apostrophe makes them plain text. */
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const UTF8_BOM = String.fromCharCode(0xfeff);

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Arabic text correctly. */
export function toCsv(rows: CatalogRow[]): string {
  const lines = [CATALOG_COLUMNS.join(','), ...rows.map((r) => CATALOG_COLUMNS.map((c) => cell(r[c])).join(','))];
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}
