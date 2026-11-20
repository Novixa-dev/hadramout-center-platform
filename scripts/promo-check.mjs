#!/usr/bin/env node
/**
 * Promotions end to end on the built server: what reaches the page (live, scheduled, draft, ended, page targeting),
 * the pre-paint script, and the anonymous counter with its walls. It WRITES rows, so it runs only against a throwaway
 * copy (scripts/smoke-prod.sh), never against a live site; its rows are removed at the end.
 *   node scripts/promo-check.mjs http://127.0.0.1:3100 --db path/to/payload.db
 */
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';

const base = process.argv[2];
const args = process.argv.slice(3);
const dbPath = args.includes('--db') ? args[args.indexOf('--db') + 1] : null;
if (!base || !dbPath) {
  console.error('usage: node scripts/promo-check.mjs <base-url> --db <payload.db>');
  process.exit(2);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(base)) {
  console.error('refused: this script writes to the database, so it only runs against a local copy');
  process.exit(2);
}

let failed = 0;
const check = (cond, name, detail = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} promotions: ${name}${cond || !detail ? '' : ` (${detail})`}`);
  if (!cond) failed++;
};

const db = new DatabaseSync(dbPath);
const iso = (ms) => new Date(Date.now() + ms).toISOString();
const H = 3_600_000;
const rows = [
  { key: 'BAR-LIVE', format: 'bar', start: -H, end: H, status: 'published', priority: 5, cta: '/donate' },
  { key: 'BAR-SOON', format: 'bar', start: 2 * H, end: 3 * H, status: 'published', priority: 9 },
  { key: 'CARD-HOME', format: 'card', start: -H, end: null, status: 'published', priority: 0, pages: ['home'] },
  { key: 'POPUP', format: 'popup', start: -H, end: H, status: 'published', priority: 0 },
  { key: 'DRAFT', format: 'bar', start: -H, end: H, status: 'draft', priority: 50 },
  { key: 'ENDED', format: 'card', start: -2 * H, end: -H, status: 'published', priority: 50 },
  { key: 'FAR', format: 'card', start: 30 * 24 * H, end: null, status: 'published', priority: 50 },
];
const ids = {};
for (const r of rows) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO promotions (format, kind, tone, start_at, end_at, priority, status, cta_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(r.format, 'event', 'brand', iso(r.start), r.end === null ? null : iso(r.end), r.priority, r.status, r.cta ?? null);
  ids[r.key] = Number(lastInsertRowid);
  db.prepare('INSERT INTO promotions_locales (headline, _locale, _parent_id) VALUES (?, ?, ?)').run(`SMOKE-${r.key}`, 'ar', ids[r.key]);
  (r.pages ?? []).forEach((p, i) => db.prepare('INSERT INTO promotions_targeting_pages ("order", parent_id, value) VALUES (?, ?, ?)').run(i + 1, ids[r.key], p));
}

try {
  // a language no earlier check has rendered, so the page is built now (not served from the runtime cache)
  const home = await (await fetch(`${base}/es`)).text();
  check(home.includes('SMOKE-BAR-LIVE') && home.includes(`data-promo="${ids['BAR-LIVE']}"`), 'a live bar is rendered by the server');
  check(home.includes('href="/es/donate"'), 'its site link gets the language prefix');
  check(home.includes('SMOKE-BAR-SOON'), 'a bar starting within the day is sent, for the browser to start on time');
  check(home.includes('SMOKE-CARD-HOME'), 'a home card appears on the home page');
  check(home.includes('SMOKE-POPUP'), 'an overlay is sent to the browser');
  check(home.includes("document.createElement('style')") && home.includes(`"id":${ids['BAR-SOON']}`), 'the pre-paint script carries the bar and card rules');
  check(!home.includes('SMOKE-DRAFT') && !home.includes('SMOKE-ENDED') && !home.includes('SMOKE-FAR'), 'drafts, ended and far-future promotions are not sent');
  const article = await (await fetch(`${base}/es/articles/909`)).text();
  check(!article.includes('SMOKE-CARD-HOME'), 'a card targeted at the home page is not on an article');

  const post = (body, headers = {}) => fetch(`${base}/api/hc/promo`, { method: 'POST', headers: { 'content-type': 'text/plain;charset=UTF-8', 'x-forwarded-for': '10.9.8.7', ...headers }, body });
  const extras = new DatabaseSync(join(dirname(dbPath), 'extras.db'));
  const count = (id, e) => extras.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM promo_stats WHERE promo = ? AND event = ?').get(id, e).n;
  // ids can repeat across runs on one database (SQLite reuses a deleted row's id): compare against the counts before
  const before = { view: count(ids['BAR-LIVE'], 'view'), click: count(ids['BAR-LIVE'], 'click'), draft: count(ids.DRAFT, 'view') };
  check((await post(JSON.stringify({ id: ids['BAR-LIVE'], e: 'view' }))).status === 204, 'a view is accepted (204)');
  check((await post(JSON.stringify({ id: ids['BAR-LIVE'], e: 'click' }))).status === 204, 'a click is accepted (204)');
  check(count(ids['BAR-LIVE'], 'view') === before.view + 1 && count(ids['BAR-LIVE'], 'click') === before.click + 1, 'and counted once each');
  await post(JSON.stringify({ id: ids.DRAFT, e: 'view' }));
  check(count(ids.DRAFT, 'view') === before.draft, 'a draft is not counted');
  await post(JSON.stringify({ id: ids['BAR-LIVE'], e: 'view' }), { 'user-agent': 'Googlebot/2.1' });
  check(count(ids['BAR-LIVE'], 'view') === before.view + 1, 'crawlers are not counted');
  check((await post('{"id":1,"e":"steal"}')).status === 400, 'an unknown event is refused (400)');
  check((await post('not json')).status === 400, 'malformed JSON is refused (400)');
  check((await post('x'.repeat(400))).status === 413, 'an oversized body is refused (413)');
  check((await post(JSON.stringify({ id: ids['BAR-LIVE'], e: 'view' }), { origin: 'https://evil.example' })).status === 403, 'another site cannot post counts (403)');
  const rest = await (await fetch(`${base}/api/promotions?limit=50&depth=0`)).json();
  const seen = new Set((rest.docs ?? []).map((d) => d.id));
  check(seen.has(ids['BAR-LIVE']) && !seen.has(ids['BAR-SOON']) && !seen.has(ids.DRAFT), 'public REST shows started promotions only, not scheduled or drafts');
  const tr = await fetch(`${base}/api/hc/translate?slug=promotions&id=${ids.DRAFT}&lang=en`);
  check(tr.status === 400, 'visitors cannot ask for translations of promotions (400)');
  const stats = await fetch(`${base}/api/hc/promo?id=${ids['BAR-LIVE']}`);
  check(stats.status === 401 && /no-store/.test(stats.headers.get('cache-control') ?? ''), 'statistics are for staff only (401, no-store)');
} finally {
  for (const id of Object.values(ids)) db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
}

console.log(failed ? `PROMO_CHECK FAILED (${failed})` : 'PROMO_CHECK OK');
process.exit(failed ? 1 : 0);
