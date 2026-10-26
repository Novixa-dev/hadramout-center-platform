#!/usr/bin/env node
/**
 * SEO / social-preview audit of a running site (live or local). No dependencies beyond devDependencies.
 *
 *   node scripts/seo-audit.mjs https://hadramout-center.novixa.dev            # sample of every template
 *   node scripts/seo-audit.mjs http://localhost:3000 --lang en --json out.json
 *   node scripts/seo-audit.mjs https://staging.example --expect staging   # staging has no Sitemap line on purpose
 *
 * Checks per page: status, <html lang/dir>, title, description, canonical (same host + self), robots meta,
 * Open Graph + Twitter tags (incl. image reachability), hreflang reciprocity, JSON-LD parse + types, one <h1>,
 * Scholar `citation_*` tags on research pages. Also validates robots.txt and sitemap.xml host consistency.
 * Exit code 1 when any page has an error-level finding.
 */
import { parse } from 'node-html-parser';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) ?? 'http://localhost:3000').replace(/\/$/, '');
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const lang = flag('lang', 'ar');
const staging = flag('expect', 'production') === 'staging'; // staging deliberately advertises no sitemap
const jsonOut = flag('json');
const origin = new URL(base).origin;

const get = async (url, init) => {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(60_000), ...init });
    } catch (e) {
      if (i === 2) throw e;
    }
  }
};

const findings = [];
const add = (page, level, msg) => findings.push({ page, level, msg });

async function sampleUrls() {
  const fixed = ['', '/news', '/articles', '/books', '/magazines', '/events', '/forum', '/videos', '/authors', '/timeline', '/topics', '/about', '/contact', '/privacy', '/terms', '/accessibility', '/search?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA'];
  const urls = fixed.map((p) => `${origin}/${lang}${p}`);
  const res = await get(`${origin}/sitemap.xml`);
  if (res?.ok) {
    const xml = await res.text();
    const seen = new Set();
    for (const m of xml.matchAll(new RegExp(`<loc>(${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${lang}/([a-z-]+)/(\\d+))</loc>`, 'g'))) {
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      urls.push(m[1]);
    }
    const authors = xml.match(new RegExp(`<loc>(${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${lang}/authors/\\d+)</loc>`));
    if (authors) urls.push(authors[1]);
  }
  return urls;
}

const meta = (root, sel, attr = 'content') => root.querySelector(sel)?.getAttribute(attr) ?? '';

