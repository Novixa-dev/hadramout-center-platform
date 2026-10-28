#!/usr/bin/env node
/**
 * Real-browser journeys through the admin (Payload) with every staff role: sign-in and its errors, the forgot-password
 * notice, the dashboard numbers against the database, the interface language switch (RTL ⇄ LTR, persisted), list pages
 * (relationship cells resolve, no console errors), a full editorial cycle (create a draft with the rich-text editor →
 * it is not public → publish → it is public → delete), role limits for editor and reviewer, sign-out, phone layouts,
 * and the anti-framing headers.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/admin-e2e.mjs http://localhost:3100
 *
 * WRITES DATA (a news item, an uploaded image and two staff accounts, all removed at the end), so it refuses any host but localhost/127.0.0.1:
 * run it against a throwaway seeded database (CI's smoke tier does). Needs Chrome (CHROME_PATH or a standard location).
 * Exit code 1 when a check fails.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const base = (process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) ?? '').replace(/\/$/, '');
if (!base) {
  console.error('usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/admin-e2e.mjs http://localhost:<port>');
  process.exit(2);
}
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  console.error('admin-e2e creates and deletes content: it only runs against localhost (a throwaway database).');
  process.exit(2);
}
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (the seeded admin).');
  process.exit(2);
}
const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH.');
  process.exit(2);
}

const stamp = Date.now().toString(36);
const EDITOR = { email: `e2e-editor-${stamp}@example.org`, password: `e2e-editor-${stamp}-Pw!`, name: 'محرر الاختبار', role: 'editor' };
const REVIEWER = { email: `e2e-reviewer-${stamp}@example.org`, password: `e2e-reviewer-${stamp}-Pw!`, name: 'مراجع الاختبار', role: 'reviewer' };
const TITLE = `خبر اختبار آلي ${stamp}`;
const PNG_1PX = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
const mediaIds = [];

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ok = Boolean, timeout = 20000, every = 200) {
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

// ── REST helpers (cookie sessions, the same API the admin uses) ──────────────────────────────────────────
async function login(user) {
  const r = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
  const cookie = (r.headers.get('set-cookie') ?? '').split(';')[0];
  return { ok: r.ok, cookie, user: (await r.json().catch(() => ({}))).user };
}
const api = async (cookie, method, path, body) => {
  const r = await fetch(`${base}/api${path}`, { method, headers: { cookie, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, redirect: 'follow' });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-first-run', '--disable-extensions', ...(process.env.CI || process.env.LH_NO_SANDBOX ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });

async function journey(name, fn, viewport = { width: 1366, height: 900 }) {
  current = name;
  console.log(`▶ ${name}`);
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(90000);
  await page.setViewport(viewport);
  try {
    await fn(page, ctx);
  } catch (e) {
    check(false, 'journey completed without an exception', e.message);
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
const go = (page, path) => page.goto(base + path, { waitUntil: 'networkidle2' });
// Payload writes dir="RTL"/"LTR" in capitals; compare in lower case
const html = (page, attr) => page.$eval('html', (e, a) => (e.getAttribute(a) ?? '').toLowerCase(), attr);
const text = (page) => page.$eval('body', (b) => b.innerText);
async function signIn(page, user, lang = 'ar') {
  await page.setCookie({ name: 'payload-lng', value: lang, url: base });
  await go(page, '/admin/login');
  await page.type('input[type=email], input[name=email]', user.email);
  await page.type('input[type=password]', user.password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('button[type=submit]')]);
}
function watchErrors(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 160)} @ ${page.url()}`); });
  page.on('pageerror', (e) => problems.push(`exception: ${String(e).slice(0, 160)} @ ${page.url()}`));
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText ?? '')) problems.push(`failed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.status() >= 500) problems.push(`${r.status()}: ${r.url().slice(0, 120)}`); });
  return problems;
}

// Seeded state the dashboard must agree with (counted through the REST API as the admin).
const admin = await login(ADMIN);
if (!admin.ok) {
  console.error('The seeded admin cannot sign in through the API — check ADMIN_EMAIL / ADMIN_PASSWORD.');
  await browser.close();
  process.exit(1);
}
const countOf = async (slug, where = '') => (await api(admin.cookie, 'GET', `/${slug}?limit=1&depth=0${where}`)).json.totalDocs;

// 1 ── public surface of the admin ──────────────────────────────────────────────────────────────────────
await journey('sign-in page, errors, forgot password, headers', async (page) => {
  const res = await go(page, '/admin/login');
  const h = res.headers();
  check(/sameorigin/i.test(h['x-frame-options'] ?? ''), 'admin cannot be framed by other sites (X-Frame-Options)', h['x-frame-options']);
  check(/frame-ancestors 'self'/.test(h['content-security-policy'] ?? ''), 'admin CSP has frame-ancestors', h['content-security-policy']);
  check(Boolean(await page.$('.hc-logo')), "the Center's logo is on the sign-in page");
  // the browser asks for English (puppeteer's Accept-Language is en-US): the admin is still Arabic until staff choose otherwise
  check((await html(page, 'dir')) === 'rtl' && (await html(page, 'lang')) === 'ar', 'sign-in is Arabic (RTL) by default, whatever the browser language');
  await Promise.all([page.waitForFunction(() => document.documentElement.dir === 'ltr', { timeout: 30000 }), page.click('.hc-login-lang button')]);
  check((await html(page, 'lang')) === 'en', 'the sign-in screen can switch to English');
  await Promise.all([page.waitForFunction(() => document.documentElement.dir === 'rtl', { timeout: 30000 }), page.click('.hc-login-lang button')]);
  await page.type('input[type=email]', ADMIN.email);
  await page.type('input[type=password]', 'definitely-wrong-password');
  await page.click('button[type=submit]');
  await sleep(1500);
  check(page.url().includes('/admin/login'), 'a wrong password keeps you on the sign-in page');
  const toast = await waitFor(() => page.$$eval('[data-sonner-toast], .toast-error, .payload-toast-item', (els) => els.map((e) => e.textContent).join(' ')), Boolean, 8000).catch(() => '');
  check(toast.length > 0, 'a wrong password shows an error message', 'no toast');
  await go(page, '/admin/forgot');
  const t = await text(page);
  check(Boolean(await page.$('.hc-forgot')) && !(await page.$('input[type=email]')), 'forgot-password explains the real procedure (no email form while no mail provider exists)');
  check(/مدير النظام/.test(t), 'the notice tells staff to ask the administrator (Arabic by default)', t.slice(0, 120));
  const anon = await fetch(`${base}/api/users?limit=1`);
  check(anon.status === 403, 'anonymous REST cannot list users', anon.status);
  const redir = await go(page, '/admin');
  check(page.url().includes('/admin/login'), 'the dashboard redirects anonymous visitors to sign-in', redir?.status());
});

// 2 ── dashboard ───────────────────────────────────────────────────────────────────────────────────────
await journey('admin dashboard numbers and language switch', async (page) => {
  const problems = watchErrors(page);
  await signIn(page, ADMIN);
  check(page.url().replace(/\/$/, '').endsWith('/admin'), 'signed in to the dashboard', page.url());
  check(Boolean(await page.$('.hc-dash')), 'the editorial dashboard renders');
  const rows = await page.$$eval('.hc-table tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('th, td')].map((c) => c.textContent.trim())));
  const expected = await countOf('articles', '&where[status][equals]=published');
  const articles = rows.find((r) => r[0] === 'المقالات والدراسات');
  check(articles && Number(articles[1].replace(/\D/g, '')) === expected, 'published article count equals the database', `${articles?.[1]} vs ${expected}`);
  const drafts = await countOf('news', '&where[status][equals]=draft');
  const news = rows.find((r) => r[0] === 'الأخبار');
  check(news && Number(news[2].replace(/\D/g, '') || 0) === drafts, 'news draft count equals the database', `${news?.[2]} vs ${drafts}`);
  const uncategorised = await countOf('articles', '&where[status][equals]=published&where[category][exists]=false');
  const cardText = await page.$$eval('.hc-card', (cs) => cs.map((c) => c.textContent).join(' | '));
  check(cardText.includes(uncategorised.toLocaleString('en')), 'uncategorised-articles card equals the database', `${uncategorised} not in ${cardText.slice(0, 160)}`);
  // every link on the dashboard opens a page that exists
  const hrefs = [...new Set(await page.$$eval('.hc-dash a[href^="/admin"]', (as) => as.map((a) => a.getAttribute('href'))))];
  const bad = [];
  for (const h of hrefs) {
    const r = await fetch(base + h, { headers: { cookie: admin.cookie }, redirect: 'manual' });
    if (r.status >= 400) bad.push(`${h} → ${r.status}`);
  }
  check(bad.length === 0, `all ${hrefs.length} dashboard links open`, bad.join(', '));
  // interface language: one click, persisted across reloads, and back
  await Promise.all([page.waitForFunction(() => document.documentElement.dir === 'ltr', { timeout: 30000 }), page.click('.hc-actions__lang')]);
  check((await html(page, 'lang')) === 'en', 'the header switch turns the interface English (LTR)');
  await page.reload({ waitUntil: 'networkidle2' });
  const titleEn = await page.$eval('.hc-dash__title', (e) => e.textContent).catch(() => '(no title)');
  check((await html(page, 'dir')) === 'ltr' && titleEn.startsWith('Welcome'), 'English is remembered after a reload', `${await html(page, 'dir')} «${titleEn}»`);
  check(/Content language/.test(await text(page)), 'the content-language picker is labelled as such in English');
  await Promise.all([page.waitForFunction(() => document.documentElement.dir === 'rtl', { timeout: 30000 }), page.click('.hc-actions__lang')]);
  check((await html(page, 'lang')) === 'ar', 'and back to Arabic (RTL)');
  check(/لغة المحتوى/.test(await text(page)), 'the content-language picker is labelled «لغة المحتوى»');
  check(problems.length === 0, 'no console errors or failed requests on the dashboard', problems.slice(0, 3).join(' | '));
});

// 3 ── lists ───────────────────────────────────────────────────────────────────────────────────────────
await journey('list pages resolve relationships without errors', async (page) => {
  const problems = watchErrors(page);
  await signIn(page, ADMIN);
  for (const slug of ['articles', 'books', 'news', 'authors', 'messages', 'users']) {
    await go(page, `/admin/collections/${slug}`);
    const loading = await waitFor(() => page.$$eval('.table td', (tds) => tds.filter((td) => /^(Loading|يتم التحميل)/.test(td.textContent.trim())).length), (n) => n === 0, 15000).catch(() => -1);
    check(loading === 0, `${slug}: every relationship cell resolves (no stuck "Loading…")`);
  }
  // opening a document must not mark it as modified (the rich-text field once wrote its normalised HTML back on load,
  // which enabled "Save" and raised a leave-page warning on every article)
  await go(page, '/admin/collections/articles/1');
  await sleep(1500);
  check(await page.$eval('#action-save', (b) => b.disabled), 'opening an article leaves it unmodified (Save stays disabled)');
  // search box filters the list
  await go(page, '/admin/collections/articles?search=%D8%AD%D8%B6%D8%B1%D9%85%D9%88%D8%AA');
  const n = await page.$$eval('.table tbody tr', (r) => r.length);
  check(n > 0, 'searching the article list returns rows', n);
  check(problems.length === 0, 'no console errors or failed requests on 6 list pages', problems.slice(0, 3).join(' | '));
});

// 4 ── editorial cycle ─────────────────────────────────────────────────────────────────────────────────
let newsId = null;
await journey('create a draft, publish it, delete it', async (page) => {
  const problems = watchErrors(page);
  await signIn(page, ADMIN);
  await go(page, '/admin/collections/news/create');
  check(Boolean(await page.$('.hc-ed-field .field-label')), 'the body editor has its label');
  await page.type('#field-title', TITLE);
  await page.click('.hc-ed .ProseMirror');
  await page.keyboard.type('نص تجريبي يكتبه الاختبار الآلي ثم يحذفه.');
  await page.click('.hc-ed__group button[aria-label="عريض"]');
  check(await page.$eval('.hc-ed__group button[aria-label="عريض"]', (b) => b.getAttribute('aria-pressed') === 'true'), 'toolbar buttons report their state (aria-pressed)');
  await Promise.all([page.waitForFunction(() => /\/news\/\d+/.test(location.pathname), { timeout: 30000 }), page.click('#action-save')]);
  newsId = Number(page.url().match(/\/news\/(\d+)/)?.[1]);
  check(newsId > 0, 'saving a new item opens its edit page', page.url());
  const saved = await api(admin.cookie, 'GET', `/news/${newsId}?depth=0`);
  check(saved.json.title === TITLE && saved.json.status === 'draft', 'the item is stored as a draft with its title', JSON.stringify(saved.json).slice(0, 120));
  check(/<p>نص تجريبي/.test(saved.json.body ?? ''), 'the body written in the editor is stored as HTML', saved.json.body);
  const draftPublic = await fetch(`${base}/ar/news/${newsId}`);
  check(draftPublic.status === 404, 'a draft is not public', draftPublic.status);
  const anonApi = await fetch(`${base}/api/news/${newsId}`);
  check(anonApi.status === 404 || anonApi.status === 403, 'a draft is not readable through the anonymous API', anonApi.status);
  // publish through the status field (react-select)
  await page.click('#field-status .rs__control');
  await page.waitForSelector('.rs__option');
  await page.evaluate(() => [...document.querySelectorAll('.rs__option')].find((o) => o.textContent.trim() === 'منشور')?.click());
  await page.click('#action-save');
  const published = await waitFor(async () => (await api(admin.cookie, 'GET', `/news/${newsId}?depth=0`)).json.status, (s) => s === 'published');
  check(published === 'published', 'changing the status to «منشور» and saving publishes it');
  const pub = await waitFor(() => fetch(`${base}/ar/news/${newsId}`).then((r) => r.status), (s) => s === 200, 20000).catch((e) => e.message);
  check(pub === 200, 'the published item is public', pub);
  // delete from the document menu (admin only)
  await go(page, `/admin/collections/news/${newsId}`);
  await page.click('.doc-controls__popup .popup-button, .doc-controls__dots');
  await page.waitForSelector('#action-delete');
  await page.click('#action-delete');
  await page.waitForSelector('#confirm-action');
  await Promise.all([page.waitForFunction(() => /\/collections\/news\/?$/.test(location.pathname) || /\/collections\/news\?/.test(location.href), { timeout: 30000 }), page.click('#confirm-action')]);
  const gone = await api(admin.cookie, 'GET', `/news/${newsId}?depth=0`);
  check(gone.status === 404, 'deleting removes it', gone.status);
  if (gone.status === 404) newsId = null;
  check(problems.length === 0, 'no console errors or failed requests during the cycle', problems.slice(0, 3).join(' | '));
});

// 5 ── roles ───────────────────────────────────────────────────────────────────────────────────────────
const created = [];
for (const u of [EDITOR, REVIEWER]) {
  const r = await api(admin.cookie, 'POST', '/users', u);
  if (r.status === 201) created.push(r.json.doc.id);
  else console.log(`  (could not create ${u.role}: ${r.status} ${JSON.stringify(r.json).slice(0, 120)})`);
}

await journey('editor: content yes, users and deletion no', async (page) => {
  const ed = await login(EDITOR);
  check(ed.ok, 'an editor can sign in');
  const users = await api(ed.cookie, 'GET', '/users?limit=10&depth=0');
  check(users.json.totalDocs === 1 && users.json.docs?.[0]?.email === EDITOR.email, 'an editor sees only their own account', JSON.stringify(users.json.totalDocs));
  const promote = await api(ed.cookie, 'PATCH', `/users/${ed.user.id}`, { role: 'admin' });
  const after = await api(admin.cookie, 'GET', `/users/${ed.user.id}?depth=0`);
  check(after.json.role === 'editor', 'an editor cannot make themself admin', `${promote.status} → ${after.json.role}`);
  const anyNews = (await api(ed.cookie, 'GET', '/news?limit=1&depth=0')).json.docs?.[0];
  const del = await api(ed.cookie, 'DELETE', `/news/${anyNews.id}`);
  check(del.status === 403, 'an editor cannot delete content (admins only)', del.status);
  const create = await api(ed.cookie, 'POST', '/users', { email: `x-${stamp}@example.org`, password: 'abcdefgh12345', name: 'x', role: 'admin' });
  check(create.status === 403, 'an editor cannot create accounts', create.status);
  // uploads: a raster image is accepted (and resized), an SVG (can carry script, served from this origin) is refused
  const upload = async (name, type, bytes) => {
    const fd = new FormData();
    fd.append('file', new Blob([bytes], { type }), name);
    fd.append('_payload', JSON.stringify({ alt: 'صورة اختبار آلي' }));
    const r = await fetch(`${base}/api/media`, { method: 'POST', headers: { cookie: ed.cookie }, body: fd });
    return { status: r.status, json: await r.json().catch(() => ({})) };
  };
  const png = await upload(`e2e-${stamp}.png`, 'image/png', PNG_1PX);
  check(png.status === 201 && png.json.doc?.mimeType === 'image/png', 'an editor can upload an image', `${png.status} ${JSON.stringify(png.json).slice(0, 120)}`);
  if (png.json.doc?.id) {
    const file = await fetch(base + png.json.doc.url);
    check(file.ok && /image\/png/.test(file.headers.get('content-type') ?? ''), 'the uploaded image is served', file.status);
    mediaIds.push(png.json.doc.id);
  }
  const svg = await upload(`e2e-${stamp}.svg`, 'image/svg+xml', new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
  check(svg.status >= 400, 'an SVG upload is refused (script in a same-origin file)', svg.status);
  if (svg.json.doc?.id) mediaIds.push(svg.json.doc.id);
  // own password: a user can change it and sign in with the new one only
  const newPw = `${EDITOR.password}-2`;
  const pw = await api(ed.cookie, 'PATCH', `/users/${ed.user.id}`, { password: newPw });
  check(pw.status === 200, 'a user can change their own password', pw.status);
  check(!(await login(EDITOR)).ok && (await login({ ...EDITOR, password: newPw })).ok, 'only the new password works afterwards');
  EDITOR.password = newPw;
  await signIn(page, EDITOR);
  check(Boolean(await page.$('.hc-dash')) && (await page.$eval('.hc-badge', (b) => b.textContent)) === 'محرر', 'the dashboard shows the editor role');
  check(!(await page.$('.hc-quick a[href="/admin/collections/users"]')), 'no "users and roles" shortcut for editors');
  await go(page, `/admin/collections/news/${anyNews.id}`);
  await page.click('.doc-controls__popup .popup-button, .doc-controls__dots').catch(() => undefined);
  await sleep(400);
  check(!(await page.$('#action-delete')), 'the delete action is not offered to editors');
});

await journey('reviewer: translations only', async (page) => {
  const rv = await login(REVIEWER);
  check(rv.ok, 'a reviewer can sign in');
  const target = (await api(admin.cookie, 'GET', '/articles?limit=1&depth=0&where[status][equals]=published')).json.docs[0];
  const before = target.title;
  const pub = await api(rv.cookie, 'PATCH', `/articles/${target.id}?locale=ar`, { status: 'draft', title: 'تغيير غير مسموح' });
  const after = (await api(admin.cookie, 'GET', `/articles/${target.id}?depth=0&locale=ar`)).json;
  check(after.status === 'published' && after.title === before, 'a reviewer cannot unpublish or change the Arabic original', `${pub.status} ${after.status} ${after.title?.slice(0, 30)}`);
  await signIn(page, REVIEWER);
  check((await page.$eval('.hc-badge', (b) => b.textContent)) === 'مراجع ترجمة', 'the dashboard shows the reviewer role');
  check(!(await page.$('.hc-add')), 'reviewers get no "add" buttons');
  await go(page, `/admin/collections/articles/${target.id}`);
  await page.waitForSelector('.hc-ed-field');
  check(Boolean(await page.$('.hc-ed-field.read-only')) && (await page.$eval('.hc-ed .ProseMirror', (e) => e.getAttribute('contenteditable'))) === 'false', 'the Arabic body is read-only for a reviewer');
  check(!(await page.$('.hc-ed__bar')), 'no formatting toolbar on a read-only body');
  await go(page, `/admin/collections/articles/${target.id}?locale=en`);
  await page.waitForSelector('.hc-ed .ProseMirror');
  check((await page.$eval('.hc-ed .ProseMirror', (e) => e.getAttribute('contenteditable'))) === 'true', 'the English body is editable for a reviewer');
});

// 6 ── phone layouts ───────────────────────────────────────────────────────────────────────────────────
await journey('phone: no overflow, header controls do not overlap', async (page) => {
  await signIn(page, ADMIN);
  const bad = [];
  for (const lang of ['ar', 'en']) {
    await page.setCookie({ name: 'payload-lng', value: lang, url: base });
    for (const p of ['/admin', '/admin/collections/articles', '/admin/collections/articles/1', '/admin/account']) {
      try {
        await go(page, p);
      } catch (e) {
        bad.push(`${lang} ${p}: ${e.message}`);
        continue;
      }
      const r = await page.evaluate(() => {
        const over = document.documentElement.scrollWidth - window.innerWidth;
        const box = (s) => document.querySelector(s)?.getBoundingClientRect();
        const loc = box('.app-header__localizer .localizer-button');
        const nav = box('.app-header__step-nav-wrapper'); // the visible (clipping) box of the breadcrumb
        const overlap = loc && nav && loc.width > 0 && !(loc.right <= nav.left || loc.left >= nav.right);
        return { over, overlap };
      });
      if (r.over > 0) bad.push(`${lang} ${p}: ${r.over}px overflow`);
      if (r.overlap) bad.push(`${lang} ${p}: language picker covers the breadcrumb`);
    }
  }
  check(bad.length === 0, 'dashboard, list, edit and account fit a 390 px phone in Arabic and English', bad.join(' | '));
}, { width: 390, height: 844, isMobile: true, hasTouch: true });

// 7 ── sign-out ────────────────────────────────────────────────────────────────────────────────────────
await journey('sign-out ends the session', async (page) => {
  await signIn(page, ADMIN);
  await go(page, '/admin/logout');
  await sleep(1500);
  await go(page, '/admin');
  check(page.url().includes('/admin/login'), 'after signing out the dashboard asks to sign in again', page.url());
});

// ── cleanup ───────────────────────────────────────────────────────────────────────────────────────────
if (newsId) await api(admin.cookie, 'DELETE', `/news/${newsId}`);
for (const id of created) await api(admin.cookie, 'DELETE', `/users/${id}`);
for (const id of mediaIds) await api(admin.cookie, 'DELETE', `/media/${id}`);
await browser.close();

const failed = results.filter((r) => !r.ok);
const byJourney = new Map();
for (const r of results) { const s = byJourney.get(r.journey) ?? { ok: 0, bad: 0 }; if (r.ok) s.ok++; else s.bad++; byJourney.set(r.journey, s); }
console.log('\n' + [...byJourney].map(([j, s]) => `${s.bad ? '✗' : '✓'} ${j.padEnd(52)} ${s.ok} ok${s.bad ? `, ${s.bad} failed` : ''}`).join('\n'));
console.log(`\nadmin e2e on ${base}: ${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
