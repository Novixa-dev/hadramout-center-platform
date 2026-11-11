import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, readSession, signSession, SESSION_DAYS, verifyPassword } from '../../src/lib/member-crypto.ts';
import sharp from 'sharp';
import { canOrder, cleanText, makeReference, normalizeEmail, parseOrder, parsePledge, parseReceipt, parseSavedItems, parseVolunteer, sniffImage } from '../../src/lib/platform-requests.ts';
import { normalizeReceipt, oneAtATime, RECEIPT_MAX_SIDE } from '../../src/lib/receipt-image.ts';
import { PAYABLE_REFERENCE } from '../../src/lib/platform-values.ts';
import { limitingAddress } from '../../src/lib/ratelimit.ts';
import { MAX_BODY_BYTES, readJsonObject } from '../../src/lib/same-origin.ts';
import { Members, Orders, Pledges, Receipts, Volunteers } from '../../src/collections/Platforms.ts';
import { NAV_TREE, UTILITY_LINKS, navPaths } from '../../src/lib/nav.ts';

const SECRET = 'a-test-secret-a-test-secret-a-test-secret';
const contact = { name: 'محمد سالم', email: 'Reader@Example.com', phone: '+967 777 000 111', consent: true };

describe('member passwords', () => {
  test('only the exact password matches, and the same password hashes differently each time', async () => {
    const a = await hashPassword('correct horse battery');
    assert.ok(await verifyPassword('correct horse battery', a));
    assert.equal(await verifyPassword('correct horse batterz', a), false);
    assert.notEqual(a, await hashPassword('correct horse battery'));
    assert.ok(!a.includes('correct'));
  });
  test('a missing or malformed stored value never matches and never throws', async () => {
    for (const bad of [null, undefined, '', 'scrypt', 'scrypt$1$8$1$AA$AA', 'plain$32768$8$1$AAAA$AAAA', 'scrypt$32768$8$1$$']) assert.equal(await verifyPassword('x', bad), false);
  });
});

describe('member sessions', () => {
  test('a signed token reads back; expiry is enforced', () => {
    const t0 = Date.parse('2026-11-09T00:00:00Z');
    const token = signSession(7, 2, SECRET, t0);
    assert.deepEqual({ m: readSession(token, SECRET, t0)?.m, v: readSession(token, SECRET, t0)?.v }, { m: 7, v: 2 });
    assert.equal(readSession(token, SECRET, t0 + (SESSION_DAYS + 1) * 86_400_000), null);
  });
  test('a tampered token, another key or junk is refused', () => {
    const token = signSession(7, 0, SECRET);
    const [body, sig] = token.split('.') as [string, string];
    const forged = Buffer.from(JSON.stringify({ m: 1, v: 0, e: 9_999_999_999 })).toString('base64url');
    for (const bad of [`${forged}.${sig}`, `${body}.`, `${body}.${sig}.x`, body, '', 'a.b', null, undefined, 'x'.repeat(600)]) assert.equal(readSession(bad, SECRET), null, String(bad));
    assert.equal(readSession(token, 'another-secret-another-secret-another'), null);
  });
  test('the session key is not the Payload secret itself: a token signed with the raw secret fails', async () => {
    const { createHmac } = await import('node:crypto');
    const body = Buffer.from(JSON.stringify({ m: 1, v: 0, e: 9_999_999_999 })).toString('base64url');
    assert.equal(readSession(`${body}.${createHmac('sha256', SECRET).update(body).digest('base64url')}`, SECRET), null);
  });
});

describe('member accounts stay out of the staff system', () => {
  test('members are not a Payload auth collection: a reader can never become req.user', () => assert.equal(Members.auth, undefined));
  test('secrets are hidden from every API and from the admin', () => {
    for (const name of ['passwordHash', 'sessionVersion', 'savedItems']) {
      const f = Members.fields.find((x) => 'name' in x && x.name === name) as { hidden?: boolean; access?: { read?: () => boolean } };
      assert.equal(f.hidden, true, name);
      assert.equal(f.access?.read?.(), false, name);
    }
  });
  const asRole = (role?: string) => ({ req: { user: role ? { role } : null } }) as never;
  test('personal data: visitors and translation reviewers read nothing; nobody creates rows through the API', () => {
    for (const c of [Members, Orders, Pledges, Receipts, Volunteers]) {
      const access = c.access as Record<string, (a: never) => unknown>;
      for (const who of [undefined, 'reviewer']) assert.equal(Boolean(access.read!(asRole(who))), false, `${c.slug} read by ${who}`);
      assert.equal(access.read!(asRole('admin')), true, c.slug);
      for (const role of [undefined, 'reviewer', 'editor', 'admin']) assert.equal(access.create!(asRole(role)), false, `${c.slug} create by ${role}`);
    }
  });
  test('an editor handles requests but not member accounts', () => {
    assert.equal((Orders.access as Record<string, (a: never) => unknown>).read!(asRole('editor')), true);
    assert.equal((Members.access as Record<string, (a: never) => unknown>).read!(asRole('editor')), false);
  });
});