async function auditPage(url) {
  const path = url.replace(origin, '') || '/';
  const res = await get(url);
  const row = { url: path, status: res.status };
  if (res.status >= 300 && res.status < 400) {
    row.redirect = res.headers.get('location');
    add(path, 'warn', `redirects to ${row.redirect}`);
    return row;
  }
  if (res.status !== 200) {
    add(path, 'error', `HTTP ${res.status}`);
    return row;
  }
  const html = await res.text();
  const root = parse(html);
  row.bytes = html.length;
  const htmlEl = root.querySelector('html');
  row.lang = htmlEl?.getAttribute('lang');
  row.dir = htmlEl?.getAttribute('dir');
  if (!row.lang) add(path, 'error', 'missing <html lang>');
  if (!row.dir) add(path, 'error', 'missing <html dir>');

  row.title = root.querySelector('title')?.text.trim() ?? '';
  if (!row.title) add(path, 'error', 'missing <title>');
  else if (row.title.length > 70) add(path, 'warn', `title is ${row.title.length} chars (>70)`);
  row.description = meta(root, 'meta[name="description"]');
  if (!row.description) add(path, 'error', 'missing meta description');
  else if (row.description.length > 200) add(path, 'warn', `description is ${row.description.length} chars (>200)`);
  else if (row.description.length < 50) add(path, 'warn', `description is only ${row.description.length} chars`);

  row.canonical = meta(root, 'link[rel="canonical"]', 'href');
  if (!row.canonical) add(path, 'error', 'missing canonical');
  else {
    if (new URL(row.canonical).origin !== origin) add(path, 'error', `canonical host ${new URL(row.canonical).origin} != ${origin}`);
  }
  row.robots = meta(root, 'meta[name="robots"]');
  row.noindex = /noindex/i.test(row.robots);

  const og = Object.fromEntries(root.querySelectorAll('meta[property^="og:"]').map((m) => [m.getAttribute('property'), m.getAttribute('content')]));
  const tw = Object.fromEntries(root.querySelectorAll('meta[name^="twitter:"]').map((m) => [m.getAttribute('name'), m.getAttribute('content')]));
  row.ogType = og['og:type'];
  for (const k of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale']) if (!og[k]) add(path, row.noindex ? 'warn' : 'error', `missing ${k}`);
  if (!og['og:image:alt']) add(path, 'warn', 'missing og:image:alt');
  if (!tw['twitter:card']) add(path, 'error', 'missing twitter:card');
  if (og['og:url'] && row.canonical && og['og:url'] !== row.canonical && !row.noindex) add(path, 'warn', 'og:url differs from canonical');
  if (og['og:image']) {
    row.ogImage = og['og:image'];
    if (!/^https?:/.test(og['og:image'])) add(path, 'error', 'og:image is not absolute');
    else {
      // one GET per image (the card route is rate limited, so HEAD + GET would trip it); retry once after a 429
      let img = await get(og['og:image'], { redirect: 'follow' }).catch(() => null);
      if (img?.status === 429) {
        await new Promise((r) => setTimeout(r, 2500));
        img = await get(og['og:image'], { redirect: 'follow' }).catch(() => null);
      }
      if (!img || !img.ok) add(path, 'error', `og:image not reachable (${img?.status ?? 'network'})`);
      else if (!/^image\//.test(img.headers.get('content-type') ?? '')) add(path, 'error', `og:image content-type ${img.headers.get('content-type')}`);
      else if (/\/og\//.test(og['og:image'])) {
        // generated cards must be real 1200x630 PNGs (what the tags promise); read the IHDR chunk
        const bytes = Buffer.from(await img.arrayBuffer());
        const isPng = bytes.length > 24 && bytes.subarray(1, 4).toString() === 'PNG';
        const [w, h] = isPng ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : [0, 0];
        if (!isPng) add(path, 'error', 'og:image is not a PNG');
        else if (w !== 1200 || h !== 630) add(path, 'error', `og:image is ${w}x${h}, expected 1200x630`);
        if (bytes.length > 600 * 1024) add(path, 'warn', `og:image is ${(bytes.length / 1024).toFixed(0)} KB (messengers may skip >600 KB)`);
      }
    }
    if (og['og:image:width'] !== '1200' || og['og:image:height'] !== '630') add(path, 'warn', 'og:image:width/height not 1200/630');
  }
  const expectedType = /\/books\/\d+$/.test(path) ? 'book' : /\/authors\/\d+$/.test(path) ? 'profile' : /\/(articles|news)\/\d+$/.test(path) ? 'article' : /\/videos\/\d+$/.test(path) && html.includes('i.ytimg.com/vi/') ? 'video.other' : null;
  if (expectedType && og['og:type'] && og['og:type'] !== expectedType) add(path, 'warn', `og:type is ${og['og:type']}, expected ${expectedType}`);
  if (og['og:type'] === 'video.other' && !og['og:video']) add(path, 'warn', 'video.other without og:video');
  if (og['og:type'] === 'article' && !root.querySelector('meta[property="article:modified_time"]')) add(path, 'warn', 'article without article:modified_time');
  if (tw['twitter:card'] && !tw['twitter:image']) add(path, 'error', 'missing twitter:image');

  const alts = root.querySelectorAll('link[rel="alternate"][hreflang]').map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]);
  row.hreflang = alts.length;
  if (alts.length && !alts.some(([h]) => h === 'x-default')) add(path, 'warn', 'hreflang without x-default');
  if (alts.length && row.canonical && !alts.some(([, href]) => href === row.canonical) && !row.noindex) add(path, 'warn', 'canonical is not in the hreflang set (no self reference)');

  const h1 = root.querySelectorAll('h1');
  row.h1 = h1.length;
  if (h1.length !== 1) add(path, 'error', `${h1.length} <h1> elements`);

  const ld = root.querySelectorAll('script[type="application/ld+json"]');
  row.jsonld = [];
  for (const s of ld) {
    try {
      const data = JSON.parse(s.text);
      for (const d of Array.isArray(data) ? data : [data]) for (const n of d['@graph'] ?? [d]) row.jsonld.push(n['@type']);
    } catch {
      add(path, 'error', 'invalid JSON-LD');
    }
  }
  if (/\/(articles|books|magazines|news|events|forum|videos)\/\d+$/.test(path) && !row.jsonld.length) add(path, 'error', 'detail page without JSON-LD');
  if (path === `/${lang}` && !row.jsonld.includes('WebSite')) add(path, 'warn', 'home without WebSite JSON-LD');
  if (/\/(articles|books|magazines)\/\d+$/.test(path)) {
    const cite = root.querySelectorAll('meta[name^="citation_"]').length;
    row.citation = cite;
    if (!cite) add(path, 'warn', 'no citation_* meta tags');
  }
  const noAlt = root.querySelectorAll('img').filter((i) => i.getAttribute('alt') === undefined).length;
  if (noAlt) add(path, 'error', `${noAlt} <img> without alt attribute`);
  return row;
}

