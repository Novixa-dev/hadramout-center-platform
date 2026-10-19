import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, esc, attrs, cx, jsonForScript } from '../../src/lib/html.ts';
import { normalizeArabic, stripClitics, toFtsQuery, authorKey, cleanPersonName, splitAuthors, toLatinDigits, readingMinutes } from '../../src/lib/arabic.ts';
import { parseArabicDate, toIsoDate, formatDate, formatHijri } from '../../src/lib/dates.ts';
import { openExtras } from '../../src/lib/extras.ts';
import { indexDocument, removeFromIndex, searchIndex, suggestTitles, toIndexText } from '../../src/db/search.ts';
import { loadConfig } from '../../src/config.ts';

describe('html template', () => {
  test('escapes interpolated values', () => {
    const evil = '<script>alert(1)</script>"\'&';
    assert.equal(html`<p>${evil}</p>`.toString(), '<p>&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;</p>');
  });
  test('raw and nested templates are not double-escaped', () => {
    const inner = html`<b>${'x<y'}</b>`;
    assert.equal(html`<p>${inner}${raw('<i>ok</i>')}</p>`.toString(), '<p><b>x&lt;y</b><i>ok</i></p>');
  });
  test('arrays, null, false are rendered sensibly', () => {
    assert.equal(html`${[1, 'a<', null, false, html`<i></i>`]}`.toString(), '1a&lt;<i></i>');
  });
  test('attrs escapes values and rejects unsafe names', () => {
    assert.equal(attrs({ href: '/a"b', hidden: true, x: false }).toString(), ' href="/a&quot;b" hidden');
    assert.throws(() => attrs({ 'on click="x"': 'y' }));
  });
  test('cx joins truthy classes', () => assert.equal(cx('a', false, 'b', null, undefined), 'a b'));
  test('jsonForScript neutralizes closing script tags', () => {
    assert.ok(!jsonForScript({ t: '</script><script>x' }).toString().includes('</script>'));
  });
  test('esc handles null/undefined', () => assert.equal(esc(null), ''));
});

describe('arabic utilities', () => {
  test('normalizeArabic unifies letters and strips marks', () => {
    assert.equal(normalizeArabic('أَحْمَد إبراهيم آل'), normalizeArabic('احمد ابراهيم ال'));
    assert.equal(normalizeArabic('مدرسة'), 'مدرسه');
    assert.equal(normalizeArabic('سـمـهـرم'), 'سمهرم');
    assert.equal(normalizeArabic('كتاب ٢٠٢٤'), 'كتاب 2024');
  });
  test('stripClitics removes definite-article prefixes only', () => {
    assert.equal(stripClitics('والتاريخ'), 'تاريخ');
    assert.equal(stripClitics('للتاريخ'), 'تاريخ');
    assert.equal(stripClitics('وزير'), 'وزير'); // و is not a clitic here
    assert.equal(stripClitics('الم'), 'الم'); // too short to strip
  });
  test('toFtsQuery builds a safe prefix query', () => {
    assert.equal(toFtsQuery('  '), '');
    assert.equal(toFtsQuery('سمهرم'), '"سمهرم"*');
    assert.equal(toFtsQuery('الموانئ'), '("الموانئ"* OR "موانئ"*)');
    assert.equal(toFtsQuery('ميناء "سمهرم" OR DROP'), '"ميناء"* AND "سمهرم"* AND "or"* AND "drop"*');
    assert.ok(!toFtsQuery('a" OR 1=1 --').includes('1=1'));
  });
  test('cleanPersonName strips honorifics and prayers', () => {
    assert.equal(cleanPersonName('أ.د. عبد الله سعيد بن جسار الجعيدي'), 'عبد الله سعيد بن جسار الجعيدي');
    assert.equal(cleanPersonName('الأستاذ الدكتور محمد باحليوة'), 'محمد باحليوة');
    assert.equal(cleanPersonName('الشيخ أحمد (رحمه الله)'), 'أحمد');
    assert.equal(cleanPersonName('د. عبد الله'), 'عبد الله'); // "عبد" must survive
  });
  test('authorKey merges spelling variants', () => {
    assert.equal(authorKey('د. أحمد هادي باحارثة'), authorKey('أحمد هادي باحارثه'));
    assert.equal(authorKey('أ.د. عبد الله الجعيدي'), authorKey('عبدالله الجعيدي'));
    assert.notEqual(authorKey('أحمد باحارثة'), authorKey('أحمد باوزير'));
  });
  test('splitAuthors', () => {
    assert.deepEqual(splitAuthors('أحمد باوزير، محمد سالم'), ['أحمد باوزير', 'محمد سالم']);
    assert.deepEqual(splitAuthors('علي سالم'), ['علي سالم']);
    // a title followed by "/" is part of the name, not a second author
    assert.deepEqual(splitAuthors('الشيخ / أحمد بن علي'), ['الشيخ أحمد بن علي']);
    assert.deepEqual(splitAuthors('أ.م.د / سالم الكثيري'), ['أ.م.د سالم الكثيري']);
    assert.deepEqual(splitAuthors('محمد / علي'), ['محمد', 'علي']);
  });
  test('digits and reading time', () => {
    assert.equal(toLatinDigits('٠١٢٣٤٥٦٧٨٩۰۱'), '012345678901');
    assert.equal(readingMinutes('كلمة '.repeat(340), 'ar'), 2);
    assert.equal(readingMinutes('', 'ar'), 1);
  });
});

