import { createHash, randomInt } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '../../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../../lib/ratelimit.ts';
import { isSameOrigin, readJsonObject } from '../../../../../lib/same-origin.ts';
import { hashPassword, PASSWORD_MAX, PASSWORD_MIN, spendPasswordWork, verifyPassword } from '../../../../../lib/member-crypto.ts';
import { cleanText, isEmail, normalizeEmail, parseSavedItems } from '../../../../../lib/platform-requests.ts';
import { findMemberRowByEmail, memberRowFromToken, savedItemsOf, SESSION_COOKIE, sessionCookie, sessionToken } from '../../../../../lib/members.ts';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ action: string }> };
type Body = Record<string, unknown>;

const NO_STORE = { 'cache-control': 'no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });
const fail = (error: string, status = 400) => json({ error }, status);
const validPassword = (v: unknown): v is string => typeof v === 'string' && v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX;
const signedIn = (res: NextResponse, id: number, version: number) => {
  res.cookies.set(sessionCookie(sessionToken(id, version)));
  return res;
};
const signedOut = (res: NextResponse) => {
  res.cookies.set(sessionCookie(''));
  return res;
};
const version = (row: { sessionVersion?: number | null }) => row.sessionVersion ?? 0;

/** Reads never expose anything but the member's own contact details and reading list. Visitors get `null`, not an error. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { action } = await params;
  if (action !== 'me' && action !== 'saved') return fail('not found', 404);
  const row = await memberRowFromToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (action === 'saved') return row ? json({ items: savedItemsOf(row) }) : fail('unauthorized', 401);
  return json({ member: row ? { name: row.name ?? '', email: row.email ?? '', phone: row.phone ?? '' } : null });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { action } = await params;
  if (!isSameOrigin(req)) return fail('forbidden', 403);
  const b = await readJsonObject(req);
  if (!b) return fail('bad json');
  const ip = clientKey(req);

  if (action === 'register') return register(b, ip);
  if (action === 'login') return login(b, ip);
  if (action === 'logout') return signedOut(json({ ok: true }));

  // everything below acts on the signed-in account
  const row = await memberRowFromToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!row) return signedOut(fail('unauthorized', 401));
  if (!allow(`member:${row.id}`, 60, 3600)) return fail('rate limited', 429);
  const payload = await getPayloadClient();
  const update = (data: Record<string, unknown>) => payload.update({ collection: 'members', id: row.id, data: data as never, overrideAccess: true });

  if (action === 'profile') {
    const name = cleanText(b.name, 120);
    const phone = cleanText(b.phone, 40);
    if (name.length < 2) return fail('name');
    await update({ name, phone });
    return json({ ok: true });
  }
  if (action === 'saved') {
    const items = parseSavedItems(b.items);
    if (!items) return fail('items');
    await update({ savedItems: items });
    return json({ ok: true, count: items.length });
  }
  if (action === 'password' || action === 'delete') {
    // a stolen session alone can neither lock the owner out nor erase the account
    if (!allow(`member-pw:${row.id}`, 8, 900)) return fail('rate limited', 429);
    if (typeof b.current !== 'string' || b.current.length > PASSWORD_MAX || !(await verifyPassword(b.current, row.passwordHash))) return fail('password', 403);
    if (action === 'delete') {
      await payload.delete({ collection: 'members', id: row.id, overrideAccess: true });
      return signedOut(json({ ok: true }));
    }
    if (!validPassword(b.next)) return fail('weak');
    const nextVersion = version(row) + 1;
    await update({ passwordHash: await hashPassword(b.next), sessionVersion: nextVersion });
    return signedIn(json({ ok: true }), row.id, nextVersion);
  }
  return fail('not found', 404);
}

async function register(b: Body, ip: string) {
  if (typeof b.website === 'string' && b.website) return json({ ok: true }); // honeypot: pretend success
  if (!allow(`member-register:${ip}`, 5, 3600) || !allow('member-register:all', 100, 3600)) return fail('rate limited', 429);
  const name = cleanText(b.name, 120);
  const email = normalizeEmail(b.email);
  if (name.length < 2) return fail('name');
  if (!isEmail(email)) return fail('email');
  if (!validPassword(b.password)) return fail('weak');
  if (b.consent !== true) return fail('consent');
  const payload = await getPayloadClient();
  if (await findMemberRowByEmail(email)) return fail('exists', 409);
  // SQLite hands a deleted account's id to the next sign-up. A random first version means a token kept from the old account never fits the new one.
  const sessionVersion = randomInt(1, 2 ** 31);
  try {
    const doc = await payload.create({
      collection: 'members',
      overrideAccess: true,
      data: { name, email, status: 'active', sessionVersion, passwordHash: await hashPassword(b.password), lastLoginAt: new Date().toISOString() } as never,
    });
    return signedIn(json({ ok: true }), doc.id as number, sessionVersion);
  } catch {
    // two simultaneous sign-ups with one address: the unique index answers for the second
    if (await findMemberRowByEmail(email)) return fail('exists', 409);
    throw new Error('member registration failed');
  }
}

async function login(b: Body, ip: string) {
  if (!allow(`member-login:${ip}`, 10, 900)) return fail('rate limited', 429);
  const email = normalizeEmail(b.email);
  const password = typeof b.password === 'string' ? b.password.slice(0, PASSWORD_MAX) : '';
  const account = createHash('sha256').update(email).digest('hex').slice(0, 24);
  // Guessing one account from many machines is slowed by the account-wide bucket. It is kept wide, and the tight one is per address and
  // machine, so someone who knows a reader's email cannot lock them out with a few bad attempts.
  if (!allow(`member-login-account:${account}:${ip}`, 8, 900) || !allow(`member-login-account:${account}`, 50, 900)) return fail('rate limited', 429);
  const row = email && password ? await findMemberRowByEmail(email) : null;
  if (!row) {
    await spendPasswordWork(password);
    return fail('invalid', 401);
  }
  // the same answer for a wrong password and a suspended account: only the owner, told by the Center, needs to know the difference
  if (!(await verifyPassword(password, row.passwordHash)) || row.status !== 'active') return fail('invalid', 401);
  const payload = await getPayloadClient();
  await payload.update({ collection: 'members', id: row.id, data: { lastLoginAt: new Date().toISOString() } as never, overrideAccess: true });
  return signedIn(json({ ok: true }), row.id, version(row));
}
