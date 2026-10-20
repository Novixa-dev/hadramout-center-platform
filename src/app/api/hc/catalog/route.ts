import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { absolute } from '../../../../lib/ctx.ts';
import { toCatalogRows, toCsv } from '../../../../lib/catalog.ts';

export const dynamic = 'force-dynamic';

const TYPES = {
  books: { collection: 'books', route: 'books' },
  magazines: { collection: 'magazines', route: 'magazines' },
} as const;

/** Open catalogue of publications: /api/hc/catalog?type=books|magazines&format=csv|json (published items only). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const type = (u.searchParams.get('type') ?? 'books') as keyof typeof TYPES;
  const format = u.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const info = TYPES[type];
  if (!info) return NextResponse.json({ error: 'type must be books or magazines' }, { status: 400 });

  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: info.collection,
    where: { status: { equals: 'published' } },
    sort: type === 'magazines' ? '-issueNumber' : '-year',
    limit: 1000,
    pagination: false,
    depth: 1,
    locale: 'ar',
    overrideAccess: false,
  });
  const rows = toCatalogRows(res.docs as never, (id) => absolute(`/ar/${info.route}/${id}`), absolute);

  const headers = { 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' };
  if (format === 'json') return NextResponse.json({ type, count: rows.length, items: rows }, { headers });
  return new Response(toCsv(rows), {
    headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="hadramout-${type}.csv"` },
  });
}
