import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { html, raw, esc, attrs, cx, jsonForScript } from '../../src/lib/html.ts';
import { normalizeArabic, stripClitics, toFtsQuery, authorKey, cleanPersonName, splitAuthors, toLatinDigits, readingMinutes } from '../../src/lib/arabic.ts';
import { parseArabicDate, toIsoDate, formatDate, formatHijri } from '../../src/lib/dates.ts';
import { Store, migrate } from '../../src/db/store.ts';
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
    const c = loadConfig({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
    assert.equal(c.defaultLang, 'ar');
    assert.equal(c.translation.provider, 'none');
    assert.deepEqual(c.translation.eagerLangs, ['en']);
  });
  test('production refuses a weak session secret', () => {
    assert.throws(() => loadConfig({ NODE_ENV: 'production', SESSION_SECRET: 'short' } as NodeJS.ProcessEnv), /SESSION_SECRET/);
  });
  test('provider needs its key', () => {
    assert.throws(() => loadConfig({ TRANSLATION_PROVIDER: 'anthropic' } as NodeJS.ProcessEnv), /ANTHROPIC_API_KEY/);
    assert.throws(() => loadConfig({ TRANSLATION_PROVIDER: 'nope' } as NodeJS.ProcessEnv), /TRANSLATION_PROVIDER/);
  });
});

describe('store & migrations', () => {
  test('applies migrations once, supports FTS5 and savepoints', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hc-db-'));
    try {
      const store = new Store(join(dir, 't.db'));
      const first = migrate(store, join(import.meta.dirname, '../../migrations'));
      assert.ok(first.applied.includes('0001_init.sql'));
      const second = migrate(store, join(import.meta.dirname, '../../migrations'));
      assert.equal(second.applied.length, 0);

      store.run("INSERT INTO posts (id,type,status,title) VALUES (1,'news','published','عنوان')");
      store.run('INSERT INTO search_index (rowid,title,excerpt,body,authors,stems,lang,post_id,type) VALUES (1,?,?,?,?,?,?,?,?)', 'ميناء سمهرم', '', 'نص', '', '', 'ar', 1, 'news');
      assert.equal(store.all("SELECT rowid FROM search_index WHERE search_index MATCH '\"سمهرم\"*'").length, 1);

      assert.throws(() =>
        store.tx(() => {
          store.run("INSERT INTO posts (id,type,title) VALUES (2,'news','x')");
          store.tx(() => store.run("INSERT INTO posts (id,type,title) VALUES (3,'news','y')"));
          throw new Error('boom');
        }),
      );
      assert.equal(store.get<{ n: number }>('SELECT count(*) n FROM posts')?.n, 1, 'outer rollback undoes nested work');

      assert.throws(() => store.run("INSERT INTO posts (id,type,title) VALUES (9,'bogus','x')"), /CHECK/);
      store.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
