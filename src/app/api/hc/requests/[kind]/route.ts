import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '../../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../../lib/ratelimit.ts';
import { isSameOrigin, readJsonObject } from '../../../../../lib/same-origin.ts';
import { memberFromToken, SESSION_COOKIE } from '../../../../../lib/members.ts';
import { canOrder, cleanText, makeReference, parseOrder, parsePledge, parseVolunteer, type OrderRequest } from '../../../../../lib/platform-requests.ts';

export const dynamic = 'force-dynamic';

const KINDS = ['order', 'pledge', 'volunteer'] as const;
type Kind = (typeof KINDS)[number];

const NO_STORE = { 'cache-control': 'no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/** The books of an order as they are now: the browser's titles and availability are never trusted. */
async function orderLines(items: OrderRequest['items']) {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'books',
    where: { and: [{ id: { in: items.map((i) => i.book) } }, { status: { equals: 'published' } }] },
    limit: items.length,
    depth: 0,
    locale: 'ar',
    overrideAccess: true,
    select: { title: true, storeStatus: true } as never,
  });
  const books = new Map((res.docs as unknown as { id: number; title?: string; storeStatus?: string }[]).map((d) => [d.id, d]));
  const lines = [];
  for (const { book, quantity } of items) {
    const found = books.get(book);
    if (!found || !canOrder(found.storeStatus)) return null;
    lines.push({ book, title: found.title ?? '', quantity });
  }
  return lines;
}

/**
 * What visitors send to the platforms. Nothing here takes payment; each row waits in the admin for staff. A signed-in member's
 * request is linked to the account by the session, never by an id from the form.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind: rawKind } = await params;
  if (!(KINDS as readonly string[]).includes(rawKind)) return json({ error: 'not found' }, 404);
  const kind = rawKind as Kind;
  if (!isSameOrigin(req)) return json({ error: 'forbidden' }, 403);
  const b = await readJsonObject(req);
  if (!b) return json({ error: 'bad json' }, 400);
  if (typeof b.website === 'string' && b.website) return json({ ok: true, reference: null }); // honeypot: pretend success
  const ip = clientKey(req);
  if (!allow(`request-${kind}:${ip}`, 8, 3600) || !allow(`request-${kind}:all`, 300, 3600)) return json({ error: 'rate limited' }, 429);

  const payload = await getPayloadClient();
  const member = await memberFromToken(req.cookies.get(SESSION_COOKIE)?.value);
  const common = {
    member: member?.id ?? null,
    lang: cleanText(b.lang, 10),
    ipHash: createHash('sha256').update(ip).digest('hex').slice(0, 16),
    status: 'new',
  };

  if (kind === 'order') {
    const parsed = parseOrder(b);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const items = await orderLines(parsed.value.items);
    if (!items) return json({ error: 'unavailable' }, 409);
    const reference = makeReference('O');
    await payload.create({ collection: 'orders', overrideAccess: true, data: { ...parsed.value, ...common, reference, items } as never });
    return json({ ok: true, reference });
  }
  if (kind === 'pledge') {
    const parsed = parsePledge(b);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const reference = makeReference('D');
    await payload.create({ collection: 'pledges', overrideAccess: true, data: { ...parsed.value, ...common, reference } as never });
    return json({ ok: true, reference });
  }
  const parsed = parseVolunteer(b);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const reference = makeReference('V');
  await payload.create({ collection: 'volunteers', overrideAccess: true, data: { ...parsed.value, ...common, reference } as never });
  return json({ ok: true, reference });
}
