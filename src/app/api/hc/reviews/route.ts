import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';
import { sanitizeText } from '../../../../lib/sanitize.ts';
import { CONTENT } from '../../../../lib/content-types.ts';
import { REVIEW_TARGETS, type ReviewTarget } from '../../../../lib/reviews.ts';
import { getSite } from '../../../../lib/data.ts';

export const dynamic = 'force-dynamic';

/**
 * Reader reviews. Never trusts the client: honeypot, per-client and global rate limits, one review per item per day per
 * client, the item must exist and be published, text is stripped of markup, and everything is stored as "pending" —
 * an editor approves it in the admin before it becomes public.
 */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (typeof b.website === 'string' && b.website) return NextResponse.json({ ok: true }); // honeypot: pretend success

  const type = String(b.type ?? '') as ReviewTarget;
  const itemId = Number(b.id);
  const rating = Number(b.rating);
  const lang = String(b.lang ?? 'ar').slice(0, 12);
  if (!REVIEW_TARGETS.includes(type) || !Number.isInteger(itemId) || itemId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const who = clientKey(req);
  if (!allow(`review:${who}`, 5, 3600) || !allow('review:all', 150, 3600)) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  if (!allow(`review-item:${who}:${type}:${itemId}`, 1, 86400)) return NextResponse.json({ error: 'duplicate' }, { status: 409 });

  const name = sanitizeText(String(b.name ?? '')).slice(0, 80);
  const body = sanitizeText(String(b.body ?? '')).slice(0, 2000);
  if (body.length < 10) return NextResponse.json({ error: 'too short' }, { status: 400 });

  const site = await getSite('ar');
  if (site.reviewsEnabled === false) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  const payload = await getPayloadClient();
  const exists = await payload.find({ collection: CONTENT[type].slug, where: { and: [{ id: { equals: itemId } }, { status: { equals: 'published' } }] }, limit: 1, depth: 0, overrideAccess: true, select: { id: true } as never });
  if (!exists.docs.length) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: {
      targetType: type,
      targetId: itemId,
      rating,
      name: name || undefined,
      body,
      lang,
      status: 'pending',
      fingerprint: createHash('sha256').update(`${who}|${type}|${itemId}`).digest('hex').slice(0, 24),
    },
  });
  return NextResponse.json({ ok: true, status: 'pending' });
}