describe('dates', () => {
  test('parseArabicDate handles legacy formats', () => {
    assert.deepEqual(parseArabicDate('04 أكتوبر 2026'), { year: 2026, month: 10, day: 4 });
    assert.deepEqual(parseArabicDate('٢٦ نوفمبر ٢٠٢٤'), { year: 2024, month: 11, day: 26 });
    assert.deepEqual(parseArabicDate('26 نوفمبر'), { month: 11, day: 26 });
    assert.equal(toIsoDate({ year: 2026, month: 10, day: 4 }), '2026-10-04');
    assert.equal(toIsoDate({ month: 11, day: 26 }), null);
  });
  test('formatDate localizes with latin digits', () => {
    assert.match(formatDate('2026-10-04', 'en'), /October/);
    assert.match(formatDate('2026-10-04', 'ar'), /^4 /);
    assert.equal(formatDate(null, 'ar'), '');
  });
  test('formatHijri returns an Umm al-Qura date', () => {
    assert.match(formatHijri('2026-10-04'), /144\d/);
  });
});

describe('config', () => {
  test('defaults are safe for development', () => {
    const c = loadConfig({ NODE_ENV: 'development' } as unknown as NodeJS.ProcessEnv);
    assert.equal(c.defaultLang, 'ar');
    assert.equal(c.translation.provider, 'none');
    assert.deepEqual(c.translation.eagerLangs, ['en']);
    assert.equal(c.translation.model, 'claude-opus-5-5');
  });
  test('provider needs its key', () => {
    assert.throws(() => loadConfig({ TRANSLATION_PROVIDER: 'anthropic' } as unknown as NodeJS.ProcessEnv), /ANTHROPIC_API_KEY/);
    assert.throws(() => loadConfig({ TRANSLATION_PROVIDER: 'nope' } as unknown as NodeJS.ProcessEnv), /TRANSLATION_PROVIDER/);
  });
});

describe('extras database (full-text index + savepoints)', () => {
  test('indexes Arabic text with normalization and replaces rows per document', () => {
    const db = openExtras(':memory:');
    indexDocument(db, 'articles', 7, { ar: toIndexText({ title: 'ميناء سمهرم', body: '<p>التجارة والموانئ في ظفار</p>', authors: ['أحمد باحارثة'] }), en: toIndexText({ title: 'Port of Sumhuram' }) });
    assert.equal(searchIndex(db, { q: 'سمهرم', lang: 'ar' }).total, 1);
    assert.equal(searchIndex(db, { q: 'الموانئ', lang: 'ar' }).total, 1, 'definite article is stripped');
    assert.equal(searchIndex(db, { q: 'موانئ', lang: 'ar' }).total, 1, 'matches the article form too');
    assert.equal(searchIndex(db, { q: 'sumhuram', lang: 'en' }).total, 1);
    assert.equal(searchIndex(db, { q: 'باحارثه', lang: 'ar' }).total, 1, 'teh-marbuta variant');
    indexDocument(db, 'articles', 7, { ar: toIndexText({ title: 'عنوان آخر' }) });
    assert.equal(searchIndex(db, { q: 'سمهرم', lang: 'ar' }).total, 0);
    assert.equal(suggestTitles(db, 'عنو', 'ar').length, 1);
    removeFromIndex(db, 'articles', 7);
    assert.equal(searchIndex(db, { q: 'عنوان', lang: 'ar' }).total, 0);
    db.close();
  });
  test('nested transactions roll back as a unit', () => {
    const db = openExtras(':memory:');
    assert.throws(() =>
      db.tx(() => {
        db.run("INSERT INTO pageviews (day, path, lang, count) VALUES ('d', '/a', 'ar', 1)");
        db.tx(() => db.run("INSERT INTO pageviews (day, path, lang, count) VALUES ('d', '/b', 'ar', 1)"));
        throw new Error('boom');
      }),
    );
    assert.equal(db.get<{ n: number }>('SELECT count(*) n FROM pageviews')?.n, 0);
    db.close();
  });
});

describe('cloudflare translation provider', () => {
  test('sends the segment protocol and parses markers; daily-limit error is retryable', async () => {
    const { CloudflareProvider } = await import('../../src/i18n/translation/cloudflare.ts');
    let sent: { messages: { role: string; content: string }[] } | null = null;
    const ok = new CloudflareProvider({
      accountId: 'acc', apiToken: 'tok', model: '@cf/mistralai/mistral-small-3.1-24b-instruct',
      fetchImpl: (async (_u: unknown, init: { body: string }) => {
        sent = JSON.parse(init.body);
        return new Response(JSON.stringify({ success: true, result: { response: '@@@1@@@\nHello\n@@@2@@@\nWorld' } }), { status: 200 });
      }) as unknown as typeof fetch,
    });
    const r = await ok.translate({ texts: ['مرحبا', 'عالم'], format: 'text', to: 'en', toName: 'English', glossary: [] });
    assert.deepEqual(r.texts, ['Hello', 'World']);
    assert.match(sent!.messages[1]!.content, /@@@1@@@\nمرحبا/);
    const limited = new CloudflareProvider({
      accountId: 'a', apiToken: 't', model: 'm',
      fetchImpl: (async () => new Response(JSON.stringify({ success: false, errors: [{ code: 4006, message: 'daily limit' }] }), { status: 429 })) as unknown as typeof fetch,
    });
    await assert.rejects(limited.translate({ texts: ['x'], format: 'text', to: 'en', toName: 'English', glossary: [] }), (e: Error & { retryable?: boolean }) => e.retryable === true);
  });
});
