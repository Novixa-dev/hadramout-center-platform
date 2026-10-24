import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { activeFilters, effectiveSort, isCustomised, parseListQuery, perPage, queryParams, toSearch } from '../../src/lib/list-query.ts';

describe('list query parsing', () => {
  test('reads supported filters and ignores garbage', () => {
    const q = parseListQuery({ year: '2021', category: '13', author: 'abc', pdf: '1', sort: 'oldest', page: '3', foo: 'bar' }, 'article');
    assert.equal(q.year, 2021);
    assert.equal(q.category, 13);
    assert.equal(q.author, undefined, 'non numeric id is ignored');
    assert.equal(q.pdf, undefined, 'pdf is not a facet of articles');
    assert.equal(q.sort, 'oldest');
    assert.equal(q.page, 3);
  });
  test('rejects negative, zero, huge and decimal numbers', () => {
    const q = parseListQuery({ year: '-5', category: '0', author: '1.5', page: '99999999999' }, 'article');
    assert.deepEqual([q.year, q.category, q.author, q.page], [undefined, undefined, undefined, 1]);
  });
  test('takes the first value of a repeated param and trims the text query', () => {
    assert.equal(parseListQuery({ q: ['  حضرموت   تاريخ ', 'x'] }, 'news').q, 'حضرموت تاريخ');
  });
  test('facets are per type', () => {
    assert.equal(parseListQuery({ pdf: '1' }, 'book').pdf, true);
    assert.equal(parseListQuery({ when: 'upcoming' }, 'event').when, 'upcoming');
    assert.equal(parseListQuery({ when: 'upcoming' }, 'book').when, undefined);
    assert.equal(parseListQuery({ q: 'x' }, 'magazine').q, 'x', 'issues can be searched');
    assert.equal(parseListQuery({ q: 'x', year: '2024' }, 'video').q, 'x');
    assert.equal(parseListQuery({ q: 'x', year: '2024' }, 'video').year, undefined, 'videos only offer the text search');
  });
  test('year=undated selects the undated bucket and round-trips through the URL', () => {
    const q = parseListQuery({ year: 'undated' }, 'article');
    assert.equal(q.year, -1);
    assert.equal(queryParams(q, 'article').year, 'undated');
    assert.equal(parseListQuery({ year: '-1' }, 'article').year, undefined);
  });
  test('views: default per type, unsupported views fall back', () => {
    assert.equal(parseListQuery({}, 'article').view, 'list');
    assert.equal(parseListQuery({ view: 'compact' }, 'article').view, 'compact');
    assert.equal(parseListQuery({ view: 'compact' }, 'book').view, 'grid');
    assert.equal(parseListQuery({}, 'news').view, 'grid');
  });
  test('relevance sort only with a text query', () => {
    assert.equal(parseListQuery({ sort: 'relevance' }, 'article').sort, undefined);
    assert.equal(parseListQuery({ sort: 'relevance', q: 'x' }, 'article').sort, 'relevance');
  });
});

describe('list query output', () => {
  test('defaults never appear in URLs', () => {
    const q = parseListQuery({ category: '13', sort: 'newest', view: 'list' }, 'article');
    assert.equal(toSearch(queryParams(q, 'article')), '?category=13');
    assert.equal(toSearch(queryParams(parseListQuery({}, 'article'), 'article')), '');
  });
  test('patches replace a value and reset paging when asked', () => {
    const q = parseListQuery({ category: '13', page: '4', year: '2020' }, 'article');
    assert.equal(toSearch(queryParams(q, 'article', { year: undefined, page: 1 })), '?category=13');
    assert.equal(toSearch(queryParams(q, 'article', { view: 'compact', page: 1 })), '?category=13&year=2020&view=compact');
  });
  test('effective sort: relevance for text, soonest first for upcoming events', () => {
    assert.equal(effectiveSort(parseListQuery({ q: 'نخيل' }, 'article')), 'relevance');
    assert.equal(effectiveSort(parseListQuery({ when: 'upcoming' }, 'event')), 'oldest');
    assert.equal(effectiveSort(parseListQuery({}, 'article')), 'newest');
  });
  test('active filters and customisation drive noindex', () => {
    assert.deepEqual(activeFilters(parseListQuery({ year: '2020', pdf: '1' }, 'book')), ['year', 'pdf']);
    assert.equal(isCustomised(parseListQuery({}, 'book'), 'book'), false);
    assert.equal(isCustomised(parseListQuery({ sort: 'title' }, 'book'), 'book'), true);
    assert.equal(isCustomised(parseListQuery({ page: '2' }, 'book'), 'book'), false, 'paging alone is not a filter');
  });
  test('compact view lists more per page', () => assert.ok(perPage('article', 'compact') > perPage('article', 'list')));
});
