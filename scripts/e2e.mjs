#!/usr/bin/env node
/**
 * Real-browser end-to-end journeys (headless Chrome through puppeteer-core): the things unit tests and HTTP probes cannot see —
 * theme persistence, typeahead, copy attribution, saving, offline reading through the real service worker, the mobile menu,
 * keyboard access, language switching, and a console/network error watch across the main page types.
 *
 *   node scripts/e2e.mjs http://localhost:3100 --expect production      # a local production-mode server
 *   node scripts/e2e.mjs https://hadramout-center.novixa.dev            # the live staging site (default --expect staging)
 *
 * Needs Chrome (CHROME_PATH or a standard location). Read-only on the server: nothing is submitted or created.
 * Exit code 1 when a journey step fails.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
const expect = args.includes('--expect') ? args[args.indexOf('--expect') + 1] : 'staging';
if (!base) {
  console.error('usage: node scripts/e2e.mjs <https://host> [--expect staging|production]');
  process.exit(2);
}
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH.');
  process.exit(2);
}

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ok = Boolean, timeout = 15000, every = 150) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (ok(last)) return last;
    await sleep(every);
  }
  throw new Error(`timed out waiting (last value: ${JSON.stringify(last)?.slice(0, 160)})`);
}
let current = '';
function check(cond, name, detail = '') {
  results.push({ journey: current, ok: Boolean(cond), name, detail: cond ? '' : String(detail) });
  if (!cond) console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-first-run', '--disable-extensions', ...(process.env.CI || process.env.LH_NO_SANDBOX ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });

async function journey(name, fn, viewport = { width: 1366, height: 900 }) {
  current = name;
  console.log(`▶ ${name}`);
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.setViewport(viewport);
  try {
    await fn(page, ctx);
  } catch (e) {
    check(false, 'journey completed without an exception', e.message);
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
// A cold server renders and caches each page on first request: allow it more time, and retry once before calling a page broken.
const go = async (page, path, extra = {}) => {
  const opts = { waitUntil: 'networkidle2', timeout: 45000, ...extra };
  try {
    return await page.goto(base + path, opts);
  } catch (e) {
    if (!/timeout/i.test(String(e))) throw e;
    return page.goto(base + path, opts);
  }
};
const html = (page, attr) => page.$eval('html', (e, a) => e.getAttribute(a), attr);
const buttonByText = (page, text) => page.evaluateHandle((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().includes(t)) ?? null, text);

// 1 ── defaults and the theme toggle ───────────────────────────────────────────────────────────
await journey('defaults and theme', async (page) => {
  await go(page, '/ar');
  check((await html(page, 'data-theme')) === 'dark', 'dark theme is the default');
  check((await html(page, 'lang')) === 'ar' && (await html(page, 'dir')) === 'rtl', 'Arabic, right-to-left');
  const banner = await page.$('.staging-bar');
  check(expect === 'staging' ? Boolean(banner) : !banner, `preview banner ${expect === 'staging' ? 'shown' : 'absent'}`);
  const toggle = 'header button[aria-pressed]';
  await page.click(toggle);
  check((await html(page, 'data-theme')) === 'light', 'toggle switches to light');
  check((await page.evaluate(() => localStorage.getItem('hc-theme'))) === 'light', 'the choice is stored');
  check((await page.$eval('#hc-theme-color', (m) => m.content)) === '#fffbf5', 'theme-color follows the toggle');
  await page.reload({ waitUntil: 'networkidle2' });
  check((await html(page, 'data-theme')) === 'light', 'the choice survives a reload');
  await page.click(toggle);
  check((await html(page, 'data-theme')) === 'dark', 'toggle returns to dark');
});

// 2 ── search: keyboard shortcut, typeahead, results ──────────────────────────────────────────
await journey('search', async (page) => {
  await go(page, '/ar');
  await page.keyboard.press('/');
  await page.waitForSelector('.search-panel [role=combobox]');
  check(true, '"/" opens the search panel');
  await page.type('.search-panel [role=combobox]', 'حضرموت', { delay: 40 });
  const options = await waitFor(() => page.$$eval('[role=listbox] [role=option]', (o) => o.length), (n) => n > 0, 20000).catch(() => 0);
  check(options > 0, 'typeahead suggests documents', `${options} suggestions`);
  // Enter submits the typed query (a client-side navigation: wait for the URL, not for a page load)
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname === '/ar/search', { timeout: 20000 }).catch(() => undefined);
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 20000 }).catch(() => undefined);
  const url = new URL(page.url());
  check(url.pathname === '/ar/search' && url.searchParams.get('q') === 'حضرموت', 'Enter opens the results with the query in the URL', page.url());
  const links = await page.$$eval('main a[href^="/ar/"]', (a) => a.length);
  check(links > 8, 'results page lists documents', `${links} links`);
});

// 3 ── article: copy attribution, cite, save, service worker caches the saved page ─────────────
await journey('article tools, saving and offline reading', async (page, ctx) => {
  await go(page, '/ar/articles/894');
  const h1 = await page.$eval('h1', (e) => e.textContent.trim());
  check(h1.length > 5, 'article has a heading', h1);

  const copied = await page.evaluate(() => {
    const select = (node) => { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    const fire = () => { const dt = new DataTransfer(); const ev = new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true }); document.dispatchEvent(ev); return { plain: dt.getData('text/plain'), html: dt.getData('text/html'), prevented: ev.defaultPrevented }; };
    select(document.querySelector('#article-body p'));
    const long = fire();
    const range = document.createRange();
    const text = document.querySelector('#article-body p').firstChild;
    range.setStart(text, 0); range.setEnd(text, 6);
    const s = getSelection(); s.removeAllRanges(); s.addRange(range);
    return { long, short: fire() };
  });
  check(copied.long.prevented && copied.long.plain.includes('/ar/articles/894') && copied.long.plain.includes('\n\n') && copied.long.html.includes('<p>'), 'copying a passage appends the source line and URL (text and HTML)', JSON.stringify(copied.long).slice(0, 200));
  check(!copied.short.prevented, 'a short selection is copied untouched');

  const cite = await buttonByText(page, 'استشهاد');
  check(Boolean(cite.asElement()), 'cite button exists');
  await cite.asElement()?.click();
  await page.waitForSelector('[role=dialog]').catch(() => undefined);
  check((await page.evaluate(() => document.body.innerText.includes('APA'))), 'cite panel offers APA and other styles');
  await page.keyboard.press('Escape');

  const save = await buttonByText(page, 'حفظ');
  check(Boolean(save.asElement()), 'save button exists');
  await save.asElement()?.click();
  check((await page.evaluate(() => (JSON.parse(localStorage.getItem('hc-saved') ?? '[]')).some((s) => s.url === '/ar/articles/894'))), 'saving stores the article locally');

  const hasSw = await page.evaluate(() => 'serviceWorker' in navigator);
  check(hasSw, 'service workers are available');
  const registered = await page.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 20000))]));
  check(registered, 'the service worker registers and activates');
  if (!registered) return;
  const cached = await waitFor(() => page.evaluate(async () => { const c = await caches.open('hc-saved-v1'); return (await c.keys()).map((k) => new URL(k.url).pathname); }), (p) => p.includes('/ar/articles/894'), 15000).catch(() => []);
  check(cached.includes('/ar/articles/894'), 'the saved article is stored for offline use', JSON.stringify(cached));
  const precached = await page.evaluate(async () => { const c = await caches.open('hc-static-v1'); return (await c.keys()).map((k) => new URL(k.url).pathname); });
  check(precached.includes('/offline.html'), 'the offline page is precached');

  // visit the saved list while the worker controls the page, so the styles are cached too
  await go(page, '/ar/saved');
  await waitFor(() => page.$$eval('.entry', (e) => e.length), (n) => n > 0, 10000).catch(() => undefined);
  check((await page.$$eval('.entry a', (a) => a.some((x) => x.getAttribute('href') === '/ar/articles/894'))), 'the saved list shows the article');
  check((await page.$$eval('button', (b) => ['RIS', 'BibTeX', 'CSL-JSON'].every((k) => b.some((x) => x.textContent.includes(k))))), 'saved list offers RIS, BibTeX and CSL-JSON');

  // go offline: the page AND the worker (otherwise the worker's own fetch would still succeed)
  const swTarget = ctx.targets().find((t) => t.type() === 'service_worker');
  check(Boolean(swTarget), 'the service worker target is visible');
  const swSession = swTarget ? await swTarget.createCDPSession() : null;
  if (swSession) {
    await swSession.send('Network.enable');
    await swSession.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
  await page.setOfflineMode(true);
  try {
    await page.goto(base + '/ar/articles/894', { waitUntil: 'domcontentloaded' });
    const offlineH1 = await page.$eval('h1', (e) => e.textContent.trim()).catch(() => '');
    check(offlineH1 === h1, 'a saved article opens offline', offlineH1);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(bg === 'rgb(14, 24, 21)', 'and is styled offline (stylesheet came from the cache)', bg);
    await page.goto(base + '/ar/articles/893', { waitUntil: 'domcontentloaded' });
    const fallback = await page.$eval('h1', (e) => e.textContent.trim()).catch(() => '');
    check(fallback.includes('لا يوجد اتصال'), 'an unsaved page shows the offline page', fallback);
  } finally {
    await page.setOfflineMode(false);
    if (swSession) await swSession.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
});

// 4 ── mobile menu ────────────────────────────────────────────────────────────────────────────
await journey('mobile menu', async (page) => {
  await go(page, '/ar');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, 'no horizontal overflow at 390 px', `${overflow}px`);
  await page.click('.menu-toggle');
  await page.waitForSelector('.drawer[role=dialog]');
  check((await page.$$eval('.drawer__nav a', (a) => a.length)) >= 5, 'the drawer lists the main sections');
  await page.keyboard.press('Escape');
  const closed = await waitFor(() => page.$eval('.drawer', (d) => d.hidden), Boolean, 5000).catch(() => false);
  check(closed, 'Escape closes the drawer');
  check(await page.evaluate(() => document.activeElement?.classList.contains('menu-toggle')), 'focus returns to the menu button');
}, { width: 390, height: 844, isMobile: true, hasTouch: true });

// 5 ── keyboard: skip link ────────────────────────────────────────────────────────────────────
await journey('keyboard and skip link', async (page) => {
  await go(page, '/ar');
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ cls: document.activeElement?.className, href: document.activeElement?.getAttribute('href') }));
  check(String(first.cls).includes('skip-link') && first.href === '#main', 'the first Tab stop is the skip link', JSON.stringify(first));
  await page.keyboard.press('Enter');
  check((await page.evaluate(() => location.hash)) === '#main' && (await page.evaluate(() => document.activeElement?.id)) === 'main', 'activating it moves focus to the main content');
});

// 6 ── language switch and persistence ────────────────────────────────────────────────────────
await journey('language switch', async (page) => {
  await go(page, '/ar');
  await page.click('.lang-trigger');
  await page.waitForSelector('.lang-panel[role=dialog]');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('.lang-panel a[hreflang="en"]')]);
  check(new URL(page.url()).pathname.startsWith('/en'), 'choosing English opens /en', page.url());
  check((await html(page, 'dir')) === 'ltr' && String(await html(page, 'lang')).startsWith('en'), 'English is left-to-right');
  if (expect === 'staging') check((await page.$eval('.staging-bar', (e) => e.textContent)).includes('Preview version'), 'the preview banner is translated');
  await page.goto(base + '/', { waitUntil: 'networkidle2' });
  check(new URL(page.url()).pathname.startsWith('/en'), 'the language choice is remembered for the bare address', page.url());
});

// 7 ── forms and admin entry ──────────────────────────────────────────────────────────────────
await journey('contact form and admin login page', async (page) => {
  await go(page, '/ar/contact');
  const invalid = await page.$eval('form', (f) => !f.checkValidity());
  check(invalid, 'the empty contact form is invalid (required fields enforced in the browser)');
  await go(page, '/admin/login');
  check(Boolean(await page.$('input[type=password]')) && Boolean(await page.$('input[type=email], input[name=email]')), 'the admin login form renders');
});

// 8 ── no console errors, failed requests or CSP violations on the main page types ───────────
await journey('clean console and network', async (page) => {
  const problems = [];
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 140)} @ ${page.url()}`); });
  page.on('pageerror', (e) => problems.push(`exception: ${String(e).slice(0, 140)} @ ${page.url()}`));
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText ?? '')) (r.resourceType() === 'image' ? warnings : problems).push(`failed ${r.resourceType()}: ${r.url().slice(0, 100)} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/hc/suggest')) (r.request().resourceType() === 'image' ? warnings : problems).push(`${r.status()} ${r.request().resourceType()}: ${r.url().slice(0, 100)}`); });
  const pages = ['/ar', '/ar/articles', '/ar/articles/894', '/ar/books/37', '/ar/magazines/40', '/ar/search?q=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA', '/ar/timeline', '/ar/topics', '/ar/authors/146', '/ar/contact', '/ar/about', '/en'];
  for (const p of pages) await go(page, p);
  check(problems.length === 0, `no console errors, exceptions or failed requests on ${pages.length} pages`, problems.slice(0, 4).join(' | '));
  if (warnings.length) console.log(`  (note: ${warnings.length} image requests failed — expected on a local database without mirrored images)`);
});

await browser.close();
const failed = results.filter((r) => !r.ok);
const byJourney = new Map();
for (const r of results) { const s = byJourney.get(r.journey) ?? { ok: 0, bad: 0 }; if (r.ok) s.ok++; else s.bad++; byJourney.set(r.journey, s); }
console.log('\n' + [...byJourney].map(([j, s]) => `${s.bad ? '✗' : '✓'} ${j.padEnd(44)} ${s.ok} ok${s.bad ? `, ${s.bad} failed` : ''}`).join('\n'));
console.log(`\ne2e on ${base} (expecting ${expect}): ${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
