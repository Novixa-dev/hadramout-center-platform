import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { extras } from '../../../../lib/extras.ts';

export const dynamic = 'force-dynamic';

/** Liveness/readiness probe used by Docker and the deploy pipeline. */
export async function GET() {
  try {
    const payload = await getPayloadClient();
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true });
    extras().get('SELECT 1');
    return NextResponse.json({ status: 'ok', users: totalDocs > 0, time: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: (err as Error).message }, { status: 503 });
  }
}
