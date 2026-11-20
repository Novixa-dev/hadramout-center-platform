import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { byPriority, ctr, pickPromo, promoHeadScript, promoHref, promoKey, promoState, promoVisible, trackingAllowed, validPromoLink, type PromoRule, type StoreLike } from '../../src/lib/promotions.ts';
import { toPromoView } from '../../src/lib/promotion-view.ts';
import { openExtras } from '../../src/lib/extras.ts';
import { deletePromoStats, promoTotals, recordPromoEvent } from '../../src/lib/promo-stats.ts';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-11-20T12:00:00Z');
const store = (o: Record<string, string> = {}): StoreLike & { o: Record<string, string> } => ({ o, getItem: (k) => (k in o ? o[k]! : null) });
const rule = (over: Partial<PromoRule> = {}): PromoRule => ({ id: 1, format: 'card', start: NOW - HOUR, end: NOW + HOUR, pages: [], device: 'all', hideDays: 7, freq: 'once', ...over });
const visible = (r: PromoRule, path = '/ar', mobile = false, ls = store(), ss = store(), now = NOW) => promoVisible(r, now, path, mobile, ls, ss);

describe('promotion visibility', () => {
  test('honours the start and end to the millisecond (end is exclusive)', () => {
    const r = rule({ start: NOW, end: NOW + 60_000 });
    assert.equal(visible(r, '/ar', false, store(), store(), NOW - 1), false);
    assert.equal(visible(r, '/ar', false, store(), store(), NOW), true);
    assert.equal(visible(r, '/ar', false, store(), store(), NOW + 59_999), true);
    assert.equal(visible(r, '/ar', false, store(), store(), NOW + 60_000), false);
    assert.equal(visible(rule({ end: null })), true, 'open-ended');
  });

  test('targets pages by the first segment after the language; home is the bare language', () => {
    const books = rule({ pages: ['books'] });
    assert.equal(visible(books, '/ar/books'), true);
    assert.equal(visible(books, '/en/books/12'), true);
    assert.equal(visible(books, '/ar/books?page=2#x'), true);
    assert.equal(visible(books, '/ar/articles/5'), false);
    assert.equal(visible(books, '/ar'), false);
    const home = rule({ pages: ['home'] });
    assert.equal(visible(home, '/ar'), true);
    assert.equal(visible(home, '/ar/'), true);
    assert.equal(visible(home, '/fr/news'), false);
  });

  test('devices', () => {
    assert.equal(visible(rule({ device: 'mobile' }), '/ar', true), true);
    assert.equal(visible(rule({ device: 'mobile' }), '/ar', false), false);
    assert.equal(visible(rule({ device: 'desktop' }), '/ar', true), false);
  });

  test('a closed promotion stays hidden for hideDays, or for the session when hideDays is 0', () => {
    const r = rule({ hideDays: 2 });
    assert.equal(visible(r, '/ar', false, store({ [promoKey('x', 1)]: String(NOW - 47 * HOUR) })), false);
    assert.equal(visible(r, '/ar', false, store({ [promoKey('x', 1)]: String(NOW - 49 * HOUR) })), true);
    assert.equal(visible(rule({ hideDays: 0 }), '/ar', false, store(), store({ [promoKey('x', 1)]: '1' })), false);
    assert.equal(visible(rule({ id: 2 }), '/ar', false, store({ [promoKey('x', 1)]: String(NOW) })), true, 'another promotion is unaffected');
  });

  test('overlays follow their frequency; bars and cards ignore it; never on account pages', () => {
    const seenLocal = store({ [promoKey('s', 1)]: String(NOW) });
    const seenSession = store({ [promoKey('s', 1)]: '1' });
    assert.equal(visible(rule({ format: 'popup', freq: 'once' }), '/ar', false, seenLocal), false);
    assert.equal(visible(rule({ format: 'popup', freq: 'session' }), '/ar', false, seenLocal), true);
    assert.equal(visible(rule({ format: 'corner', freq: 'session' }), '/ar', false, store(), seenSession), false);
    assert.equal(visible(rule({ format: 'popup', freq: 'always' }), '/ar', false, seenLocal, seenSession), true);
    assert.equal(visible(rule({ format: 'card', freq: 'once' }), '/ar', false, seenLocal), true);
    assert.equal(visible(rule({ format: 'popup' }), '/ar/account'), false);
    assert.equal(visible(rule({ format: 'bar' }), '/ar/account'), true);
  });

  test('storage that throws counts as empty', () => {
    const broken: StoreLike = { getItem: () => { throw new Error('denied'); } };
    assert.equal(promoVisible(rule(), NOW, '/ar', false, broken, null), true);
  });

  test('picks the first live promotion of a format in priority order', () => {
    const items = [rule({ id: 3, format: 'bar', end: NOW - 1 }), rule({ id: 2, format: 'bar' }), rule({ id: 1, format: 'bar' })];
    assert.equal(pickPromo(items, 'bar', NOW, '/ar', false, store(), store())?.id, 2);
    assert.equal(pickPromo(items, 'card', NOW, '/ar', false, store(), store()), null);
    const sorted = [{ id: 1, priority: 0 }, { id: 2, priority: 5 }, { id: 3, priority: 0 }].sort(byPriority).map((p) => p.id);
    assert.deepEqual(sorted, [2, 3, 1]);
  });
});

