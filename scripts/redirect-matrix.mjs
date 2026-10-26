#!/usr/bin/env node
/**
 * Legacy-URL redirect matrix: every old id of hadramout.center must reach its new page, and the other old URL shapes must behave.
 * The id mapping is read from the database (legacy_id → id), so the whole archive is checked, not a sample.
 *
 *   node scripts/redirect-matrix.mjs http://localhost:3100 --db .smoke-data/payload.db
 *   node scripts/redirect-matrix.mjs https://hadramout-center.novixa.dev --db .smoke-data/payload.db --follow 60
 *
 * Checked: item URLs (301 to /ar/{route}/{id}; the language cookie is honoured), the same with a trailing slash, section listings
 * with and without query, "/", "/contact", the singular "/magazine" from the old sitemap, unknown ids (never a 200 soft page),
 * unknown paths (404 at the end of the chain) and — for a sample of --follow items — that the target page answers 200.
 * Read-only; at most 4 requests in flight. Exit code 1 on any failure.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
const opt = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const dbPath = opt('db', '');
const follow = Number(opt('follow', 80));
if (!base || !dbPath || !existsSync(dbPath)) {
  console.error('usage: node scripts/redirect-matrix.mjs <https://host> --db <payload.db> [--follow 80]');
  process.exit(2);
}

// section on the legacy site → [table, new route]
const SECTIONS = { news: ['news', 'news'], articles: ['articles', 'articles'], books: ['books', 'books'], magazines: ['magazines', 'magazines'], events: ['events', 'events'], forum: ['forum_events', 'forum'], videos: ['videos', 'videos'] };

const db = new DatabaseSync(dbPath, { readOnly: true });
const failures = [];
let total = 0;
const fail = (what, detail) => failures.push(`${what} — ${detail}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const path = (u) => new URL(u, base).pathname + new URL(u, base).search;

async function hop(url, headers = {}) {
  const res = await fetch(base + url, { redirect: 'manual', headers: { 'user-agent': 'hc-redirect-matrix', ...headers } });
  await res.arrayBuffer().catch(() => undefined);
  return { status: res.status, location: res.headers.get('location') ? path(res.headers.get('location')) : null };
}
/** follow redirects (max 5 hops); returns the chain and the final status */
async function chain(url, headers = {}) {
  const steps = [];
  let cur = url;
  for (let i = 0; i < 5; i++) {
    const r = await hop(cur, headers);
    steps.push(`${r.status}${r.location ? ` → ${r.location}` : ''}`);
    if (!r.location) return { steps, status: r.status, url: cur };
    cur = r.location;
  }
  return { steps, status: 0, url: cur };
}
async function pool(items, worker, size = 4) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => { for (let it = queue.shift(); it !== undefined; it = queue.shift()) await worker(it); }));
}

// 1 ── every legacy id ──────────────────────────────────────────────────────────────────────────
const items = [];
for (const [section, [table, route]] of Object.entries(SECTIONS)) {
  for (const row of db.prepare(`SELECT legacy_id AS l, id FROM ${table} WHERE legacy_id IS NOT NULL ORDER BY legacy_id`).all()) items.push({ section, route, legacy: row.l, id: row.id });
}
console.log(`${items.length} legacy ids to check against ${base}`);
await pool(items, async (it) => {
  total++;
  const want = `/ar/${it.route}/${it.id}`;
  const r = await hop(`/${it.section}/${it.legacy}`);
  if (r.status !== 301 || r.location !== want) fail(`/${it.section}/${it.legacy}`, `got ${r.status} ${r.location}, want 301 ${want}`);
  await sleep(10);
});

// 2 ── cookie, trailing slash, sample of targets ────────────────────────────────────────────────
const sample = items.filter((_, i) => i % Math.max(1, Math.floor(items.length / Math.max(1, follow))) === 0).slice(0, follow);
await pool(sample, async (it) => {
  total += 3;
  const en = await hop(`/${it.section}/${it.legacy}`, { cookie: 'hc_lang=en' });
  if (en.location !== `/en/${it.route}/${it.id}`) fail(`/${it.section}/${it.legacy} (cookie hc_lang=en)`, `got ${en.status} ${en.location}`);
  const slash = await chain(`/${it.section}/${it.legacy}/`);
  if (slash.url !== `/ar/${it.route}/${it.id}` || slash.status !== 200) fail(`/${it.section}/${it.legacy}/ (trailing slash)`, `${slash.steps.join(' | ')} → ${slash.status}`);
  const page = await chain(`/${it.section}/${it.legacy}`);
  if (page.status !== 200) fail(`/${it.section}/${it.legacy} (followed)`, `${page.steps.join(' | ')} → ${page.status}`);
  await sleep(40);
});

// 3 ── listings and other shapes ────────────────────────────────────────────────────────────────
const shapes = [
  ...Object.keys(SECTIONS).flatMap((s) => [[`/${s}`, `/ar/${s}`], [`/${s}/`, `/ar/${s}`]]),
  // legacy pagination (?page=N) is kept for the sections that have a second page
  ...['news', 'articles', 'books', 'magazines', 'events'].map((s) => [`/${s}?page=2`, `/ar/${s}?page=2`]),
  ['/about', '/ar/about'], ['/', '/ar'], ['/contact', '/ar/contact'], ['/magazine', '/ar/magazines'],
];
for (const [from, to] of shapes) {
  total++;
  const r = await chain(from);
  if (!r.url.startsWith(to) || r.status !== 200) fail(from, `${r.steps.join(' | ')} → ${r.status} (want ${to} answering 200)`);
}

// 4 ── things that must never be a soft 404 ─────────────────────────────────────────────────────
for (const from of ['/news/99999999', '/articles/1', '/books/0', '/nope-not-here', '/ar/nope-not-here', '/ar/articles/99999999']) {
  total++;
  const r = await chain(from);
  const ok = r.status === 404 || (r.steps.length > 1 && r.status === 200 && /^\/ar\/(news|articles|books)(\?|$)/.test(r.url));
  if (!ok) fail(from, `${r.steps.join(' | ')} → ${r.status}: an unknown URL must end in a 404 or at the section listing, never a made-up page`);
}

console.log(`\nredirect matrix on ${base}: ${total} checks, ${failures.length} failed`);
for (const f of failures.slice(0, 25)) console.log(`  FAIL ${f}`);
if (failures.length > 25) console.log(`  … and ${failures.length - 25} more`);
process.exit(failures.length ? 1 : 0);
