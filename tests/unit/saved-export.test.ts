import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toBibtex, toCslJson, toRis, type SavedItem } from '../../src/lib/saved-export.ts';

const when = new Date(Date.UTC(2026, 9, 20));
const origin = 'https://example.org';
const items: SavedItem[] = [
  { id: '12', title: 'قراءة في\nالأدب {النسوي} 100% & _نقد_', url: '/ar/articles/12', type: 'article' },
  { id: '5', title: 'Book', url: 'https://other.example/x', type: 'book' },
];

test('RIS: one line per field, absolute URLs, access date', () => {
  const ris = toRis(items, origin, when);
  assert.ok(ris.includes('TI  - قراءة في الأدب {النسوي} 100% & _نقد_\r\n'), 'newlines inside a title never break a RIS record');
  assert.ok(ris.includes('UR  - https://example.org/ar/articles/12\r\n'));
  assert.ok(ris.includes('UR  - https://other.example/x\r\n'), 'absolute URLs are kept');
  assert.ok(ris.includes('Y2  - 2026/10/20\r\n'));
  assert.equal((ris.match(/ER {2}- /g) ?? []).length, 2);
});

test('BibTeX: escaped specials, unique keys, ISO access date, no invented fields', () => {
  const bib = toBibtex([...items, { ...items[0]!, id: '12' }], origin, when);
  assert.ok(bib.includes('title = {{قراءة في الأدب \\{النسوي\\} 100\\% \\& \\_نقد\\_}}'));
  assert.ok(bib.includes('urldate = {2026-10-20}'));
  const keys = [...bib.matchAll(/@online\{([^,]+),/g)].map((m) => m[1]);
  assert.equal(new Set(keys).size, 3, 'duplicate saved items still get distinct keys');
  assert.ok(!/author|year|publisher =/.test(bib), 'the list does not know authors or years, so none are written');
});

test('CSL-JSON: valid JSON, webpage type, date-parts', () => {
  const parsed = JSON.parse(toCslJson(items, origin, when)) as { id: string; type: string; URL: string; accessed: { 'date-parts': number[][] } }[];
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]!.type, 'webpage');
  assert.equal(parsed[0]!.URL, 'https://example.org/ar/articles/12');
  assert.deepEqual(parsed[0]!.accessed['date-parts'], [[2026, 10, 20]]);
  assert.ok(!('author' in parsed[0]!) && !('issued' in parsed[0]!));
});

test('empty list exports nothing', () => {
  assert.equal(toRis([], origin, when), '');
  assert.equal(toBibtex([], origin, when), '');
  assert.equal(toCslJson([], origin, when), '[]');
});
