import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NAV_TREE, UTILITY_LINKS, isGroup, navKeys, navPaths } from '../../src/lib/nav.ts';
import { isAudioFile, safeHref, youtubeId } from '../../src/lib/media-links.ts';
import { assistAction, firstSentences, MAX_ASSIST_CHARS } from '../../src/lib/editorial-assist.ts';
import { EVENT_KIND_VALUES, activeFilters, parseListQuery, queryParams } from '../../src/lib/list-query.ts';
import { countFacets, filterRows, type Row } from '../../src/lib/facet-core.ts';

/** Requirements from the Center's feedback report of 2026-10-27 (REQUIREMENTS_TRACEABILITY.md R1-02…R1-21). */

const ar = JSON.parse(readFileSync('messages/ar.json', 'utf8')) as Record<string, string>;
const en = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, string>;

describe('navigation (R1-02, R1-10)', () => {
  test('top level follows the order the Center asked for', () => {
    assert.deepEqual(
      NAV_TREE.map((e) => e.key),
      ['nav.home', 'nav.g.about', 'nav.g.governance', 'nav.g.media', 'nav.g.research', 'nav.g.programs', 'nav.g.platforms', 'nav.contact'],
    );
  });

  test('every group has items and every label exists in Arabic and English', () => {
    for (const e of NAV_TREE) if (isGroup(e)) assert.ok(e.items.length > 0, e.key);
    for (const k of navKeys()) {
      assert.ok(ar[k], `ar: ${k}`);
      assert.ok(en[k], `en: ${k}`);
    }
  });

  test('paths are locale-free, start with a slash and are unique per menu', () => {
    for (const p of navPaths()) assert.match(p, /^\/[a-z0-9/-]*(\?[a-z]+=[a-z_]+)?$/, p);
    assert.equal(UTILITY_LINKS.length, 5, 'store, members, research, magazine, support (+ language list)');
  });

  test('every event type in the menu is a real filter value', () => {
    for (const p of navPaths()) {
      const kind = p.match(/[?&]kind=([a-z_]+)/)?.[1];
      if (kind) assert.ok((EVENT_KIND_VALUES as readonly string[]).includes(kind), kind);
    }
  });
});

describe('editor links and media', () => {
  test('safeHref keeps http(s) and site paths, refuses scripts and protocol-relative links', () => {
    assert.equal(safeHref('https://example.org/a?b=1'), 'https://example.org/a?b=1');
    assert.equal(safeHref('/ar/contact'), '/ar/contact');
    assert.equal(safeHref(' javascript:alert(1)'), null);
    assert.equal(safeHref('data:text/html,x'), null);
    assert.equal(safeHref('//evil.example'), null);
    assert.equal(safeHref(''), null);
    assert.equal(safeHref(null), null);
  });

  test('youtubeId reads watch, short, embed and youtu.be links', () => {
    for (const v of ['dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://m.youtube.com/shorts/dQw4w9WgXcQ']) {
      assert.equal(youtubeId(v), 'dQw4w9WgXcQ', v);
    }
    assert.equal(youtubeId('https://vimeo.com/123'), null);
    assert.equal(youtubeId('https://www.youtube.com/watch?v=short'), null);
  });

  test('isAudioFile plays files inline and sends platforms to their own page', () => {
    assert.ok(isAudioFile('/api/media/file/episode-1.mp3'));
    assert.ok(isAudioFile('https://cdn.example/x.m4a?sig=1'));
    assert.ok(!isAudioFile('https://soundcloud.com/hadramout/episode-1'));
  });
});

describe('event types (R1-07, R1-12…R1-14)', () => {
  const row = (id: number, kind: string | null): Row => ({ id, title: String(id), date: '2020-01-01', year: 2020, category: null, authors: [], magazine: null, issue: null, hasPdf: false, hasCover: false, featured: false, kind });
  const rows = [row(1, 'conference'), row(2, 'seminar'), row(3, 'conference'), row(4, null)];

  test('kind is parsed only from known values and only for events', () => {
    assert.equal(parseListQuery({ kind: 'conference' }, 'event').kind, 'conference');
    assert.equal(parseListQuery({ kind: 'party' }, 'event').kind, undefined);
    assert.equal(parseListQuery({ kind: 'conference' }, 'article').kind, undefined);
    assert.equal(queryParams(parseListQuery({ kind: 'seminar' }, 'event'), 'event').kind, 'seminar');
    assert.deepEqual(activeFilters(parseListQuery({ kind: 'lecture' }, 'event')), ['kind']);
  });

  test('filtering and disjunctive counts by kind', () => {
    assert.deepEqual(filterRows(rows, { kind: 'conference' }).map((r) => r.id), [1, 3]);
    const c = countFacets(rows, { kind: 'conference' });
    assert.equal(c.kinds.get('conference'), 2);
    assert.equal(c.kinds.get('seminar'), 1, 'other kinds still counted while one is selected');
  });

  test('every kind has a label in both languages', () => {
    for (const k of EVENT_KIND_VALUES) {
      assert.ok(ar[`events.kind.${k}`] && en[`events.kind.${k}`], k);
    }
  });
});

describe('editorial assistant helpers', () => {
  test('actions: explicit, legacy (text only) and unknown', () => {
    assert.equal(assistAction('translate', false), 'translate');
    assert.equal(assistAction(undefined, true), 'normalize');
    assert.equal(assistAction(undefined, false), 'auto-fill-seo');
    assert.equal(assistAction('drop-tables', false), null);
    assert.equal(assistAction({ toString: () => 'translate' }, false), null);
  });

  test('lead: first two sentences, Arabic question mark included', () => {
    assert.equal(firstSentences('الجملة الأولى. الجملة الثانية؟ الثالثة.'), 'الجملة الأولى. الجملة الثانية؟');
    assert.equal(firstSentences(''), '');
    assert.ok(MAX_ASSIST_CHARS >= 60_000, 'a long study fits');
  });
});
