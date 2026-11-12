import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { allow } from '../../../../lib/ratelimit.ts';
import { waitingCounts } from '../../../../lib/waiting.ts';

export const dynamic = 'force-dynamic';

// counts of one person's work queues: never stored by a browser, proxy or CDN
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'cache-control': 'private, no-store' } });

/**
 * The admin's notification bell and sidebar inbox poll this about once a minute per open tab. Staff only (Payload session):
 * a visitor gets 401 and learns nothing, not even which queues exist. Counts use the person's own access rights.
 */
export async function GET(req: Request) {
  if (!req.headers.get('cookie')?.includes('payload-token') && !req.headers.get('authorization')) return json({ error: 'unauthorized' }, 401);
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  const role = (user as { role?: unknown } | null)?.role;
  if (!user || typeof role !== 'string' || !['admin', 'editor', 'reviewer'].includes(role)) return json({ error: 'unauthorized' }, 401);
  // a minute's polling from several tabs is far below this; a script hammering the counts is not
  if (!allow(`waiting:${user.id}`, 600, 3600)) return json({ error: 'rate limited' }, 429);
  const items = await waitingCounts(payload, user as never);
  return json({ items, total: items.reduce((sum, i) => sum + (i.n ?? 0), 0) });
}
