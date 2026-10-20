import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { clip, cleanDescription, describe as describeText, isoOrUndefined, twitterHandle, withPage, titlePart } from '../../src/lib/seo-text.ts';
import { breadcrumbJsonLd, collectionJsonLd, contentJsonLd, jsonLdString, personJsonLd, siteJsonLd } from '../../src/lib/jsonld.ts';
import { drawable, OG_HEIGHT, OG_WIDTH, renderOgCard } from '../../src/lib/og.ts';

const org = { name: 'مركز حضرموت', origin: 'https://example.org', logo: 'https://example.org/icons/icon-512.png' };
const authorUrl = (id: number) => `https://example.org/ar/authors/${id}`;
const baseDoc = { id: 7, title: 'قراءة في الأدب', status: 'published', publishedAt: '2024-03-12T00:00:00.000Z', datePrecision: 'day', updatedAt: '2025-01-01T10:00:00.000Z', authors: [{ id: 3, name: 'باحث' }] } as never;

describe('seo text helpers', () => {
  test('clip keeps short text and cuts long text at a word with an ellipsis', () => {
    assert.equal(clip('نص قصير', 50), 'نص قصير');
    const long = 'كلمة '.repeat(60);
    const out = clip(long, 60);
    assert.ok(out.length <= 60);
    assert.ok(out.endsWith('…'));
    assert.ok(!/\s…$/.test(out));
  });
  test('cleanDescription strips tags, entities and markdown marks', () => {
    assert.equal(cleanDescription('<p>مرحباً&nbsp;بالعالم</p> **غامق**'), 'مرحباً بالعالم غامق');
  });
  test('describe prefers the first candidate with real content and clips to ≈158 characters', () => {
    assert.equal(describeText('', 'قصير', 'هذا وصف أطول من عشرين حرفاً بالتأكيد'), 'هذا وصف أطول من عشرين حرفاً بالتأكيد');
    assert.ok(describeText('كلمة '.repeat(100)).length <= 158);
    assert.equal(describeText(null, undefined), '');
    assert.equal(describeText('قصير'), 'قصير', 'a short candidate is better than none');
  });
  test('titlePart limits the <title> text', () => assert.ok(titlePart('عنوان '.repeat(40)).length <= 54));
  test('isoOrUndefined never invents a date', () => {
    assert.equal(isoOrUndefined('2024-03-12'), '2024-03-12T00:00:00.000Z');
    assert.equal(isoOrUndefined('not a date'), undefined);
    assert.equal(isoOrUndefined(null), undefined);
  });
  test('twitterHandle reads profile URLs only', () => {
    assert.equal(twitterHandle('https://x.com/hadramout_c'), '@hadramout_c');
    assert.equal(twitterHandle('https://twitter.com/@abc/'), '@abc');
    assert.equal(twitterHandle('https://facebook.com/abc'), undefined);
    assert.equal(twitterHandle(undefined), undefined);
  });
  test('withPage suffixes archive pages after the first', () => {
    assert.equal(withPage('المقالات', 1, 'صفحة 1'), 'المقالات');
    assert.equal(withPage('المقالات', 3, 'صفحة 3'), 'المقالات — صفحة 3');
  });
});

