import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { BOOK_EVENTS, BOOK_TITLES, bookDateText } from '../../src/seed/book-records-data.ts';
import { bookExcerpt } from '../../src/seed/book-records.ts';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** What a broken PDF text layer leaves behind: Latin letters and symbols inside Arabic words. */
const GARBLED = /[À-ɏ]|[¡-ª¬-º¼-¿]|�/;

const byKey = (key: string) => {
  const e = BOOK_EVENTS.find((x) => x.key === key);
  assert.ok(e, key);
  return e;
};

describe('records transcribed from the decade book', () => {
  it('counts match what the book prints', () => {
    const of = (kind: string, c = 'events') => BOOK_EVENTS.filter((e) => e.collection === c && e.kind === kind).length;
    assert.equal(of('conference'), 8, 'seven in the series and Jakarta');
    assert.equal(of('seminar'), 12);
    assert.equal(of('panel'), 12);
    assert.equal(of('competition'), 8, 'four research years and four film themes');
    assert.equal(BOOK_EVENTS.filter((e) => e.collection === 'forum_events').length, 41, 'pp. 77–79');
    assert.equal(byKey('conf-7').papers?.length, 37);
    assert.equal(byKey('conf-jakarta').papers?.length, 21);
  });

  it('every record is findable: exactly one of an old-site match or a new title, with a stable key', () => {
    const keys = BOOK_EVENTS.map((e) => e.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const e of BOOK_EVENTS) assert.ok(Boolean(e.match) !== Boolean(e.title), e.key);
    const titles = BOOK_EVENTS.flatMap((e) => (e.title ? [`${e.collection}:${e.title}`] : []));
    assert.equal(new Set(titles).size, titles.length);
  });

  it('a date is a real calendar date, ends after it starts, and a correction names the value it replaces', () => {
    for (const e of BOOK_EVENTS) {
      for (const d of [e.date, e.end, e.was]) if (d) assert.match(d, ISO, e.key);
      if (e.date) assert.equal(new Date(`${e.date}T00:00:00Z`).toISOString().slice(0, 10), e.date, e.key);
      if (e.end) assert.ok((e.date as string) < e.end, e.key);
      if (e.was) assert.ok(e.date && e.match && e.date !== e.was, e.key);
      assert.ok(e.page >= 30 && e.page <= 79, `${e.key}: printed page`);
    }
  });

  it('only the dates with a second source are corrected', () => {
    const corrected = BOOK_EVENTS.filter((e) => e.was).map((e) => e.key).sort();
    assert.deepEqual(corrected, ['conf-2', 'conf-3', 'conf-jakarta', 'lec-ports', 'lec-stars', 'sem-1', 'sem-2'].sort());
  });

  it('names and titles survived transcription: nothing empty, no text-layer debris', () => {
    for (const e of BOOK_EVENTS) {
      for (const text of [e.title, e.speaker, e.moderator, e.venue, ...(e.researchers ?? [])]) if (text) assert.doesNotMatch(text, GARBLED, e.key);
      for (const [researcher, title, note] of e.papers ?? []) {
        assert.ok(researcher.trim() && title.trim(), e.key);
        assert.doesNotMatch(`${researcher}${title}${note ?? ''}`, GARBLED, e.key);
      }
    }
  });

  it('p. 67 lecturers are not trusted: a lecture the old site never announced names nobody', () => {
    for (const key of ['lec-2023-national', 'lec-2023-raydah', 'lec-2024-farming']) assert.equal(byKey(key).speaker, undefined, key);
    assert.equal(byKey('lec-shibam').speaker, 'د. محمد صالح بلعفير', 'the announcement, not the shifted column');
  });

  it('books the old catalogue lacks carry their printed page', () => {
    assert.equal(BOOK_TITLES.length, 4);
    for (const b of BOOK_TITLES) {
      assert.ok(b.title && b.excerpt && b.page >= 88 && b.page <= 105, b.title);
      assert.doesNotMatch(`${b.title}${b.excerpt}`, GARBLED);
    }
  });

  it('a new record has a card text long enough to describe it, and invents nothing', () => {
    for (const e of BOOK_EVENTS.filter((x) => x.title)) assert.ok(bookExcerpt(e).length >= 30, e.key);
    assert.equal(bookExcerpt(byKey('conf-6')), byKey('conf-6').title, 'no date or place in the book, so none here');
  });

  it('dates read the way the book writes them', () => {
    assert.equal(bookDateText('2016-12-20', '2016-12-21'), '20–21 ديسمبر 2016م');
    assert.equal(bookDateText('2019-12-19'), '19 ديسمبر 2019م');
    assert.equal(bookDateText('2017-11-30', '2017-12-01'), '30 نوفمبر – 1 ديسمبر 2017م');
  });
});
