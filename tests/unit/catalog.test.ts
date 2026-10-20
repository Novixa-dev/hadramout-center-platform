import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_COLUMNS, toCatalogRows, toCsv } from '../../src/lib/catalog.ts';

const url = (id: number) => `https://example.org/ar/books/${id}`;
const abs = (p: string) => (p.startsWith('http') ? p : `https://example.org${p}`);

test('rows keep missing values empty and join authors', () => {
  const [row] = toCatalogRows([{ id: 7, title: 'كتاب', authors: [{ name: 'أحمد' }, { name: 'سالم' }, { nope: 1 }], year: 2019, pdf: '/legacy-media/a.pdf' }], url, abs);
  assert.deepEqual(row, { id: 7, title: 'كتاب', authors: 'أحمد; سالم', year: 2019, publisher: '', isbn: '', pages: null, edition: '', issueNumber: null, url: url(7), pdf: 'https://example.org/legacy-media/a.pdf' });
});

test('CSV starts with a BOM, uses CRLF and has one header plus one line per row', () => {
  const csv = toCsv(toCatalogRows([{ id: 1, title: 'أ' }, { id: 2, title: 'ب' }], url, abs));
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines[0], CATALOG_COLUMNS.join(','));
  assert.equal(lines.length, 4, 'header + 2 rows + trailing empty');
  assert.equal(lines[3], '');
});

test('CSV quotes commas, quotes and newlines (RFC 4180)', () => {
  const csv = toCsv(toCatalogRows([{ id: 1, title: 'قال: "نعم"، ثم\nمضى, وعاد' }], url, abs));
  assert.ok(csv.includes('"قال: ""نعم""، ثم\nمضى, وعاد"'));
});

test('cells that a spreadsheet would run as formulas are neutralised', () => {
  const csv = toCsv(toCatalogRows([{ id: 1, title: '=HYPERLINK("http://evil","x")' }, { id: 2, title: '+1', publisher: '@cmd' }, { id: 3, title: '-5' }], url, abs));
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"",""x"")"`));
  assert.ok(csv.includes(",'+1,"));
  assert.ok(csv.includes(",'@cmd,"));
  assert.ok(csv.includes(",'-5,"));
  // numbers are not text and must stay numeric
  const [, ...body] = csv.slice(1).split('\r\n');
  assert.ok(body[0]?.startsWith('1,'));
});

test('numeric columns are not prefixed even when negative-looking text would be', () => {
  const csv = toCsv(toCatalogRows([{ id: 4, title: 'x', year: 1999, pages: 200 }], url, abs));
  assert.ok(csv.includes(',1999,'));
  assert.ok(csv.includes(',200,'));
});