async function auditRobotsAndSitemap() {
  const r = await get(`${origin}/robots.txt`);
  const txt = r?.ok ? await r.text() : '';
  if (!txt) return add('/robots.txt', 'error', `unreachable (${r?.status})`);
  const sm = txt.match(/^Sitemap:\s*(\S+)/im)?.[1];
  if (!sm && staging) { /* expected: noindex preview */ } else if (!sm) add('/robots.txt', 'error', 'no Sitemap line');
  else if (new URL(sm).origin !== origin) add('/robots.txt', 'error', `Sitemap points to ${sm} (expected ${origin})`);
  if (/^Host:/im.test(txt)) {
    const host = txt.match(/^Host:\s*(\S+)/im)?.[1];
    if (host && new URL(host).origin !== origin) add('/robots.txt', 'error', `Host directive is ${host}`);
  }
  const m = await get(`${origin}/manifest.webmanifest`);
  if (m?.ok) {
    const j = await m.json().catch(() => null);
    if (!j) add('/manifest.webmanifest', 'error', 'invalid JSON');
    else {
      if (j.start_url && /^https?:/.test(j.start_url) && new URL(j.start_url).origin !== origin) add('/manifest.webmanifest', 'error', `start_url ${j.start_url}`);
      if (!j.icons?.length) add('/manifest.webmanifest', 'warn', 'no icons');
    }
  } else add('/manifest.webmanifest', 'warn', `status ${m?.status}`);
  const s = await get(`${origin}/sitemap.xml`);
  if (!s?.ok) return add('/sitemap.xml', 'error', `status ${s?.status}`);
  const xml = await s.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const foreign = locs.filter((l) => new URL(l).origin !== origin);
  if (foreign.length) add('/sitemap.xml', 'error', `${foreign.length} URLs on another host, e.g. ${foreign[0]}`);
  if (new Set(locs).size !== locs.length) add('/sitemap.xml', 'warn', 'duplicate <loc> entries');
  if (locs.some((l) => /[?#]/.test(l))) add('/sitemap.xml', 'warn', 'query/fragment URLs in sitemap');
  console.log(`sitemap: ${locs.length} URLs, ${(xml.length / 1024).toFixed(0)} KB`);
}

const urls = await sampleUrls();
const rows = [];
for (const u of urls) {
  try {
    rows.push(await auditPage(u));
  } catch (e) {
    add(u.replace(origin, ''), 'error', `fetch failed: ${e.message}`);
  }
}
await auditRobotsAndSitemap();

const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);
console.log(`\nSEO audit — ${base} (${lang})\n`);
for (const r of rows) console.log(`${pad(r.status, 4)} ${pad(r.url, 34)} ${pad(r.ogType, 8)} ld:${pad((r.jsonld ?? []).join(','), 36)} ${r.noindex ? 'NOINDEX ' : ''}${pad(r.title, 60)}`);
const errors = findings.filter((f) => f.level === 'error');
const warns = findings.filter((f) => f.level === 'warn');
console.log(`\n${errors.length} errors, ${warns.length} warnings`);
for (const f of [...errors, ...warns]) console.log(`  [${f.level}] ${f.page} — ${f.msg}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ base, lang, at: new Date().toISOString(), rows, findings }, null, 2));
process.exit(errors.length ? 1 : 0);
