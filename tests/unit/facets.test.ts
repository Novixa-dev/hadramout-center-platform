import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UNDATED, buildTopicTree, categoryScope, countFacets, filterRows, neighbours, relatedRows, sortRows, type Row } from '../../src/lib/facet-core.ts';

const row = (id: number, o: Partial<Row> = {}): Row => ({ id, title: `t${id}`, date: null, year: null, category: null, authors: [], magazine: null, issue: null, hasPdf: false, hasCover: false, featured: false, ...o });

const rows: Row[] = [
  row(1, { title: 'باء', date: '2020-05-01', year: 2020, category: 10, authors: [1], hasPdf: true }),
  row(2, { title: 'ألف', date: '2021-01-01', year: 2021, category: 10, authors: [1, 2] }),
  row(3, { title: 'جيم', date: '2021-06-01', year: 2021, category: 11, authors: [2], hasPdf: true }),
  row(4, { title: 'دال', date: null, year: null, category: null, authors: [] }),
  row(5, { title: 'هاء', date: '2019-02-01', year: 2019, category: 12, authors: [3], magazine: 7 }),
];

describe('filtering', () => {
  test('combines filters with AND', () => {
    assert.deepEqual(filterRows(rows, { year: 2021 }).map((r) => r.id), [2, 3]);
    assert.deepEqual(filterRows(rows, { year: 2021, author: 2, pdf: true }).map((r) => r.id), [3]);
    assert.deepEqual(filterRows(rows, { categories: new Set([10, 11]) }).map((r) => r.id), [1, 2, 3]);
    assert.deepEqual(filterRows(rows, { magazine: 7 }).map((r) => r.id), [5]);
  });
  test('search ids restrict the result', () => assert.deepEqual(filterRows(rows, { ids: new Set([2, 5]) }).map((r) => r.id), [2, 5]));
  test('upcoming/past split on the given day and undated rows never match', () => {
    const ev = [row(1, { date: '2030-01-01' }), row(2, { date: '2020-01-01' }), row(3, { date: null })];
    assert.deepEqual(filterRows(ev, { when: 'upcoming', today: '2025-06-01' }).map((r) => r.id), [1]);
    assert.deepEqual(filterRows(ev, { when: 'past', today: '2025-06-01' }).map((r) => r.id), [2]);
  });
});

describe('sorting', () => {
  test('newest/oldest by date with undated documents always last', () => {
    assert.deepEqual(sortRows(rows, 'newest').map((r) => r.id), [3, 2, 1, 5, 4]);
    assert.deepEqual(sortRows(rows, 'oldest').map((r) => r.id), [5, 1, 2, 3, 4]);
  });
  test('title uses Arabic collation', () => assert.deepEqual(sortRows(rows, 'title').map((r) => r.title), ['ألف', 'باء', 'جيم', 'دال', 'هاء']));
  test('relevance follows the rank map, falling back to date', () => {
    const rank = new Map([[5, 0], [1, 1]]);
    assert.deepEqual(sortRows(rows, 'relevance', rank).slice(0, 2).map((r) => r.id), [5, 1]);
  });
  test('issues break date ties: higher issue number first when newest', () => {
    const issues = [row(1, { date: '2020-01-01', issue: 5 }), row(2, { date: '2020-01-01', issue: 6 })];
    assert.deepEqual(sortRows(issues, 'newest').map((r) => r.id), [2, 1]);
  });
  test('sorting does not mutate its input', () => {
    const copy = rows.map((r) => r.id);
    sortRows(rows, 'title');
    assert.deepEqual(rows.map((r) => r.id), copy);
  });
});

describe('undated documents', () => {
  test('are counted and can be filtered, so they do not silently vanish from the year facet', () => {
    assert.equal(countFacets(rows, {}).undated, 1);
    assert.deepEqual(filterRows(rows, { year: UNDATED }).map((r) => r.id), [4]);
    // the count ignores the year filter itself but respects the others
    assert.equal(countFacets(rows, { pdf: true }).undated, 0);
    assert.equal(countFacets(rows, { year: 2021 }).undated, 1);
  });
});

describe('facet counts', () => {
  test('are exact for each facet given the other filters', () => {
    const c = countFacets(rows, { year: 2021 });
    // categories are counted over the 2021 documents only
    assert.deepEqual([...c.categories].sort(), [[10, 1], [11, 1]]);
    // years ignore the year filter itself (so the user can switch year) but would respect others
    assert.deepEqual([...c.years].sort(), [[2019, 1], [2020, 1], [2021, 2]]);
    assert.equal(c.pdf, 1);
  });
  test('selecting a facet option yields exactly the advertised number of results', () => {
    const base = { year: 2021 };
    const c = countFacets(rows, base);
    for (const [cat, n] of c.categories) assert.equal(filterRows(rows, { ...base, categories: new Set([cat]) }).length, n);
  });
  test('author counts respect the other filters', () => {
    const c = countFacets(rows, { pdf: true });
    assert.deepEqual([...c.authors].sort(), [[1, 1], [2, 1]]);
  });
});

describe('topics', () => {
  const cats = [
    { id: 1, name: 'الأدب', parent: null, order: 20 },
    { id: 2, name: 'التاريخ', parent: null, order: 10 },
    { id: 3, name: 'قصة', parent: 1 },
    { id: 4, name: 'شعر', parent: 1 },
    { id: 5, name: 'تراث', parent: 2 },
    { id: 6, name: 'يتيم', parent: 99 },
  ];
  const counts = new Map([[3, 5], [4, 2], [5, 1], [6, 1]]);
  const { roots, byId } = buildTopicTree(cats, counts);
  test('orders roots by `order` and totals include children', () => {
    assert.deepEqual(roots.map((r) => r.name).slice(0, 2), ['التاريخ', 'الأدب']);
    assert.equal(byId.get(1)?.total, 7);
    assert.deepEqual(byId.get(1)?.children.map((c) => c.name), ['قصة', 'شعر']);
  });
  test('a category whose parent is missing is kept as a root, never dropped', () => assert.ok(roots.some((r) => r.name === 'يتيم')));
  test('scope: a topic covers itself and its children, a sub-category only itself', () => {
    assert.deepEqual([...categoryScope(1, byId)].sort(), [1, 3, 4]);
    assert.deepEqual([...categoryScope(3, byId)], [3]);
    assert.deepEqual([...categoryScope(404, byId)], [404]);
  });
});

describe('neighbours and related', () => {
  const sorted = sortRows(rows, 'newest');
  test('newer/older neighbours in publication order', () => {
    assert.equal(neighbours(sorted, 2).newer?.id, 3);
    assert.equal(neighbours(sorted, 2).older?.id, 1);
    assert.equal(neighbours(sorted, 3).newer, null);
    assert.deepEqual(neighbours(sorted, 999), { newer: null, older: null });
  });
  test('related uses category, then author, then issue — and nothing random', () => {
    const base = rows[0]!; // category 10, author 1
    assert.deepEqual(relatedRows(rows, base).map((r) => r.id), [2]);
    assert.deepEqual(relatedRows(rows, row(99)).length, 0);
  });
});
