import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { extras } from '../../../../lib/extras.ts';

export const dynamic = 'force-dynamic';

/** Liveness/readiness probe used by Docker and the deploy pipeline. */
export async function GET() {
  try {
    const payload = await getPayloadClient();
    await payload.count({ collection: 'users', overrideAccess: true });
    extras().get('SELECT 1');
    return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
  } catch (err) {
    console.error('[health]', err);
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
