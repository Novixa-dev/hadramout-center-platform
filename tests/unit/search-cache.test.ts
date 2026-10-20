import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/db/store.ts';
import { clearIndex, indexDocument, removeFromIndex, searchIndex, searchKindCounts } from '../../src/db/search.ts';

function freshStore(): Store {
  const db = new Store(':memory:');
  db.exec(`CREATE VIRTUAL TABLE search_index USING fts5(
    title, excerpt, body, authors, stems,
    lang UNINDEXED, doc_id UNINDEXED, kind UNINDEXED,
    tokenize = "unicode61 remove_diacritics 2"
  );`);
  return db;
}

const text = (title: string) => ({ ar: { title, excerpt: '', body: 'نص الدراسة', authors: '' } });

test('identical searches inside the TTL are served from the cache', () => {
  const db = freshStore();
  indexDocument(db, 'articles', 1, text('قراءة في تاريخ حضرموت'));
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 1);
  // delete behind the module's back: only a cached answer can still report the document
  db.exec('DELETE FROM search_index');
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 1, 'second call must be a cache hit');
  assert.deepEqual(searchKindCounts(db, 'تاريخ', 'ar'), {}, 'a different query shape is computed fresh');
});

test('every index write invalidates the cache', () => {
  const db = freshStore();
  indexDocument(db, 'articles', 1, text('تاريخ شبام'));
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 1);
  indexDocument(db, 'articles', 2, text('تاريخ سيئون'));
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 2, 'new document is visible immediately');
  removeFromIndex(db, 'articles', 1);
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 1, 'removal is visible immediately');
  clearIndex(db);
  assert.equal(searchIndex(db, { q: 'تاريخ', lang: 'ar' }).total, 0);
});

test('callers cannot corrupt the cache by mutating a result', () => {
  const db = freshStore();
  indexDocument(db, 'articles', 1, text('تاريخ شبام'));
  const first = searchIndex(db, { q: 'تاريخ', lang: 'ar' });
  first.hits[0]!.id = 999;
  first.hits.push({ id: 5, kind: 'x', rank: 0 });
  const again = searchIndex(db, { q: 'تاريخ', lang: 'ar' });
  assert.equal(again.hits.length, 1);
  assert.equal(again.hits[0]!.id, 1);
  const kinds = searchKindCounts(db, 'تاريخ', 'ar');
  kinds.articles = 42;
  assert.equal(searchKindCounts(db, 'تاريخ', 'ar').articles, 1);
});

test('the cache is per store, filters are part of the key', () => {
  const a = freshStore();
  const b = freshStore();
  indexDocument(a, 'articles', 1, text('تاريخ شبام'));
  assert.equal(searchIndex(a, { q: 'تاريخ', lang: 'ar' }).total, 1);
  assert.equal(searchIndex(b, { q: 'تاريخ', lang: 'ar' }).total, 0);
  indexDocument(a, 'news', 2, text('تاريخ المكلا'));
  assert.equal(searchIndex(a, { q: 'تاريخ', lang: 'ar', kinds: ['news'] }).total, 1);
  assert.equal(searchIndex(a, { q: 'تاريخ', lang: 'ar' }).total, 2);
});