describe('json-ld builders', () => {
  test('article: author URLs, publisher reference, dates, no rating', () => {
    const ld = contentJsonLd({ type: 'article', doc: baseDoc, url: 'https://example.org/ar/articles/7', lang: 'ar', org, authorUrl, category: 'دراسات' });
    assert.equal(ld['@type'], 'ScholarlyArticle');
    assert.deepEqual((ld.author as { url: string }[])[0]?.url, 'https://example.org/ar/authors/3');
    assert.equal(ld.datePublished, '2024-03-12T00:00:00.000Z');
    assert.equal(ld.dateModified, '2025-01-01T10:00:00.000Z');
    assert.equal(ld.articleSection, 'دراسات');
    assert.ok(!('aggregateRating' in ld) && !('review' in ld));
  });
  test('estimated dates are not published', () => {
    const ld = contentJsonLd({ type: 'news', doc: { ...(baseDoc as object), datePrecision: 'estimated' } as never, url: 'u', lang: 'ar', org, authorUrl });
    assert.ok(!('datePublished' in ld));
  });
  test('event: attendance mode only when it is known', () => {
    const none = contentJsonLd({ type: 'event', doc: baseDoc, url: 'u', lang: 'ar', org, authorUrl });
    assert.ok(!('eventAttendanceMode' in none) && !('location' in none));
    assert.equal(none['@type'], 'CreativeWork', 'no start date → not Event markup');
    assert.ok(!('startDate' in none));
    const venue = contentJsonLd({ type: 'event', doc: { ...(baseDoc as object), venue: 'قاعة المركز', eventDate: '2025-02-01T00:00:00.000Z' } as never, url: 'u', lang: 'ar', org, authorUrl });
    assert.equal(venue.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
    assert.equal(venue.startDate, '2025-02-01');
    assert.equal(venue['@type'], 'Event');
    assert.deepEqual(venue.location, { '@type': 'Place', name: 'قاعة المركز', address: 'قاعة المركز' });
  });
  test('book keeps ISBN/pages only when present and lists the free PDF', () => {
    const ld = contentJsonLd({ type: 'book', doc: { ...(baseDoc as object), isbn: '978-1', pages: 200, year: 2019 } as never, url: 'u', lang: 'ar', org, authorUrl, pdf: 'https://example.org/b.pdf' });
    assert.equal(ld.isbn, '978-1');
    assert.equal(ld.numberOfPages, 200);
    assert.equal(ld.datePublished, '2019');
    assert.ok((ld.workExample as { url: string }).url.endsWith('.pdf'));
  });
  test('site graph has Organization + WebSite with a SearchAction for the language', () => {
    const ld = siteJsonLd({ ...org, lang: 'ar', sameAs: ['https://facebook.com/x'] }) as { '@graph': Record<string, unknown>[] };
    const site = ld['@graph'].find((g) => g['@type'] === 'WebSite') as { potentialAction: { target: { urlTemplate: string } } };
    assert.equal(site.potentialAction.target.urlTemplate, 'https://example.org/ar/search?q={search_term_string}');
    assert.ok(ld['@graph'].some((g) => g['@type'] === 'ResearchOrganization'));
  });
  test('collection, person and breadcrumb pages are well-formed', () => {
    const c = collectionJsonLd({ name: 'مقالات', url: 'https://example.org/ar/articles', lang: 'ar', org, items: [{ name: 'أ', url: 'https://example.org/ar/articles/1' }], total: 909 }) as { mainEntity: { numberOfItems: number; itemListElement: { position: number }[] } };
    assert.equal(c.mainEntity.numberOfItems, 909);
    assert.equal(c.mainEntity.itemListElement[0]?.position, 1);
    const p = personJsonLd({ name: 'باحث', url: 'https://example.org/ar/authors/3', lang: 'ar', works: [], org }) as { mainEntity: Record<string, unknown> };
    assert.ok(!('description' in p.mainEntity), 'no biography is invented');
    assert.equal((breadcrumbJsonLd([{ name: 'a', url: 'u' }]).itemListElement as unknown[]).length, 1);
  });
  test('jsonLdString cannot close the script element', () => {
    assert.ok(!jsonLdString({ t: '</script><b>&' }).includes('<'));
  });
});

describe('social cards', () => {
  test('drawable() accepts Arabic/Latin and rejects scripts the bundled font lacks', () => {
    assert.ok(drawable('مركز حضرموت 2024 (Hadramout)'));
    assert.ok(!drawable('حضرموت 中心'));
    assert.ok(!drawable('Привет'));
  });
  test('renderOgCard returns a 1200×630 PNG for RTL and LTR text', async () => {
    for (const dir of ['rtl', 'ltr'] as const) {
      const png = await renderOgCard({ dir, org: 'مركز حضرموت', kicker: 'دراسة', title: 'قراءة في الأدب النِّسْوي الحضرمي (1998)', meta: 'باحث · 2024', host: 'example.org' });
      const m = await sharp(png).metadata();
      assert.equal(m.format, 'png');
      assert.equal(m.width, OG_WIDTH);
      assert.equal(m.height, OG_HEIGHT);
      assert.ok(png.length > 20_000 && png.length < 600_000, `unexpected size ${png.length}`);
    }
  });
  test('an unreadable cover does not break the card', async () => {
    const png = await renderOgCard({ dir: 'rtl', org: 'مركز حضرموت', title: 'عنوان', host: 'example.org', cover: Buffer.from('not an image') });
    assert.equal((await sharp(png).metadata()).width, OG_WIDTH);
  });
});

describe('magazine reference line', () => {
  const ref = 'المرجع : مجلة حضرموت الثقافية .. العدد 5 .. ص 103 رابط العدد 5: اضغط هنا ( 1 ) لم يكن حدّاد بن حسن الكاف مجرّد شاعر';
  test('is dropped from descriptions and excerpts, keeping the article text', async () => {
    const { stripReferenceLine } = await import('../../src/lib/seo-text.ts');
    assert.equal(stripReferenceLine(ref), '( 1 ) لم يكن حدّاد بن حسن الكاف مجرّد شاعر');
    assert.equal(cleanDescription(ref).startsWith('( 1 ) لم يكن'), true);
  });
  test('ordinary text and references without the issue-link tail are untouched', async () => {
    const { stripReferenceLine } = await import('../../src/lib/seo-text.ts');
    assert.equal(stripReferenceLine('نص عادي'), 'نص عادي');
    assert.equal(stripReferenceLine('المرجع : مجلة حضرموت الثقافية .. العدد 24 – 25 .. ص 4 رابط العدد 24 – 25 : اضغط هنا عندما يقام'), 'عندما يقام');
    assert.equal(stripReferenceLine(null), '');
    assert.equal(stripReferenceLine('المرجع : كتاب بلا رابط'), 'المرجع : كتاب بلا رابط');
  });
});
