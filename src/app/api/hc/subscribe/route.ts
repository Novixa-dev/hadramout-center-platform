import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';
import { sanitizeText } from '../../../../lib/sanitize.ts';

export const dynamic = 'force-dynamic';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let b: { email?: string; website?: string; lang?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (b.website) return NextResponse.json({ ok: true });
  if (!allow(`sub:${clientKey(req)}`, 5, 3600)) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  const email = sanitizeText(b.email ?? '').toLowerCase().slice(0, 200);
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const payload = await getPayloadClient();
  const existing = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.docs.length === 0) {
    await payload.create({ collection: 'subscribers', overrideAccess: true, data: { email, lang: sanitizeText(b.lang ?? 'ar').slice(0, 10), token: randomBytes(16).toString('hex') } });
  }
  return NextResponse.json({ ok: true });
}
