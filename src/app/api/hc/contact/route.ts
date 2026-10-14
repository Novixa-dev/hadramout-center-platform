import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';
import { sanitizeText } from '../../../../lib/sanitize.ts';

export const dynamic = 'force-dynamic';

const KINDS = ['contact', 'book_request', 'translation_issue'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let b: Record<string, string>;
  try {
    b = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (b.website) return NextResponse.json({ ok: true }); // honeypot: pretend success
  if (!allow(`contact:${clientKey(req)}`, 5, 3600) || !allow('contact:all', 200, 3600)) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  const name = sanitizeText(b.name ?? '').slice(0, 120);
  const email = sanitizeText(b.email ?? '').slice(0, 200);
  const body = sanitizeText(b.body ?? '').slice(0, 5000);
  if (!name || !EMAIL.test(email) || body.length < 5) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const kind = (KINDS as readonly string[]).includes(b.kind ?? '') ? b.kind : 'contact';
  const payload = await getPayloadClient();
  await payload.create({
    collection: 'messages',
    overrideAccess: true,
    data: {
      kind: kind as never,
      name,
      email,
      phone: sanitizeText(b.phone ?? '').slice(0, 40),
      subject: sanitizeText(b.subject ?? '').slice(0, 200),
      body,
      pageUrl: sanitizeText(b.pageUrl ?? '').slice(0, 300),
      lang: sanitizeText(b.lang ?? '').slice(0, 10),
      ipHash: createHash('sha256').update(clientKey(req)).digest('hex').slice(0, 16),
    },
  });
  return NextResponse.json({ ok: true });
}
