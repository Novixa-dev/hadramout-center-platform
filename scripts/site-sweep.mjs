#!/usr/bin/env node
/**
 * Site sweep: fetches a stratified sample of the sitemap and checks every page for the basics that visitors, crawlers and screen
 * readers depend on, then tests the internal links those pages contain. Read-only, polite (3 requests in flight).
 *
 *   node scripts/site-sweep.mjs https://hadramout-center.novixa.dev
 *   node scripts/site-sweep.mjs http://localhost:3100 --sample 200 --links 400 --lang ar --expect staging
 *
 * Errors fail the run (exit 1); warnings are reported only. Pair with scripts/cutover-check.mjs (deployment-level checks)
 * and scripts/seo-audit.mjs (metadata per route type).
 */
const args = process.argv.slice(2);
const target = args.find((a) => /^https?:\/\//.test(a));
const opt = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
if (!target) {
  console.error('usage: node scripts/site-sweep.mjs <https://host> [--sample 120] [--links 200] [--lang ar] [--expect production|staging]');
  process.exit(2);
}
const origin = new URL(target).origin;
const sample = Number(opt('sample', 120));
const linkLimit = Number(opt('links', 200));
const lang = opt('lang', 'ar');
const expect = opt('expect', 'staging');

const findings = []; // {level, check, url, detail}
const add = (level, check, url, detail = '') => findings.push({ level, check, url, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(path, init = {}) {
  await sleep(60);
  try {
    const res = await fetch(origin + path, { redirect: 'manual', headers: { 'user-agent': 'hc-site-sweep' }, ...init });
    return { status: res.status, headers: res.headers, text: init.method === 'HEAD' ? '' : await res.text() };
  } catch (e) {
    return { status: 0, headers: new Headers(), text: '', error: String(e) };
  }
}
async function pool(items, worker, size = 3) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => { for (let it = queue.shift(); it !== undefined; it = queue.shift()) await worker(it); }));
}

// ── sample the sitemap, stratified by content type ───────────────────────────────────────────
const sm = await fetchText('/sitemap.xml');
const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(`${origin}/${lang}`));
if (locs.length === 0) { console.error(`no ${lang} URLs in ${origin}/sitemap.xml`); process.exit(1); }
const typeOf = (u) => new URL(u).pathname.split('/')[2] || 'home';
const groups = new Map();
for (const u of locs) { const t = typeOf(u); (groups.get(t) ?? groups.set(t, []).get(t)).push(u); }
const picked = [];
for (const [, urls] of groups) {
  const take = Math.max(3, Math.round((sample * urls.length) / locs.length));
  const step = Math.max(1, Math.floor(urls.length / take));
  for (let i = 0; i < urls.length && picked.filter((p) => typeOf(p) === typeOf(urls[0])).length < take; i += step) picked.push(urls[i]);
}
console.log(`sitemap: ${locs.length} ${lang} URLs in ${groups.size} groups; sweeping ${picked.length}: ${[...groups].map(([t, u]) => `${t}=${u.length}`).join(' ')}`);

// ── per-page checks ──────────────────────────────────────────────────────────────────────────
const titles = new Map();
const internalLinks = new Set();
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
const attr = (html, re) => (html.match(re) ?? [])[1] ?? '';