describe('pre-paint head script', () => {
  const run = (rules: PromoRule[], path: string, ls: Record<string, string> = {}, mobile = false) => {
    const appended: { id?: string; textContent?: string }[] = [];
    const sandbox = {
      Date: { now: () => NOW },
      location: { pathname: path },
      matchMedia: () => ({ matches: mobile }),
      localStorage: store(ls),
      sessionStorage: store(),
      document: { createElement: () => ({}), head: { appendChild: (el: { id?: string; textContent?: string }) => appended.push(el) } },
    };
    runInNewContext(promoHeadScript(rules), sandbox);
    return appended[0]?.textContent ?? '';
  };

  test('keeps the first live bar and card, hides the rest before paint', () => {
    const rules = [rule({ id: 10, format: 'bar', end: NOW - 1 }), rule({ id: 11, format: 'bar' }), rule({ id: 12, format: 'bar' }), rule({ id: 20, format: 'card' })];
    const css = run(rules, '/ar');
    assert.match(css, /\[data-promo="10"\]:not\(\[data-live\]\)/);
    assert.match(css, /\[data-promo="12"\]/);
    assert.doesNotMatch(css, /"11"|"20"/);
    assert.match(css, /\{display:none!important\}$/);
  });

  test('agrees with promoVisible on dismissals and pages', () => {
    const rules = [rule({ id: 11, format: 'bar' }), rule({ id: 12, format: 'bar', pages: ['books'] })];
    assert.match(run(rules, '/ar/books', { [promoKey('x', 11)]: String(NOW) }), /"11"/);
    assert.doesNotMatch(run(rules, '/ar/books', { [promoKey('x', 11)]: String(NOW) }), /"12"/);
    assert.equal(run([rule({ id: 30, format: 'popup' })], '/ar'), '', 'overlays are not in the pre-paint script');
  });

  test('cannot break out of its script element', () => {
    assert.doesNotMatch(promoHeadScript([rule({ pages: ['</script><script>alert(1)</script>'] })]), /<\/script/i);
  });
});

describe('promotion links and editor input', () => {
  const localize = (p: string) => `/ar${p}`;
  test('site paths get the language; prefixed paths and URLs are kept; other schemes are dropped', () => {
    assert.deepEqual(promoHref('/donate', localize), { href: '/ar/donate', external: false });
    assert.deepEqual(promoHref('/en/books/3', localize), { href: '/en/books/3', external: false });
    assert.deepEqual(promoHref('https://example.org/x', localize), { href: 'https://example.org/x', external: true });
    assert.equal(promoHref('javascript:alert(1)', localize), null);
    assert.equal(promoHref('//evil.example', localize), null);
    assert.equal(promoHref('', localize), null);
    assert.equal(validPromoLink('/store'), true);
    assert.equal(typeof validPromoLink('data:text/html,x'), 'string');
  });

  test('a stored document becomes a view with safe defaults', () => {
    const v = toPromoView(
      { id: 7, headline: ' مؤتمر ', format: 'popup', kind: 'nope', tone: 'gold', startAt: '2026-11-20T10:00:00Z', endAt: '2026-11-21T10:00:00Z', ctaUrl: '/events/3', behaviour: { dismissible: false, hideDays: 900, delay: 1 }, targeting: { pages: ['events'], device: 'weird' } },
      localize,
      'التفاصيل',
    );
    assert.ok(v);
    assert.equal(v.headline, 'مؤتمر');
    assert.equal(v.dismissible, true, 'a popup can always be closed');
    assert.equal(v.hideDays, 365);
    assert.equal(v.delay, 3);
    assert.equal(v.kind, 'notice');
    assert.equal(v.device, 'all');
    assert.deepEqual(v.cta, { label: 'التفاصيل', href: '/ar/events/3', external: false });
    assert.equal(toPromoView({ id: 8, headline: 'x', startAt: '2026-11-20T10:00:00Z', endAt: '2026-11-20T09:00:00Z' }, localize, ''), null, 'ends before it starts');
    assert.equal(toPromoView({ id: 9, headline: '', startAt: '2026-11-20T10:00:00Z' }, localize, ''), null, 'no headline');
  });

  test('admin schedule state', () => {
    assert.equal(promoState('draft', '2026-01-01', null, NOW), 'draft');
    assert.equal(promoState('published', '2026-12-01T00:00:00Z', null, NOW), 'scheduled');
    assert.equal(promoState('published', '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z', NOW), 'live');
    assert.equal(promoState('published', '2026-11-01T00:00:00Z', '2026-11-19T00:00:00Z', NOW), 'ended');
  });

  test('do-not-track and global privacy control send nothing', () => {
    assert.equal(trackingAllowed({ doNotTrack: '1' }), false);
    assert.equal(trackingAllowed({ globalPrivacyControl: true }), false);
    assert.equal(trackingAllowed({ doNotTrack: null }), true);
    assert.equal(trackingAllowed(undefined), false);
  });
});

describe('anonymous promotion counts', () => {
  test('daily totals, last seven days and click rate', () => {
    const db = openExtras(':memory:');
    recordPromoEvent(db, 5, 'view', '2026-11-01');
    recordPromoEvent(db, 5, 'view', '2026-11-20');
    recordPromoEvent(db, 5, 'view', '2026-11-20');
    recordPromoEvent(db, 5, 'click', '2026-11-20');
    recordPromoEvent(db, 6, 'view', '2026-11-20');
    const t = promoTotals(db, 5, new Date(NOW));
    assert.deepEqual(t.total, { view: 3, click: 1, close: 0 });
    assert.deepEqual(t.last7, { view: 2, click: 1, close: 0 });
    assert.equal(t.since, '2026-11-01');
    assert.equal(ctr(3, 1), 33.3);
    assert.equal(ctr(0, 0), null);
    assert.deepEqual(promoTotals(db, 99).total, { view: 0, click: 0, close: 0 });
    deletePromoStats(db, 5);
    assert.deepEqual(promoTotals(db, 5).total, { view: 0, click: 0, close: 0 }, 'a deleted promotion leaves no counts for the next one with its id');
    assert.equal(promoTotals(db, 6).total.view, 1, 'others keep theirs');
  });
});
