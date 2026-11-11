#!/usr/bin/env node
/**
 * HTTP journeys through the digital platforms: accounts, orders, pledges, volunteering, and the walls around them.
 * It WRITES rows, so it runs only against a throwaway copy (scripts/smoke-prod.sh), never against a live site.
 *   node scripts/platform-check.mjs http://127.0.0.1:3100 --db path/to/payload.db
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const base = process.argv[2];
const args = process.argv.slice(3);
const dbPath = args.includes('--db') ? args[args.indexOf('--db') + 1] : null;
if (!base || !dbPath) {
  console.error('usage: node scripts/platform-check.mjs <base-url> --db <payload.db>');
  process.exit(2);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(base)) {
  console.error('refused: this script writes to the database, so it only runs against a local copy');
  process.exit(2);
}

let failed = 0;
const check = (cond, name, detail = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} platforms: ${name}${cond || !detail ? '' : ` (${detail})`}`);
  if (!cond) failed++;
};

// every run looks like a new visitor, so a repeated run on one database is not stopped by its own rate limits
const visitor = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
const post = async (path, body, { cookie, headers } = {}) => {
  const res = await fetch(base + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': visitor, ...(cookie ? { cookie } : {}), ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, cookie: res.headers.getSetCookie().find((c) => c.startsWith('hc_member=')), cookies: res.headers.getSetCookie(), cache: res.headers.get('cache-control'), json: await res.json().catch(() => null) };
};
const get = (path, cookie) => fetch(base + path, { redirect: 'manual', headers: cookie ? { cookie } : {} });
const pair = (setCookie) => setCookie?.split(';')[0];

const db = new DatabaseSync(dbPath);
const stamp = Date.now();
const email = `reader-${stamp}@example.com`;
const password = 'first-password-1';
const contact = { name: 'قارئ تجريبي', email: `guest-${stamp}@example.com`, phone: '+967777000111', consent: true };
const book = db.prepare("SELECT id FROM books WHERE status = 'published' LIMIT 1").get().id;

// ── pages
for (const p of ['/ar/account', '/en/account', '/ar/store', '/en/store', '/ar/donate', '/ar/volunteer', '/ar/culture', '/en/culture', '/ar/encyclopedia', '/ar/platforms']) {
  check((await get(p)).status === 200, `${p} answers 200`);
}
const store = await (await get('/ar/store')).text();
const bookCount = db.prepare("SELECT count(*) AS n FROM books WHERE status = 'published'").get().n;
check(new RegExp(`الكتب \\(${bookCount}\\)`).test(store.replace(/<!-- -->/g, '')), `the store lists all ${bookCount} books by default`);
const platforms = await (await get('/ar/platforms')).text();
check(!platforms.includes('تحت الإنشاء'), 'the platforms page no longer says «تحت الإنشاء»');
const account = await (await get('/ar/account')).text();
check(/noindex/.test(account), 'the account page is not indexable');

// ── cross-site and malformed requests
const register = { name: 'قارئ تجريبي', email, password, consent: true };
check((await post('/api/hc/member/register', register, { headers: { origin: 'https://evil.example' } })).status === 403, 'sign-up from another origin is refused');
check((await post('/api/hc/requests/pledge', contact, { headers: { origin: 'https://evil.example' } })).status === 403, 'a request from another origin is refused');
const formPost = await fetch(`${base}/api/hc/member/login`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': visitor }, body: `email=${email}&password=x` });
check(formPost.status === 403, 'a plain cross-site form cannot reach the login route');
check((await post('/api/hc/member/register', 'not json')).status === 400, 'broken JSON answers 400');
check((await post('/api/hc/member/nope', {})).status === 401, 'an unknown action without a session answers 401');
check((await post('/api/hc/requests/nope', {})).status === 404, 'an unknown request kind answers 404');

// ── accounts
check((await post('/api/hc/member/register', { ...register, password: 'short' })).json?.error === 'weak', 'a short password is refused');
check((await post('/api/hc/member/register', { ...register, consent: false })).json?.error === 'consent', 'sign-up needs consent');
const signup = await post('/api/hc/member/register', register);
check(signup.status === 200 && Boolean(signup.cookie), 'sign-up succeeds and starts a session', String(signup.status));
check(/httponly/i.test(signup.cookie ?? '') && /samesite=lax/i.test(signup.cookie ?? '') && /secure/i.test(signup.cookie ?? ''), 'the session cookie is HttpOnly, Secure and SameSite=Lax', signup.cookie);
check(!signup.cookies.some((c) => c.startsWith('payload-token')), 'a member never receives a staff session cookie');
check(signup.cache === 'no-store', 'account answers are not cacheable');
let session = pair(signup.cookie);
const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
check(Boolean(row) && row.password_hash?.startsWith('scrypt$') && !JSON.stringify(row).includes(password), 'the password is stored only as a scrypt hash');
check((await post('/api/hc/member/register', { ...register, email: email.toUpperCase() })).status === 409, 'the same address in other letter case cannot register twice');
const me = await (await get('/api/hc/member/me', session)).json();
check(me.member?.email === email && !JSON.stringify(me).includes('scrypt') && !('id' in me.member), 'the session reads back only its own contact details');
check((await (await get('/api/hc/member/me')).json()).member === null, 'a visitor reads no member');
check((await get('/api/hc/member/saved')).status === 401, 'a visitor has no saved list');
const welcome = await (await get('/ar/account', session)).text();
check(welcome.replace(/<!-- -->/g, '').includes('أهلًا، قارئ تجريبي') && welcome.includes(email), 'the account page greets the member');
check(!(await (await get('/ar/account')).text()).includes(email), 'the same page shows a visitor nothing of it');

// ── a member is nothing to the staff system
const asMember = (p) => get(p, session);
for (const p of ['/api/users', '/api/orders', '/api/members', '/api/pledges', '/api/volunteers', '/api/messages']) check((await asMember(p)).status === 403, `a member gets 403 from ${p}`);
const staffMe = await (await asMember('/api/users/me')).json().catch(() => ({}));
check(!staffMe.user, 'a member session is no staff session');
const draftId = db.prepare("SELECT id FROM books WHERE status = 'published' LIMIT 1").get().id;
db.prepare("UPDATE books SET status = 'draft' WHERE id = ?").run(draftId);
const draftRead = await asMember(`/api/books/${draftId}`);
check(draftRead.status === 403 || draftRead.status === 404, 'a member cannot read a draft through REST', String(draftRead.status));
const memberToken = decodeURIComponent(session.split('=')[1]);
const asJwt = await fetch(`${base}/api/users`, { headers: { authorization: `JWT ${memberToken}` } });
check(asJwt.status === 403, 'a member token presented as a staff JWT is refused', String(asJwt.status));
const orderDraft = await post('/api/hc/requests/order', { ...contact, address: 'المكلا، حضرموت', items: [{ book: draftId, quantity: 1 }] });
check(orderDraft.status === 409, 'a draft book cannot be ordered', String(orderDraft.status));
db.prepare("UPDATE books SET status = 'published' WHERE id = ?").run(draftId);

// ── visitors and the REST API
for (const c of ['members', 'orders', 'pledges', 'volunteers']) {
  check((await get(`/api/${c}`)).status === 403, `a visitor gets 403 from /api/${c}`);
  const created = await fetch(`${base}/api/${c}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"x","email":"x@example.com","reference":"x"}' });
  check(created.status === 403, `a visitor cannot create through /api/${c}`, String(created.status));
}

// ── requests
const order = await post('/api/hc/requests/order', { ...contact, address: 'المكلا، حضرموت', note: '<b>عاجل</b>', member: 1, status: 'paid', items: [{ book, quantity: 2 }] }, { cookie: session });
check(order.status === 200 && /^HC-O-\d{4}-/.test(order.json?.reference ?? ''), 'a member can send an order and gets a reference', JSON.stringify(order.json));
const orderRow = db.prepare('SELECT * FROM orders WHERE reference = ?').get(order.json?.reference);
check(orderRow?.member_id === row.id, 'the order is linked to the account by the session, not by the form');
check(orderRow?.status === 'new', 'the form cannot set the status of its own order');
check(orderRow?.note === 'عاجل', 'tags are stripped from the note');
const line = db.prepare('SELECT * FROM orders_items WHERE _parent_id = ?').get(orderRow?.id);
const titleNow = db.prepare("SELECT title FROM books_locales WHERE _parent_id = ? AND _locale = 'ar'").get(book).title;
check(line?.title === titleNow && line?.quantity === 2, 'the order line takes the title from the database');
const guest = await post('/api/hc/requests/pledge', { ...contact, amount: '50', currency: 'USD' });
check(guest.status === 200 && db.prepare('SELECT member_id FROM pledges WHERE reference = ?').get(guest.json?.reference)?.member_id === null, 'a visitor can pledge with no account');
const volunteer = await post('/api/hc/requests/volunteer', { ...contact, areas: ['media'], experience: 'أعمل في التصوير منذ سنوات' }, { cookie: session });
check(volunteer.status === 200, 'a member can apply to volunteer');
const honeypot = await post('/api/hc/requests/pledge', { ...contact, website: 'spam' });
check(honeypot.status === 200 && honeypot.json?.reference === null, 'the honeypot pretends success and stores nothing');
const listed = (await (await get('/ar/account', session)).text());
check(listed.includes(order.json?.reference) && listed.includes(volunteer.json?.reference), 'the member sees their requests');
check(!listed.includes(guest.json?.reference), "the member does not see another visitor's request");
db.prepare("UPDATE books SET store_status = 'hidden' WHERE id = ?").run(book);
check((await post('/api/hc/requests/order', { ...contact, address: 'المكلا، حضرموت', items: [{ book, quantity: 1 }] })).status === 409, 'a book hidden from the store cannot be ordered');
db.prepare("UPDATE books SET store_status = 'on_request' WHERE id = ?").run(book);

// ── payment receipts
const receiptsDir = join(dirname(dbPath), 'receipts'); // smoke-prod.sh keeps the database in DATA_DIR
const gpsPhoto = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#e8dcc0' } })
  .jpeg()
  .withExif({ IFD0: { Make: 'PhoneMaker', Artist: 'Owner Name' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '14/1 32/1 0/1' } })
  .toBuffer();
const upload = async (fields, file, { ip = visitor, cookie, headers } = {}) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  if (file) form.set('receipt', new Blob([file.data], { type: file.type ?? 'image/jpeg' }), file.name ?? 'receipt.jpg');
  const res = await fetch(`${base}/api/hc/receipts`, { method: 'POST', body: form, headers: { 'x-forwarded-for': ip, ...(cookie ? { cookie } : {}), ...headers } });
  return { status: res.status, cache: res.headers.get('cache-control'), json: await res.json().catch(() => null) };
};
const photo = { data: gpsPhoto };
for (const p of ['/ar/donate', '/ar/store']) {
  const html = await (await get(p)).text();
  check(html.includes('id="receipt"') && html.includes('name="receipt"') && html.includes('accept="image/jpeg,image/png,image/webp"'), `${p} has the receipt upload form`);
}
const pledgeRef = guest.json?.reference;
const pledgeRow = db.prepare('SELECT id FROM pledges WHERE reference = ?').get(pledgeRef);
check((await upload({ reference: pledgeRef, email: contact.email }, photo, { headers: { origin: 'https://evil.example' } })).status === 403, 'a receipt from another origin is refused');
const asJson = await fetch(`${base}/api/hc/receipts`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': visitor }, body: '{}' });
check(asJson.status === 400, 'the receipt route takes only an upload form', String(asJson.status));
check((await upload({ reference: pledgeRef, email: 'someone-else@example.com' }, photo)).json?.error === 'notfound', 'a receipt needs the email the request was sent with');
check((await upload({ reference: volunteer.json?.reference, email: contact.email }, photo)).json?.error === 'reference', 'a volunteer application takes no receipt');
check((await upload({ reference: pledgeRef, email: contact.email }, { data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), name: 'x.jpg' })).json?.error === 'file', 'a script dressed as a .jpg is refused');
check((await upload({ reference: pledgeRef, email: contact.email }, { data: Buffer.from([0, 0, 0, 24, ...Buffer.from('ftypheic'), 0, 0, 0, 0, 0, 0, 0, 0]), name: 'IMG_1.HEIC' })).json?.error === 'heic', 'an iPhone HEIC photo gets its own explanation');
const sentReceipt = await upload({ reference: pledgeRef.toLowerCase(), email: contact.email.toUpperCase(), amount: '50', currency: 'USD', transferRef: 'TX-778899', note: '<b>تحويل</b>', status: 'verified', member: '1' }, photo);
check(sentReceipt.status === 200 && sentReceipt.cache === 'no-store', 'a visitor sends a receipt for their pledge with its reference and email', JSON.stringify(sentReceipt.json));
const receiptRow = db.prepare('SELECT * FROM receipts WHERE reference = ? ORDER BY id DESC').get(pledgeRef);
check(receiptRow?.kind === 'pledge' && receiptRow?.pledge_id === pledgeRow?.id && receiptRow?.status === 'new' && receiptRow?.member_id === null, 'the receipt is linked to the pledge; the form sets neither its status nor an account');
check(receiptRow?.transfer_ref === 'TX-778899' && receiptRow?.note === 'تحويل' && receiptRow?.amount === 50, 'its details are kept, tags stripped');
check(/^receipt-[0-9a-f]{24}\.jpg$/.test(receiptRow?.filename ?? '') && receiptRow?.mime_type === 'image/jpeg', 'the file gets an unguessable name and is a JPEG', receiptRow?.filename);
const stored = receiptRow?.filename && existsSync(join(receiptsDir, receiptRow.filename)) ? readFileSync(join(receiptsDir, receiptRow.filename)) : null;
check(Boolean(stored) && !(await sharp(stored).metadata()).exif && !stored.includes('PhoneMaker'), 'the stored photo carries no GPS or device data', receiptsDir);
const fileUrl = `/api/receipts/file/${receiptRow?.filename}`;
const anonFile = await get(fileUrl);
check(anonFile.status !== 200 && !(anonFile.headers.get('content-type') ?? '').startsWith('image/'), 'a visitor cannot open a receipt, even with its address', String(anonFile.status));
check((await get(fileUrl, session)).status !== 200, 'nor can a signed-in member');
check((await get('/api/receipts')).status === 403, 'a visitor gets 403 from /api/receipts');
const receiptCreate = await fetch(`${base}/api/receipts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"reference":"x","kind":"order"}' });
check(receiptCreate.status === 403, 'a visitor cannot create through /api/receipts', String(receiptCreate.status));
const memberReceipt = await upload({ reference: order.json?.reference, email: contact.email }, photo, { cookie: session, ip: `${visitor.slice(0, -1)}7` });
check(memberReceipt.status === 200 && db.prepare('SELECT member_id, order_id FROM receipts WHERE reference = ?').get(order.json?.reference)?.order_id === orderRow?.id, 'a member sends a receipt for their order', JSON.stringify(memberReceipt.json));
check((await (await get('/ar/account', session)).text()).includes('السند قيد التحقق'), "the member's account shows the receipt is being checked");
const huge = Buffer.alloc(9 * 1024 * 1024, 1);
check((await upload({ reference: pledgeRef, email: contact.email }, { data: huge }, { ip: `${visitor.slice(0, -1)}6` })).status === 413, 'a file over 8 MB is refused before it is read');
const cancelled = await post('/api/hc/requests/pledge', { ...contact, amount: '5', currency: 'USD' });
db.prepare("UPDATE pledges SET status = 'cancelled' WHERE reference = ?").run(cancelled.json?.reference);
check((await upload({ reference: cancelled.json?.reference, email: contact.email }, photo, { ip: `${visitor.slice(0, -1)}6` })).json?.error === 'closed', 'a cancelled request takes no receipt');
const many = `${visitor.slice(0, -1)}5`;
for (let i = 0; i < 3; i++) await upload({ reference: pledgeRef, email: contact.email }, photo, { ip: many });
check((await upload({ reference: pledgeRef, email: contact.email }, photo, { ip: many })).status === 200, 'up to five receipts per request');
check((await upload({ reference: pledgeRef, email: contact.email }, photo, { ip: many })).json?.error === 'tooMany', 'a sixth is refused, so a known reference cannot fill the disk');

// ── reading list
const saved = [{ id: 'article:1', title: 'عنوان', url: '/ar/articles/1', type: 'article' }, { id: 'evil', title: 'x', url: '//evil.example', type: 'article' }];
check((await post('/api/hc/member/saved', { items: saved }, { cookie: session })).json?.count === 1, 'a saved list keeps same-site links only');
check((await (await get('/api/hc/member/saved', session)).json()).items?.[0]?.id === 'article:1', 'the saved list reads back');

// ── passwords and sessions
const oldSession = session;
check((await post('/api/hc/member/login', { email, password: 'wrong-password-1' })).status === 401, 'a wrong password answers 401');
check((await post('/api/hc/member/login', { email: `nobody-${stamp}@example.com`, password })).status === 401, 'an unknown address gets the same answer');
const login = await post('/api/hc/member/login', { email: email.toUpperCase(), password });
check(login.status === 200 && Boolean(login.cookie), 'sign-in works, in any letter case');
check((await post('/api/hc/member/password', { current: 'wrong-password-1', next: 'second-password-2' }, { cookie: session })).status === 403, 'changing the password needs the current one');
check((await post('/api/hc/member/password', { current: password, next: 'short' }, { cookie: session })).json?.error === 'weak', 'a short new password is refused');
const changed = await post('/api/hc/member/password', { current: password, next: 'second-password-2' }, { cookie: session });
check(changed.status === 200 && Boolean(changed.cookie), 'the password changes and this device stays signed in');
session = pair(changed.cookie);
check((await (await get('/api/hc/member/me', oldSession)).json()).member === null, 'older sessions end when the password changes');
check((await (await get('/api/hc/member/me', session)).json()).member?.email === email, 'the new session works');
check((await post('/api/hc/member/profile', { name: 'اسم جديد', phone: '+967700000000', email: 'other@example.com', status: 'suspended' }, { cookie: session })).status === 200, 'the profile can be edited');
const edited = db.prepare('SELECT * FROM members WHERE id = ?').get(row.id);
check(edited.name === 'اسم جديد' && edited.email === email && edited.status === 'active', 'the profile form changes neither the address nor the status');
db.prepare("UPDATE members SET status = 'suspended' WHERE id = ?").run(row.id);
check((await (await get('/api/hc/member/me', session)).json()).member === null, 'suspending an account ends its sessions');
check((await post('/api/hc/member/login', { email, password: 'second-password-2' })).status === 401, 'a suspended account cannot sign in');
db.prepare("UPDATE members SET status = 'active' WHERE id = ?").run(row.id);

// ── what staff see (only with an admin account, as in CI)
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const staffLogin = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  const { token } = await staffLogin.json();
  const auth = { authorization: `JWT ${token}`, 'content-type': 'application/json' };
  const orders = await (await fetch(`${base}/api/orders?limit=5`, { headers: auth })).json();
  check(orders.docs?.some((o) => o.reference === order.json.reference), 'an administrator sees the order');
  const members = await (await fetch(`${base}/api/members?limit=5`, { headers: auth })).json();
  const shown = members.docs?.find((m) => m.email === email);
  check(Boolean(shown) && !('passwordHash' in shown) && !('sessionVersion' in shown) && !('savedItems' in shown), 'an administrator sees the member but no secret');
  const tooShort = await fetch(`${base}/api/members/${row.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ temporaryPassword: 'short' }) });
  check(tooShort.status >= 400, 'a short temporary password is refused', String(tooShort.status));
  const reset = await fetch(`${base}/api/members/${row.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ temporaryPassword: 'temporary-password-3' }) });
  check(reset.status === 200, 'an administrator can set a temporary password', String(reset.status));
  check(!JSON.stringify(db.prepare('SELECT * FROM members WHERE id = ?').get(row.id)).includes('temporary-password-3'), 'the temporary password is not stored as text');
  check((await (await get('/api/hc/member/me', session)).json()).member === null, 'a temporary password ends the old sessions');
  const viaTemp = await post('/api/hc/member/login', { email, password: 'temporary-password-3' });
  check(viaTemp.status === 200, 'the member signs in with it', String(viaTemp.status));
  session = pair(viaTemp.cookie);
  const hack = await fetch(`${base}/api/members/${row.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ passwordHash: 'scrypt$x', sessionVersion: 99 }) });
  const after = db.prepare('SELECT password_hash, session_version FROM members WHERE id = ?').get(row.id);
  check(hack.status === 200 && after.password_hash !== 'scrypt$x' && after.session_version !== 99, 'the hash cannot be written directly, even by an administrator');
} else {
  console.log('skip platforms: staff checks (set ADMIN_EMAIL and ADMIN_PASSWORD)');
}

// ── staff work on the status, not on what the visitor sent
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const { token } = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) })).json();
  const auth = { authorization: `JWT ${token}`, 'content-type': 'application/json' };
  const url = `${base}/api/orders/${orderRow.id}`;
  const partial = await fetch(url, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'confirmed', staffNotes: 'ملاحظة', reference: 'HC-FORGED', member: null, name: 'مزور', items: [] }) });
  const afterPatch = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRow.id);
  check(partial.status === 200 && afterPatch.status === 'confirmed' && afterPatch.staff_notes === 'ملاحظة', 'staff can set the status and their notes', String(partial.status));
  check(afterPatch.reference === orderRow.reference && afterPatch.member_id === row.id && afterPatch.name === orderRow.name, 'the REST API cannot rewrite what the visitor sent');
  check(db.prepare('SELECT count(*) AS n FROM orders_items WHERE _parent_id = ?').get(orderRow.id).n === 1, 'nor its books');
  // receipts: staff open the photo and judge it; they cannot rewrite or replace what was sent
  const staffFile = await fetch(`${base}${fileUrl}`, { headers: { authorization: `JWT ${token}` } });
  check(staffFile.status === 200 && staffFile.headers.get('content-type') === 'image/jpeg', 'staff open the receipt photo', String(staffFile.status));
  check(/no-store/.test(staffFile.headers.get('cache-control') ?? '') && /private/.test(staffFile.headers.get('cache-control') ?? ''), 'a receipt photo is never cached by a CDN', staffFile.headers.get('cache-control'));
  check(/script-src 'none'/.test(staffFile.headers.get('content-security-policy') ?? ''), 'a receipt photo cannot run scripts');
  const withReceipts = await (await fetch(`${base}/api/orders/${orderRow.id}`, { headers: auth })).json();
  check(withReceipts.receipts?.docs?.length === 1, "the order's page lists its receipt", JSON.stringify(withReceipts.receipts));
  const rUrl = `${base}/api/receipts/${receiptRow.id}`;
  const judged = await fetch(rUrl, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'verified', staffNotes: 'وصل المبلغ', reference: 'HC-FORGED', amount: 1, transferRef: 'x' }) });
  const judgedRow = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receiptRow.id);
  check(judged.status === 200 && judgedRow.status === 'verified' && judgedRow.reference === pledgeRef && judgedRow.amount === 50 && judgedRow.transfer_ref === 'TX-778899', 'staff set the status; the sent details stay as sent', String(judged.status));
  const swap = new FormData();
  swap.set('file', new Blob([gpsPhoto], { type: 'image/jpeg' }), 'other.jpg');
  swap.set('_payload', JSON.stringify({ status: 'rejected' }));
  const swapped = await fetch(rUrl, { method: 'PATCH', headers: { authorization: `JWT ${token}` }, body: swap });
  check(swapped.status >= 400 && db.prepare('SELECT filename FROM receipts WHERE id = ?').get(receiptRow.id).filename === receiptRow.filename, 'nobody can swap the photo afterwards', String(swapped.status));
  const before = readFileSync(join(receiptsDir, receiptRow.filename));
  const crop = await fetch(`${rUrl}?uploadEdits[crop][x]=0&uploadEdits[crop][y]=0&uploadEdits[crop][width]=1&uploadEdits[crop][height]=1&uploadEdits[widthInPixels]=1&uploadEdits[heightInPixels]=1`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'verified' }) });
  check(crop.status === 400 && readFileSync(join(receiptsDir, receiptRow.filename)).equals(before), 'nor crop or shrink it with the image editor', String(crop.status));
  // the admin's save button sends the whole document back
  const whole = await (await fetch(url, { headers: auth })).json();
  const save = await fetch(url, { method: 'PATCH', headers: auth, body: JSON.stringify({ ...whole, status: 'delivered' }) });
  check(save.status === 200 && db.prepare('SELECT status FROM orders WHERE id = ?').get(orderRow.id).status === 'delivered', 'saving the whole form from the admin works', String(save.status));
}

// ── deleting an account
const current = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD ? 'temporary-password-3' : 'second-password-2';
check((await post('/api/hc/member/delete', { current: 'wrong-password-1' }, { cookie: session })).status === 403, 'deleting an account needs the password');
const removed = await post('/api/hc/member/delete', { current }, { cookie: session });
check(removed.status === 200 && /max-age=0/i.test(removed.cookie ?? ''), 'the account can be deleted and the cookie is cleared', String(removed.status));
check(!db.prepare('SELECT id FROM members WHERE id = ?').get(row.id), 'the account row is gone');
const kept = db.prepare('SELECT member_id FROM orders WHERE id = ?').get(orderRow.id);
check(kept && kept.member_id === null, 'its orders stay for staff, no longer linked');
check((await (await get('/api/hc/member/me', session)).json()).member === null, 'the old session reads nothing');

// ── SQLite reuses the highest id: a token kept from a deleted account must not open the next person's
const victimEmail = `next-${stamp}@example.com`;
const next = await post('/api/hc/member/register', { name: 'العضو التالي', email: victimEmail, password, consent: true }, { headers: { 'x-forwarded-for': `${visitor.slice(0, -1)}9` } });
const nextRow = db.prepare('SELECT id FROM members WHERE email = ?').get(victimEmail);
check(next.status === 200 && nextRow?.id === row.id, 'the next sign-up received the deleted account id (the case under test)', `${next.status} ${nextRow?.id} ${row.id}`);
check((await (await get('/api/hc/member/me', session)).json()).member === null, "the deleted account's token does not open the new account");
check((await (await get('/api/hc/member/me', pair(next.cookie))).json()).member?.email === victimEmail, 'the new account works with its own token');
const big = await fetch(`${base}/api/hc/member/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `${visitor.slice(0, -1)}8` }, body: JSON.stringify({ email: '<a'.repeat(400_000), password: 'x' }) });
check(big.status === 400, 'an oversized body is refused before any work', String(big.status));

db.close();
console.log(failed ? `platform check: ${failed} failed` : 'platform check: all passed');
process.exit(failed ? 1 : 0);