describe('requests', () => {
  test('an order needs contact, address and real lines; duplicates merge and the email is normalized', () => {
    const items = [{ book: 3, quantity: 2 }, { book: 3, quantity: 1 }, { book: 9, quantity: 1 }];
    const ok = parseOrder({ ...contact, address: 'المكلا، حضرموت', items });
    assert.ok(ok.ok);
    if (ok.ok) {
      assert.equal(ok.value.email, 'reader@example.com');
      assert.deepEqual(ok.value.items, [{ book: 3, quantity: 3 }, { book: 9, quantity: 1 }]);
    }
    const code = (b: Record<string, unknown>) => {
      const r = parseOrder(b);
      return r.ok ? 'ok' : r.error;
    };
    assert.equal(code({ ...contact, items, address: '' }), 'address');
    assert.equal(code({ ...contact, phone: '', address: 'المكلا', items }), 'phone');
    assert.equal(code({ ...contact, consent: 'on', address: 'المكلا', items }), 'consent');
    for (const bad of [[], 'x', [{ book: 1, quantity: 0 }], [{ book: 1, quantity: 21 }], [{ book: -1, quantity: 1 }], [{ book: '1', quantity: 1 }], [{ book: 1.5, quantity: 1 }], Array(31).fill({ book: 1, quantity: 1 })]) {
      assert.equal(code({ ...contact, address: 'المكلا', items: bad }), 'items', JSON.stringify(bad).slice(0, 40));
    }
  });
  test('tags in free text are stripped', () => {
    const r = parseOrder({ ...contact, name: '<img src=x onerror=alert(1)>محمد', address: '<script>x</script>المكلا حضرموت', items: [{ book: 1, quantity: 1 }] });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.name, 'محمد');
      assert.ok(!r.value.address.includes('<'));
    }
  });
  test('a pledge may leave the amount empty; a given amount needs a currency', () => {
    const none = parsePledge({ ...contact, amount: '' });
    assert.ok(none.ok && none.value.amount === null && none.value.currency === null);
    const some = parsePledge({ ...contact, amount: '150.5', currency: 'USD', anonymous: true });
    assert.ok(some.ok && some.value.amount === 150.5 && some.value.anonymous);
    for (const amount of ['-1', '0', 'abc', 'Infinity', 2e9]) assert.deepEqual(parsePledge({ ...contact, amount, currency: 'USD' }), { ok: false, error: 'amount' }, String(amount));
    assert.deepEqual(parsePledge({ ...contact, amount: 5, currency: 'EUR' }), { ok: false, error: 'currency' });
  });
  test('a volunteer picks at least one known area and says something', () => {
    const r = parseVolunteer({ ...contact, areas: ['media', 'hacking'], experience: 'أعمل في التصوير منذ سنوات' });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.value.areas, ['media']);
    assert.deepEqual(parseVolunteer({ ...contact, areas: ['hacking'], experience: 'نبذة كافية هنا' }), { ok: false, error: 'areas' });
    assert.deepEqual(parseVolunteer({ ...contact, areas: ['media'], experience: 'قصير' }), { ok: false, error: 'experience' });
  });
  test('what a book can be ordered as', () => {
    for (const s of ['on_request', 'available', null, undefined]) assert.equal(canOrder(s), true, String(s));
    for (const s of ['out_of_stock', 'hidden', 'nonsense']) assert.equal(canOrder(s), false, s);
  });
  test('references are unguessable and readable', () => {
    const refs = new Set(Array.from({ length: 200 }, () => makeReference('O', new Date('2026-01-01T00:00:00Z'))));
    assert.equal(refs.size, 200);
    for (const r of refs) assert.match(r, /^HC-O-2026-[A-HJKMNP-Z2-9]{6}$/);
  });
});

