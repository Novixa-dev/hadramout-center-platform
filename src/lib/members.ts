import { cookies } from 'next/headers';
import { getPayloadClient } from './runtime.ts';
import { readSession, SESSION_DAYS, signSession } from './member-crypto.ts';
import type { SavedItem } from './platform-requests.ts';

/** Server-side view of a reader's account. Every read goes through here, so the session check has one implementation. */

export const SESSION_COOKIE = 'hc_member';

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface MemberRow {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  sessionVersion?: number | null;
  passwordHash?: string | null;
  savedItems?: unknown;
}

const secret = (): string => process.env.PAYLOAD_SECRET ?? '';

const load = async (id: number): Promise<MemberRow | null> => {
  const payload = await getPayloadClient();
  try {
    return (await payload.findByID({ collection: 'members', id, depth: 0, overrideAccess: true, showHiddenFields: true })) as unknown as MemberRow;
  } catch {
    return null;
  }
};

export async function findMemberRowByEmail(email: string): Promise<MemberRow | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'members', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true });
  return (res.docs[0] as unknown as MemberRow | undefined) ?? null;
}

const toMember = (r: MemberRow): Member => ({ id: r.id, name: r.name ?? '', email: r.email ?? '', phone: r.phone ?? '' });

/** The active account behind a session token: authentic, unexpired, not suspended, not superseded by a password change. */
export async function memberRowFromToken(token: string | null | undefined): Promise<MemberRow | null> {
  const claims = readSession(token, secret());
  if (!claims) return null;
  const row = await load(claims.m);
  if (!row || row.status !== 'active' || (row.sessionVersion ?? 0) !== claims.v) return null;
  return row;
}

export async function memberFromToken(token: string | null | undefined): Promise<Member | null> {
  const row = await memberRowFromToken(token);
  return row ? toMember(row) : null;
}

/** For server components. Only a page marked force-dynamic may call it (it reads the request's cookies). */
export async function currentMember(): Promise<Member | null> {
  return memberFromToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export const savedItemsOf = (row: MemberRow): SavedItem[] => (Array.isArray(row.savedItems) ? (row.savedItems as SavedItem[]) : []);

export const sessionToken = (memberId: number, version: number): string => signSession(memberId, version, secret());

export const sessionCookie = (value: string) => ({
  name: SESSION_COOKIE,
  value,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: value ? SESSION_DAYS * 86_400 : 0,
});

export interface MemberRequests {
  orders: { id: number; reference: string; status: string; createdAt: string; items: { title?: string | null; quantity?: number | null }[] }[];
  pledges: { id: number; reference: string; status: string; createdAt: string; amount?: number | null; currency?: string | null }[];
  volunteers: { id: number; reference: string; status: string; createdAt: string }[];
  /** The newest receipt's status for each order or pledge reference that has one. */
  receipts: Record<string, string>;
}

/** What this member has sent the Center. Staff notes are never selected, so they cannot reach the reader's page. */
export async function requestsOf(memberId: number): Promise<MemberRequests> {
  const payload = await getPayloadClient();
  const mine = { member: { equals: memberId } };
  const common = { where: mine, limit: 50, depth: 0, sort: '-createdAt', overrideAccess: true } as const;
  const [orders, pledges, volunteers] = await Promise.all([
    payload.find({ collection: 'orders', ...common, select: { reference: true, status: true, createdAt: true, items: true } }),
    payload.find({ collection: 'pledges', ...common, select: { reference: true, status: true, createdAt: true, amount: true, currency: true } }),
    payload.find({ collection: 'volunteers', ...common, select: { reference: true, status: true, createdAt: true } }),
  ]);
  // by reference, not by account: a receipt sent while signed out still belongs to the member's own request
  const refs = [...orders.docs, ...pledges.docs].map((d) => (d as { reference: string }).reference);
  const receipts: Record<string, string> = {};
  if (refs.length) {
    const found = await payload.find({ collection: 'receipts', where: { reference: { in: refs } }, limit: 200, depth: 0, sort: '-createdAt', overrideAccess: true, select: { reference: true, status: true } });
    // newest first, so the latest receipt's status wins and a cut at 200 drops only the oldest
    for (const r of found.docs as unknown as { reference: string; status: string }[]) receipts[r.reference] ??= r.status;
  }
  return { orders: orders.docs as never, pledges: pledges.docs as never, volunteers: volunteers.docs as never, receipts };
}
