import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { appConfig } from '../../../../lib/runtime-light.ts';
import { isLangEnabled } from '../../../../config.ts';
import { getLanguage } from '../../../../i18n/languages.ts';
import { isTranslatableSlug } from '../../../../i18n/translation/registry.ts';
import { uiCoverage } from '../../../../i18n/ui-store.ts';
import { allow, clientKey } from '../../../../lib/ratelimit.ts';

export const dynamic = 'force-dynamic';

const asked = new Map<string, number>();
const key = (slug: string, id: string, lang: string) => `${slug}:${id}:${lang}`;

interface Meta {
  translationMeta?: Record<string, Record<string, unknown>> | null;
  body?: string | null;
}

async function stateOf(slug: string, id: string, lang: string): Promise<'ready' | 'pending' | 'failed' | 'none'> {
  const payload = await getPayloadClient();
  let doc: Meta;
  try {
    doc = (await payload.findByID({ collection: slug as never, id: Number(id), depth: 0, locale: 'ar', overrideAccess: true })) as unknown as Meta;
  } catch {
    return 'none';
  }
  const m = doc.translationMeta?.[lang] ?? {};
  if (m.title && (!doc.body || m.body)) return uiCoverage(lang) >= 0.95 || lang === 'en' ? 'ready' : 'pending';
  const at = asked.get(key(slug, id, lang));
  if (!at) return 'none';
  return Date.now() - at > 15 * 60_000 ? 'failed' : 'pending';
}

/** GET: translation status of one document. POST: ask for it (called by the browser, never by crawlers). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = u.searchParams.get('slug') ?? '';
  const id = u.searchParams.get('id') ?? '';
  const lang = u.searchParams.get('lang') ?? '';
  if (!isTranslatableSlug(slug) || !getLanguage(lang)) return NextResponse.json({ state: 'none' }, { status: 400 });
  return NextResponse.json({ state: await stateOf(slug, id, lang) }, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: Request) {
  const cfg = appConfig();
  if (cfg.translation.provider === 'none') return NextResponse.json({ state: 'none', reason: 'no-provider' }, { status: 503 });
  let body: { slug?: string; id?: number | string | null; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const slug = body.slug ?? '';
  const lang = body.lang ?? '';
  const id = String(body.id ?? '');
  if (!isTranslatableSlug(slug) || !getLanguage(lang) || lang === 'ar' || !/^\d+$/.test(id) || !isLangEnabled(cfg, lang)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  // per visitor: 40 requests / 10 min; whole site: 600 / hour — protects the translation budget
  if (!allow(`tr:${clientKey(req)}`, 40, 600) || !allow('tr:all', 600, 3600)) return NextResponse.json({ error: 'rate limited' }, { status: 429 });

  const k = key(slug, id, lang);
  const current = await stateOf(slug, id, lang);
  if (current === 'ready') return NextResponse.json({ state: 'ready' });
  const last = asked.get(k);
  if (!last || Date.now() - last > 5 * 60_000) {
    asked.set(k, Date.now());
    const payload = await getPayloadClient();
    await payload.jobs.queue({ task: 'translate-doc', input: { slug, id: Number(id), lang }, queue: 'translation' });
    if (uiCoverage(lang) < 0.95 && lang !== 'en' && !asked.has(`ui:${lang}`)) {
      asked.set(`ui:${lang}`, Date.now());
      await payload.jobs.queue({ task: 'translate-ui', input: { lang }, queue: 'translation' });
    }
  }
  return NextResponse.json({ state: 'pending' }, { status: 202 });
}