describe('a reading list coming back from a browser', () => {
  const item = (url: unknown) => ({ id: 'x', title: 'عنوان', type: 'article', url });
  test('only paths on this site survive', () => {
    assert.deepEqual(parseSavedItems([item('/ar/articles/5')]), [{ id: 'x', title: 'عنوان', type: 'article', url: '/ar/articles/5' }]);
    for (const bad of ['//evil.example', '/\\evil.example', 'javascript:alert(1)', 'https://evil.example', '', 5, '/a b']) assert.deepEqual(parseSavedItems([item(bad)]), [], String(bad));
  });
  test('size is bounded and duplicates dropped', () => {
    assert.equal(parseSavedItems('x'), null);
    assert.equal(parseSavedItems(Array(501).fill(item('/a'))), null);
    assert.equal(parseSavedItems([item('/a'), item('/b')])?.length, 1);
  });
});

describe('rate-limit identity', () => {
  test('an IPv6 host counts as its /64, however it writes the address', () => {
    const expected = '2001:db8:1:2::/64';
    for (const a of ['2001:db8:1:2:aaaa:bbbb:cccc:dddd', '2001:0db8:0001:0002::1', '2001:DB8:1:2::ffff']) assert.equal(limitingAddress(a), expected, a);
    assert.notEqual(limitingAddress('2001:db8:1:3::1'), expected);
    assert.equal(limitingAddress('2001:db8::1'), '2001:db8:0:0::/64');
    assert.equal(limitingAddress('::1'), '0:0:0:0::/64');
  });
  test('IPv4, mapped addresses and the local fallback stay as they are', () => {
    for (const a of ['203.0.113.7', '::ffff:203.0.113.7', 'local']) assert.equal(limitingAddress(a), a);
  });
});

describe('oversized input', () => {
  const post = (body: string, headers: Record<string, string> = {}) => new Request('http://x/', { method: 'POST', body, headers });
  test('a body over the cap, broken JSON or a non-object is refused', async () => {
    assert.deepEqual(await readJsonObject(post('{"a":1}')), { a: 1 });
    for (const bad of ['x', '[1]', 'null', '5', `{"a":"${'x'.repeat(MAX_BODY_BYTES)}"}`]) assert.equal(await readJsonObject(post(bad)), null, bad.slice(0, 10));
    assert.equal(await readJsonObject(post('{}', { 'content-length': String(MAX_BODY_BYTES + 1) })), null);
  });
  test('text is cut to size whatever arrives', () => {
    assert.equal(cleanText('ا'.repeat(10_000), 120).length, 120);
    assert.ok(normalizeEmail('<a'.repeat(1_000_000)).length <= 200);
    assert.equal(cleanText(5, 10), '');
  });
});

test('what a visitor sent cannot be rewritten through the API', () => {
  // rows only lay fields out side by side: their fields are the collection's own
  const flat = (fields: readonly unknown[]): { name?: string; access?: { update?: () => boolean } }[] =>
    fields.flatMap((f) => ((f as { type?: string }).type === 'row' ? flat((f as { fields: unknown[] }).fields) : [f as never]));
  for (const c of [Orders, Pledges, Volunteers, Receipts]) {
    const fields = flat(c.fields);
    const names = c === Receipts ? ['reference', 'kind', 'order', 'pledge', 'amount', 'currency', 'transferRef', 'note', 'member', 'ipHash', 'lang'] : ['reference', 'member', 'name', 'email', 'phone', 'ipHash', 'lang'];
    for (const n of names) {
      const f = fields.find((x) => x.name === n);
      assert.equal(f?.access?.update?.(), false, `${c.slug}.${n}`);
    }
    for (const n of ['status', 'staffNotes']) assert.equal(fields.find((x) => x.name === n)!.access, undefined, `${c.slug}.${n}`);
  }
});

test('the menu opens the platforms themselves, no longer «under construction» anchors', () => {
  const paths = navPaths(NAV_TREE);
  for (const p of ['/account', '/store', '/encyclopedia', '/culture', '/donate', '/volunteer']) assert.ok(paths.includes(p), p);
  assert.ok(!UTILITY_LINKS.some((u) => u.path.startsWith('/platforms')));
});