await pool(picked, async (url) => {
  const path = url.slice(origin.length);
  const r = await fetchText(path);
  if (r.status !== 200) return add('error', 'status', path, `status ${r.status} ${r.error ?? ''}`);
  const h = r.text;

  const title = (attr(h, /<title>([^<]*)<\/title>/) || '').trim();
  if (!title) add('error', 'title', path, 'missing');
  else {
    if (title.length > 110) add('warn', 'title-length', path, `${title.length} chars`);
    if (BIDI.test(title)) add('warn', 'bidi-in-title', path, 'invisible direction characters in the title');
    (titles.get(title) ?? titles.set(title, []).get(title)).push(path);
  }
  const desc = attr(h, /<meta name="description" content="([^"]*)"/);
  if (desc.length < 30) add('warn', 'description', path, desc ? `only ${desc.length} chars` : 'missing');
  const canonical = attr(h, /<link rel="canonical" href="([^"]*)"/);
  if (!canonical) add('error', 'canonical', path, 'missing');
  else if (!path.includes('?') && canonical !== url) add('error', 'canonical', path, `points to ${canonical}`);
  const h1s = (h.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) add('error', 'h1', path, `${h1s} <h1> elements`);
  else {
    const h1 = attr(h, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, '');
    if (/ـ{2,}/.test(h1)) add('warn', 'tatweel-in-h1', path, 'kashida run in the heading');
    if (BIDI.test(h1)) add('warn', 'bidi-in-h1', path, 'invisible direction characters in the heading');
  }
  if (!new RegExp(`<html[^>]*lang="${lang}"[^>]*dir="rtl"`).test(h) && lang === 'ar') add('error', 'html-lang-dir', path, 'html lacks lang="ar" dir="rtl"');
  const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((i) => !/\balt=/.test(i)).length;
  if (noAlt) add('error', 'img-alt-missing', path, `${noAlt} <img> without an alt attribute`);
  for (const block of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(block[1]); if (!JSON.stringify(j).includes('schema.org')) add('warn', 'jsonld', path, 'block without schema.org context'); } catch { add('error', 'jsonld', path, 'invalid JSON-LD'); }
  }
  if (!attr(h, /<meta property="og:image" content="([^"]*)"/)) add('warn', 'og-image', path, 'missing');
  if (/(src|href)="http:\/\/(?!localhost|127\.0\.0\.1)[^"]+/.test(h.replace(/<a [^>]*href="http:\/\/[^"]*"/g, ''))) add('warn', 'mixed-content', path, 'a resource is loaded over http');
  const visible = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  const leak = visible.match(/\bundefined\b|\[object Object\]|\bNaN\b|\{\{|%7B%7B/);
  if (leak) add('error', 'leaked-text', path, `"${leak[0]}" appears in the page text`);
  const robotsMeta = attr(h, /<meta name="robots" content="([^"]*)"/);
  if (expect === 'staging' && !/noindex/.test(robotsMeta)) add('error', 'indexing-mode', path, 'staging page is indexable');
  if (expect === 'production' && /noindex/.test(robotsMeta)) add('error', 'indexing-mode', path, 'production page is noindex');
  for (const m of h.matchAll(/<a [^>]*href="(\/[^"#?][^"#]*)"/g)) internalLinks.add(m[1]);
});

for (const [title, paths] of titles) if (paths.length > 1) add('warn', 'duplicate-title', paths[0], `${paths.length} sampled pages share "${title.slice(0, 60)}"`);

// ── internal links found on those pages ──────────────────────────────────────────────────────
const links = [...internalLinks].filter((l) => !/^\/(_next|api|og|feeds|legacy-media)\b/.test(l)).slice(0, linkLimit);
let redirected = 0;
await pool(links, async (l) => {
  const r = await fetchText(l, { method: 'HEAD' });
  if (r.status >= 400 || r.status === 0) add('error', 'broken-link', l, `status ${r.status}`);
  else if (r.status >= 300) { redirected++; add('warn', 'redirecting-link', l, `${r.status} → ${r.headers.get('location')}`); }
});
console.log(`links: ${internalLinks.size} unique internal links found, ${links.length} tested, ${redirected} redirect`);

// ── report ──────────────────────────────────────────────────────────────────────────────────
const by = new Map();
for (const f of findings) { const k = `${f.level}|${f.check}`; (by.get(k) ?? by.set(k, []).get(k)).push(f); }
const order = [...by].sort(([a], [b]) => (a.startsWith('error') === b.startsWith('error') ? a.localeCompare(b) : a.startsWith('error') ? -1 : 1));
console.log('');
for (const [k, list] of order) {
  const [level, check] = k.split('|');
  console.log(`${level.toUpperCase().padEnd(5)} ${check.padEnd(18)} ${String(list.length).padStart(4)}   e.g. ${list.slice(0, 3).map((f) => `${f.url}${f.detail ? ` (${f.detail})` : ''}`).join('  |  ')}`);
}
const errors = findings.filter((f) => f.level === 'error').length;
const warns = findings.length - errors;
console.log(`\nsite sweep of ${origin}: ${picked.length} pages, ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
