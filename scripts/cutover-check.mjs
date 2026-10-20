#!/usr/bin/env node
/**
 * Cutover check: verifies a deployed copy of the site, from outside, before and after a move to a new host or domain.
 *
 *   node scripts/cutover-check.mjs https://new-domain.example                 # expects a LIVE production site (indexable)
 *   node scripts/cutover-check.mjs https://staging.example --expect staging   # expects a preview (noindex + banner)
 *   node scripts/cutover-check.mjs http://localhost:3100 --expect production  # works on a local server too (https/HSTS checks are skipped)
 *
 * Read-only (GET/HEAD, ~40 requests, polite). Exit code 1 when any check fails; warnings do not fail.
 * Details and the surrounding procedure: docs/05-deploy/03-move-to-new-host-and-domain.md
 */
const args = process.argv.slice(2);
const target = args.find((a) => /^https?:\/\//.test(a));
const expect = args.includes('--expect') ? args[args.indexOf('--expect') + 1] : 'production';
if (!target || !['production', 'staging'].includes(expect)) {
  console.error('usage: node scripts/cutover-check.mjs <https://host> [--expect production|staging]');
  process.exit(2);
}
const origin = new URL(target).origin;
const host = new URL(origin).host;
const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
const results = [];
const ok = (name, detail = '') => results.push({ level: 'ok', name, detail });
const fail = (name, detail = '') => results.push({ level: 'FAIL', name, detail });
const warn = (name, detail = '') => results.push({ level: 'warn', name, detail });
const check = (cond, name, detail = '') => (cond ? ok(name) : fail(name, detail));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, init = {}) {
  await sleep(150);
  try {
    const res = await fetch(origin + path, { redirect: 'manual', headers: { 'user-agent': 'hc-cutover-check', ...(init.headers ?? {}) }, ...init });
    return { res, text: init.method === 'HEAD' ? '' : await res.text() };
  } catch (e) {
    return { res: null, text: '', error: String(e) };
  }
}
const meta = (html, re) => (html.match(re) ?? [])[1] ?? '';

// ── 1. reachability, TLS, headers ─────────────────────────────────────────────────────────────
const home = await get('/ar');
if (!home.res) {
  console.error(`cannot reach ${origin}: ${home.error}`);
  process.exit(1);
}
check(home.res.status === 200, 'GET /ar is 200', `status ${home.res.status}`);
if (!local) {
  check(origin.startsWith('https://'), 'served over https');
  const hsts = home.res.headers.get('strict-transport-security') ?? '';
  check(/max-age=\d{7,}/.test(hsts), 'HSTS header present (>= 1 year recommended)', hsts || 'missing');
}
const csp = home.res.headers.get('content-security-policy') ?? '';
check(csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"), 'CSP present', csp ? 'unexpected policy' : 'missing');
check((home.res.headers.get('x-content-type-options') ?? '') === 'nosniff', 'X-Content-Type-Options: nosniff');

// ── 2. defaults ───────────────────────────────────────────────────────────────────────────────
const root = await get('/', { headers: { 'accept-language': 'en-US,en;q=0.9' } });
check(/\/ar\/?$/.test(root.res?.headers.get('location') ?? ''), 'Arabic is the default language (Accept-Language ignored)', root.res?.headers.get('location') ?? 'no redirect');
check(/<html[^>]*lang="ar"[^>]*dir="rtl"[^>]*data-theme="dark"/.test(home.text), 'html is lang=ar dir=rtl and dark by default');

// ── 3. indexing mode ──────────────────────────────────────────────────────────────────────────
const robotsMeta = meta(home.text, /<meta name="robots" content="([^"]*)"/);
const robotsHeader = home.res.headers.get('x-robots-tag') ?? '';
const banner = home.text.includes('class="staging-bar"');
const robotsTxt = (await get('/robots.txt')).text;
if (expect === 'production') {
  check(!/noindex/i.test(robotsMeta), 'meta robots allows indexing', robotsMeta || 'missing');
  check(!/noindex/i.test(robotsHeader), 'no X-Robots-Tag noindex header', robotsHeader);
  check(!banner, 'no preview banner');
  check(!/^disallow:\s*\/\s*$/im.test(robotsTxt), 'robots.txt does not block the whole site');
  check(robotsTxt.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt advertises this host\'s sitemap', robotsTxt.split('\n').find((l) => /sitemap/i.test(l)) ?? 'no Sitemap line');
} else {
  check(/noindex/i.test(robotsMeta), 'meta robots is noindex', robotsMeta || 'missing');
  check(/noindex/i.test(robotsHeader), 'X-Robots-Tag noindex header present', robotsHeader || 'missing');
  check(banner, 'preview banner shown');
  check(!/sitemap:/i.test(robotsTxt), 'robots.txt advertises no sitemap');
  check(!/^disallow:\s*\/\s*$/im.test(robotsTxt), 'robots.txt does not Disallow / (it would hide the noindex from crawlers)');
}