describe('payment receipts', () => {
  const ref = makeReference('D');
  test('a receipt belongs to an order or a pledge, never a volunteer application; the reference is tidied first', () => {
    assert.ok(PAYABLE_REFERENCE.test(makeReference('O')) && PAYABLE_REFERENCE.test(ref));
    assert.equal(PAYABLE_REFERENCE.test(makeReference('V')), false);
    const ok = parseReceipt({ reference: ` ${ref.toLowerCase()} `, email: 'Reader@Example.com', amount: '15000', currency: 'YER', transferRef: 'TX 77', note: '' });
    assert.ok(ok.ok);
    assert.deepEqual(ok.value, { reference: ref, kind: 'pledge', email: 'reader@example.com', amount: 15000, currency: 'YER', transferRef: 'TX 77', note: '' });
    assert.equal((parseReceipt({ reference: makeReference('O'), email: 'a@b.co' }) as { value: { kind: string } }).value.kind, 'order');
    for (const [b, err] of [
      [{ reference: makeReference('V'), email: 'a@b.co' }, 'reference'],
      [{ reference: 'HC-D-2026-IIIIII', email: 'a@b.co' }, 'reference'],
      [{ reference: ref, email: 'nope' }, 'email'],
      [{ reference: ref, email: 'a@b.co', amount: '-5', currency: 'YER' }, 'amount'],
      [{ reference: ref, email: 'a@b.co', amount: '5' }, 'currency'],
    ] as const) assert.deepEqual(parseReceipt(b as never), { ok: false, error: err });
  });
  test('the file type comes from its bytes, not its name; iPhone HEIC is named so the visitor can be told', () => {
    const b = (...x: number[]) => Uint8Array.from([...x, ...new Array(16).fill(0)]);
    assert.equal(sniffImage(b(0xff, 0xd8, 0xff, 0xe0)), 'jpeg');
    assert.equal(sniffImage(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'png');
    assert.equal(sniffImage(Uint8Array.from([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBPVP8 ')])), 'webp');
    assert.equal(sniffImage(Uint8Array.from([0, 0, 0, 24, ...Buffer.from('ftypheic'), 0, 0, 0, 0])), 'heic');
    assert.equal(sniffImage(Uint8Array.from([...Buffer.from('<svg onload=alert(1)>')])), null);
    assert.equal(sniffImage(Uint8Array.from([...Buffer.from('%PDF-1.7 ')])), null);
  });
  test('receipt work runs one at a time, even when one job fails', async () => {
    const order: string[] = [];
    const slow = oneAtATime(async () => { await new Promise((r) => setTimeout(r, 20)); order.push('a'); throw new Error('x'); });
    const fast = oneAtATime(async () => { order.push('b'); return 2; });
    await assert.rejects(slow);
    assert.equal(await fast, 2);
    assert.deepEqual(order, ['a', 'b']);
  });
  test('a stored receipt is a plain upright JPEG: GPS and device data and anything appended to the file are gone', async () => {
    const photo = await sharp({ create: { width: 3200, height: 1800, channels: 3, background: '#d8c9a3' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'PhoneMaker', Model: 'X1', Artist: 'Owner Name' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '14/1 32/1 0/1' } })
      .toBuffer();
    assert.ok((await sharp(photo).metadata()).exif, 'the test photo carries EXIF');
    const out = await normalizeReceipt(Buffer.concat([photo, Buffer.from('<script>alert(1)</script>')]));
    assert.ok(Buffer.isBuffer(out));
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.exif, undefined);
    assert.equal(Math.max(meta.width!, meta.height!), RECEIPT_MAX_SIDE);
    assert.ok(!out.includes('PhoneMaker') && !out.includes('<script>'));
    const png = await sharp({ create: { width: 40, height: 30, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    assert.equal((await sharp((await normalizeReceipt(png)) as Buffer).metadata()).width, 40, 'small pictures are not enlarged');
    assert.equal(await normalizeReceipt(Buffer.from('not an image at all')), null);
    // a few hundred bytes that claim 10000 × 10000 pixels: refused from the header, before anything is unpacked
    const bomb = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#fff' } }).png().toBuffer();
    bomb.writeUInt32BE(10_000, 16);
    bomb.writeUInt32BE(10_000, 20);
    assert.equal(await normalizeReceipt(bomb), 'large');
  });
  test('staff can never swap, crop or shrink the photo a visitor sent', () => {
    const hook = Receipts.hooks!.beforeOperation![0] as (a: never) => unknown;
    assert.throws(() => hook({ operation: 'update', req: { file: { name: 'other.jpg' } } } as never));
    assert.throws(() => hook({ operation: 'update', req: { query: { uploadEdits: { crop: { x: 0, y: 0 } } } } } as never), 'the image editor rewrites the file in place');
    assert.doesNotThrow(() => hook({ operation: 'update', req: { query: {} } } as never));
    assert.doesNotThrow(() => hook({ operation: 'create', req: {} } as never));
    assert.equal((Receipts.upload as { crop?: boolean }).crop, false);
    assert.ok(!(Receipts.upload as { mimeTypes: string[] }).mimeTypes.some((m) => m !== 'image/jpeg'));
  });
});
