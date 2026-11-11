import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';
import { isOwnOrigin } from '../../../../lib/same-origin.ts';
import { memberFromToken, SESSION_COOKIE } from '../../../../lib/members.ts';
import { cleanText, parseReceipt, sniffImage } from '../../../../lib/platform-requests.ts';
import { MAX_RECEIPT_BYTES, MAX_RECEIPTS_PER_REQUEST } from '../../../../lib/platform-values.ts';
import { normalizeReceipt, oneAtATime } from '../../../../lib/receipt-image.ts';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });
const fail = (error: string, status = 400) => json({ error }, status);
/** The photo plus a few short fields and the multipart boundaries. */
const MAX_REQUEST_BYTES = MAX_RECEIPT_BYTES + 64 * 1024;

/**
 * A photo of the transfer receipt for an order or a pledge. The visitor proves the request is theirs with its reference and the
 * email it was sent with, so a signed-in account is not needed. Nothing is paid here: staff check the money arrived and then set the
 * request's status by hand.
 */
export async function POST(req: NextRequest) {
  if (!isOwnOrigin(req)) return fail('forbidden', 403);
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/form-data')) return fail('bad request');
  // browsers always send the length of a FormData body; refusing a chunked one keeps the parser from reading an unbounded stream
  const length = Number(req.headers.get('content-length') ?? NaN);
  if (!Number.isFinite(length) || length <= 0) return fail('bad request', 411);
  if (length > MAX_REQUEST_BYTES) return fail('size', 413);
  const ip = clientKey(req);
  if (!allow(`receipt:${ip}`, 10, 3600) || !allow('receipt:all', 200, 3600)) return fail('rate limited', 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('bad request');
  }
  const field = (name: string) => {
    const v = form.get(name);
    return typeof v === 'string' ? v : undefined;
  };
  if (field('website')) return json({ ok: true }); // honeypot: pretend success
  const parsed = parseReceipt({ reference: field('reference'), email: field('email'), amount: field('amount'), currency: field('currency'), transferRef: field('transferRef'), note: field('note') });
  if (!parsed.ok) return fail(parsed.error);
  const { reference, kind, email, ...details } = parsed.value;

  const payload = await getPayloadClient();
  const collection = kind === 'order' ? 'orders' : 'pledges';
  const found = await payload.find({ collection, where: { reference: { equals: reference } }, limit: 1, depth: 0, overrideAccess: true, select: { email: true, status: true } as never });
  const request = found.docs[0] as unknown as { id: number; email?: string; status?: string } | undefined;
  // one answer for an unknown reference and a wrong email: the pair is the only proof the request is the sender's
  if (!request || (request.email ?? '').toLowerCase() !== email) return fail('notfound', 404);
  if (request.status === 'cancelled') return fail('closed', 409);

  const file = form.get('receipt');
  if (!(file instanceof File) || file.size === 0) return fail('file');
  if (file.size > MAX_RECEIPT_BYTES) return fail('size', 413);
  const raw = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(raw.subarray(0, 16));
  if (type === 'heic') return fail('heic');
  if (!type) return fail('file');
  const member = await memberFromToken(req.cookies.get(SESSION_COOKIE)?.value);

  // count, decode and store in turn: parallel uploads can neither pass the per-request cap together nor decode at once
  return oneAtATime(async () => {
    const already = await payload.count({ collection: 'receipts', where: { reference: { equals: reference } }, overrideAccess: true });
    if (already.totalDocs >= MAX_RECEIPTS_PER_REQUEST) return fail('tooMany', 409);
    const jpeg = await normalizeReceipt(raw);
    if (jpeg === 'large') return fail('large', 413);
    if (!jpeg) return fail('file');
    await payload.create({
      collection: 'receipts',
      overrideAccess: true,
      data: {
        reference,
        kind,
        [kind]: request.id,
        ...details,
        member: member?.id ?? null,
        status: 'new',
        lang: cleanText(field('lang'), 10),
        ipHash: createHash('sha256').update(ip).digest('hex').slice(0, 16),
      } as never,
      // an unguessable name: the file is staff-only anyway, and its address says nothing about whose it is
      file: { data: jpeg, mimetype: 'image/jpeg', name: `receipt-${randomBytes(12).toString('hex')}.jpg`, size: jpeg.length },
    });
    return json({ ok: true });
  });
}
