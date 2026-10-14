import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDetail, listingIds, makeDateEstimator, unwrapNextImage, uploadMonth } from '../../src/importer/legacy.ts';

const fx = (name: string) => readFileSync(join(import.meta.dirname, '../fixtures/legacy', name), 'utf8');

describe('legacy parser (real pages)', () => {
  test('news: title, date, dateline split from body, cover unwrapped', () => {
    const { post, warnings } = parseDetail('news', 10337, fx('news-10337.html'));
    assert.ok(post);
    assert.deepEqual(warnings, []);
    assert.match(post.title, /اليونسكو/);
    assert.equal(post.publishedAt, '2026-10-04');
    assert.equal(post.datePrecision, 'day');
    assert.equal(post.fields.dateline, 'المكلا / إعلام المركز');
    assert.ok(!post.body.includes('إعلام المركز'));
    assert.match(post.body, /^<p>/);
    assert.equal(post.cover, 'https://files.hadramout.center/media/2026/10/image-9.png');
    assert.ok(post.excerpt.length > 50 && post.excerpt.length <= 225);
  });

  test('article: category, author, issue link, long body', () => {
    const { post, warnings } = parseDetail('article', 9595, fx('articles-9595.html'));
    assert.ok(post);
    assert.deepEqual(warnings, []);
    assert.match(post.title, /هجرة الحضارمة/);
    assert.deepEqual(post.terms, [{ taxonomy: 'article_category', name: 'ترجمة' }]);
    assert.equal(post.fields.author, 'منى عمر عوض العماري');
    assert.deepEqual(post.authors, ['منى عمر عوض العماري']);
    assert.equal(post.data.magazine_id, 9079);
    assert.ok(post.body.length > 5000, `body length ${post.body.length}`);
    assert.ok(!/<script|onclick/i.test(post.body));
  });

  test('book: author/publisher/edition and description', () => {
    const { post, warnings } = parseDetail('book', 9882, fx('books-9882.html'));
    assert.ok(post);
    assert.deepEqual(warnings, ['missing publication year']);
    assert.match(post.title, /جهود علماء حضرموت النحوية/);
    assert.equal(post.fields.author, 'د. لطفي عمر بن الشيخ أبوبكر');
    assert.equal(post.fields.publisher, 'مركز حضرموت للدراسات التاريخية');
    assert.equal(post.fields.edition, 'الأولى');
    assert.match(post.body, /ثلاث رسائل/);
    assert.equal(post.publishedAt, '2026-02-01');
    assert.equal(post.datePrecision, 'estimated');
    assert.equal(post.data.year, undefined, 'a year is only used when the legacy page states one');
  });

  test('book with an explicit publication year (تاريخ النشر)', () => {
    const { post, warnings } = parseDetail('book', 9308, fx('books-9308.html'));
    assert.ok(post);
    assert.match(post.title, /التاريخ والمؤرخون الحضارمة/);
    assert.ok(post.body.length > 300);
    assert.equal(post.data.year, 2025);
    assert.equal(post.publishedAt, '2025-01-01');
    assert.equal(post.datePrecision, 'year');
    assert.ok(!warnings.includes('missing publication year'));
  });

  test('magazine: issue number, pdf, contents body, month precision', () => {
    const { post, warnings } = parseDetail('magazine', 10304, fx('magazines-10304.html'));
    assert.ok(post);
    assert.deepEqual(warnings, []);
    assert.equal(post.data.issue_number, 41);
    assert.match(String(post.data.pdf), /\.pdf$/);
    assert.match(post.body, /محتويات العدد/);
    assert.equal(post.publishedAt, '2026-10-01');
    assert.equal(post.datePrecision, 'month');
  });

  test('event: date range, speaker and moderator extracted', () => {
    const { post, warnings } = parseDetail('event', 8458, fx('events-8458.html'));
    assert.ok(post);
    assert.deepEqual(warnings, []);
    assert.equal(post.publishedAt, '2024-11-26');
    assert.equal(post.fields.speaker, 'د. طه حسين الحضرمي');
    assert.match(post.fields.moderator ?? '', /مقيدحان/);
  });

  test('forum: meeting credentials are stripped, emoji hotlinks replaced, YouTube kept', () => {
    const { post } = parseDetail('forum', 7813, fx('forum-7813.html'));
    assert.ok(post);
    assert.ok(!/zoom|Meeting ID|Passcode|102030|81214025567/i.test(post.body), post.body);
    assert.ok(!/fbcdn/.test(post.body));
    assert.equal(post.data.youtube_id, 'SfL5-AlIHqw');
    assert.equal(post.publishedAt, '2024-10-12');
    assert.equal(post.fields.venue?.includes('قاعة منتدى عميد الوفاء'), true);
    assert.match(post.body, /youtube-nocookie\.com\/embed\/SfL5-AlIHqw/);
  });

  test('video: youtube id and thumbnail', () => {
    const { post } = parseDetail('video', 9934, fx('videos-9934.html'));
    assert.ok(post);
    assert.equal(post.data.youtube_id, '8mLzjsj-kw0');
    assert.equal(post.cover, 'https://i.ytimg.com/vi/8mLzjsj-kw0/hqdefault.jpg');
    assert.match(post.title, /كاتب وكتاب/);
  });

  test('video without YouTube still parses (warns about embed or keeps embed_url)', () => {
    const { post, warnings } = parseDetail('video', 10158, fx('videos-10158.html'));
    assert.ok(post);
    assert.ok(post.data.youtube_id || post.data.embed_url || warnings.includes('missing video embed'));
  });

  test('404 pages return null', () => {
    const { post } = parseDetail('news', 1, '<html><body><h1>لم نتمكن من العثور على الصفحة</h1></body></html>');
    assert.equal(post, null);
  });
});

describe('legacy helpers', () => {
  test('listingIds', () => {
    assert.deepEqual(listingIds('books', fx('list-books.html')).sort((a, b) => a - b).slice(0, 3), [9117, 9120, 9122]);
    assert.equal(listingIds('books', fx('list-books.html')).length, 12);
  });
  test('unwrapNextImage', () => {
    assert.equal(
      unwrapNextImage('/_next/image?url=https%3A%2F%2Ffiles.hadramout.center%2Fmedia%2F2026%2F02%2Fa.jpg&w=1920&q=75'),
      'https://files.hadramout.center/media/2026/02/a.jpg',
    );
    assert.equal(unwrapNextImage('https://i.ytimg.com/vi/x/hq.jpg'), 'https://i.ytimg.com/vi/x/hq.jpg');
    assert.equal(unwrapNextImage(undefined), null);
  });
  test('uploadMonth', () => {
    assert.equal(uploadMonth('https://files.hadramout.center/media/2025/09/x.jpg'), '2025-09-01');
    assert.equal(uploadMonth('https://example.org/x.jpg'), null);
  });
  test('makeDateEstimator interpolates between dated news ids', () => {
    const est = makeDateEstimator([
      { id: 1000, date: '2024-01-01' },
      { id: 2000, date: '2024-01-11' },
    ]);
    assert.equal(est(1500), '2024-01-06');
    assert.equal(est(10), '2024-01-01');
    assert.equal(est(5000), '2024-01-11');
    assert.equal(makeDateEstimator([])(5), null);
  });
});
