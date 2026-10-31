import { normalizeScholarlyArabic, auditScholarlyArabic } from '../../../../lib/arabic-assist.ts';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid text parameter' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const normalized = normalizeScholarlyArabic(body.text);
    const suggestions = auditScholarlyArabic(body.text);

    return new Response(JSON.stringify({ normalized, suggestions }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