// ── 4. host consistency: nothing may point at another host ───────────────────────────────────
const canonical = meta(home.text, /<link rel="canonical" href="([^"]*)"/);
check(canonical === `${origin}/ar`, 'canonical is this host', canonical);
check(meta(home.text, /<meta property="og:url" content="([^"]*)"/).startsWith(origin), 'og:url is this host');
const alternates = [...home.text.matchAll(/<link rel="alternate" hrefLang="[^"]*" href="([^"]*)"/gi)].map((m) => m[1]);
check(alternates.length > 0 && alternates.every((u) => u.startsWith(origin)), `hreflang alternates are this host (${alternates.length})`, alternates.find((u) => !u.startsWith(origin)) ?? 'none found');
const ogImage = meta(home.text, /<meta property="og:image" content="([^"]*)"/);
check(ogImage.startsWith(origin), 'og:image is this host', ogImage);
const strayHosts = ['localhost', '127.0.0.1', 'hadramout-center.novixa.dev', 'hadramout.center'].filter((h) => !host.includes(h));
for (const stray of strayHosts) {
  const pattern = new RegExp(`https?://(?!files\\.)${stray.replace(/\./g, '\\.')}`, 'i');
  const found = home.text.match(pattern);
  if (found) (stray === 'hadramout.center' ? warn : fail)(`home page links to ${stray}`, 'unexpected reference to another host');
  else ok(`home page has no reference to ${stray}`);
}
const legacyFiles = (home.text.match(/files\.hadramout\.center/g) ?? []).length;
if (legacyFiles) warn(`home page still loads ${legacyFiles} resources from files.hadramout.center`, 'fine until the legacy host is retired');

// ── 5. sitemap, feeds, manifest, OG card ─────────────────────────────────────────────────────
const sitemap = await get('/sitemap.xml');
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(sitemap.res?.status === 200 && locs.length >= 1400, `sitemap lists the archive (${locs.length} URLs, expected >= 1400)`);
check(locs.length > 0 && locs.every((u) => u.startsWith(origin)), 'every sitemap URL is on this host', locs.find((u) => !u.startsWith(origin)) ?? 'empty');
for (const url of locs.filter((_, i) => i % Math.max(1, Math.floor(locs.length / 8)) === 0).slice(0, 8)) {
  const page = await get(url.slice(origin.length), { method: 'HEAD' });
  check(page.res?.status === 200, `sitemap URL answers 200: ${url.slice(origin.length)}`, `status ${page.res?.status}`);
}
const feed = await get('/feeds/ar/all.xml');
check(feed.res?.status === 200 && feed.text.includes(`<link>${origin}/ar</link>`), 'RSS feed links to this host');
const manifest = await get('/manifest.webmanifest');
check(manifest.res?.status === 200 && manifest.text.includes('"start_url":"/ar"'), 'web manifest present');
const card = await get(ogImage.startsWith(origin) ? ogImage.slice(origin.length) : '/og/ar/home.png');
const cardStatus = card.res?.status ?? 0;
if (cardStatus === 200 && (card.res?.headers.get('content-type') ?? '').startsWith('image/')) ok('social card renders as an image');
else if (cardStatus >= 300 && cardStatus < 400) warn('social card renderer is falling back to the static card', 'Arabic text rendering is unavailable on this host (the Docker image installs fontconfig for it)');
else fail('social card is an image', `status ${cardStatus}`);
const sw = await get('/sw.js', { method: 'HEAD' });
check(sw.res?.status === 200 && /javascript/.test(sw.res.headers.get('content-type') ?? ''), 'service worker is served as JavaScript');
const swCache = sw.res?.headers.get('cache-control') ?? '';
if (!/no-cache|max-age=0/.test(swCache)) warn('/sw.js is cached by a proxy/CDN', `${swCache} — add a Cloudflare cache rule to bypass /sw.js so updates reach visitors promptly`);

// ── 6. legacy URLs keep working (301 to this host) ────────────────────────────────────────────
for (const [from, to] of [['/articles/9597', '/ar/articles/909'], ['/about', '/ar/about']]) {
  const r = await get(from, { method: 'HEAD' });
  const loc = r.res?.headers.get('location') ?? '';
  check([301, 308].includes(r.res?.status ?? 0) && (loc === to || loc === origin + to), `legacy ${from} redirects permanently to ${to}`, `${r.res?.status} ${loc}`);
}
const missing = await get('/ar/articles/99999999', { method: 'HEAD' });
check(missing.res?.status === 404, 'unknown documents answer 404 (not a soft 404)', `status ${missing.res?.status}`);

// ── 7. application ───────────────────────────────────────────────────────────────────────────
const health = await get('/api/hc/health');
check(health.res?.status === 200 && /"status":"ok"/.test(health.text) && !/users/.test(health.text), 'health endpoint is ok and minimal');
check((await get('/api/graphql', { method: 'HEAD' })).res?.status === 404, 'GraphQL is not exposed');
const rest = await get('/api/news?limit=1000&depth=3'); // GET: the cap redirects reads only
check(rest.res?.status === 307 && /limit=100/.test(rest.res.headers.get('location') ?? ''), 'public REST reads are capped', `${rest.res?.status} ${rest.res?.headers.get('location')}`);

// ── report ────────────────────────────────────────────────────────────────────────────────────
for (const r of results) console.log(`${r.level.padEnd(4)}  ${r.name}${r.detail && r.level !== 'ok' ? `  —  ${r.detail}` : ''}`);
const failed = results.filter((r) => r.level === 'FAIL').length;
const warned = results.filter((r) => r.level === 'warn').length;
console.log(`\ncutover check for ${origin} (expecting ${expect}): ${results.length - failed - warned} ok, ${warned} warnings, ${failed} failed`);
process.exit(failed ? 1 : 0);
