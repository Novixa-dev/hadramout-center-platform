import type { TaskConfig } from 'payload';
import { appConfig } from '../lib/runtime-light.ts';
import { isLangEnabled } from '../config.ts';
import { createProvider } from '../i18n/translation/providers.ts';
import { TranslationEngine } from '../i18n/translation/engine.ts';
import { isTranslatableSlug, type TranslatableSlug } from '../i18n/translation/registry.ts';
import { reindexDoc } from '../hooks/content.ts';
import { revalidateSite } from '../hooks/revalidate.ts';
import type { CollectionSlug } from '../lib/content-types.ts';
import { writeUiBundle } from '../i18n/ui-store.ts';
import { loadSourceMessages, loadUiBundle } from '../i18n/ui-store.ts';

const provider = createProvider(appConfig() as never);

/** Related records a translated page also needs (author names, category, issue). */
async function relatedOf(doc: Record<string, unknown>): Promise<{ slug: TranslatableSlug; id: number }[]> {
  const out: { slug: TranslatableSlug; id: number }[] = [];
  const idOf = (v: unknown): number | null => (typeof v === 'number' ? v : v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'number' ? (v as { id: number }).id : null);
  if (Array.isArray(doc.authors)) for (const a of doc.authors) { const id = idOf(a); if (id) out.push({ slug: 'authors', id }); }
  const c = idOf(doc.category); if (c) out.push({ slug: 'categories', id: c });
  return out;
}

export const translateDocTask: TaskConfig<'translate-doc'> = {
  slug: 'translate-doc',
  retries: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  inputSchema: [
    { name: 'slug', type: 'text', required: true },
    { name: 'id', type: 'number' },
    { name: 'lang', type: 'text', required: true },
  ],
  handler: async ({ input, req }) => {
    const { slug, id, lang } = input as { slug: string; id?: number; lang: string };
    if (!isTranslatableSlug(slug)) throw new Error(`not translatable: ${slug}`);
    const cfg = appConfig();
    const engine = new TranslationEngine({ payload: req.payload, provider, isLanguageEnabled: (l) => isLangEnabled(cfg, l), dailyCharLimit: cfg.translation.dailyCharLimit });
    await engine.translateDoc(slug, id ?? null, lang);
    if (id && slug !== 'authors' && slug !== 'categories' && slug !== 'site' && slug !== 'media') {
      const doc = (await req.payload.findByID({ collection: slug as never, id, locale: 'ar', depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
      for (const rel of await relatedOf(doc)) await engine.translateDoc(rel.slug, rel.id, lang);
      await reindexDoc(req.payload, slug as CollectionSlug | 'pages', id);
    }
    revalidateSite();
    return { output: {} };
  },
};

export const translateUiTask: TaskConfig<'translate-ui'> = {
  slug: 'translate-ui',
  retries: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 } },
  inputSchema: [{ name: 'lang', type: 'text', required: true }],
  handler: async ({ input, req }) => {
    const { lang } = input as { lang: string };
    const cfg = appConfig();
    const engine = new TranslationEngine({ payload: req.payload, provider, isLanguageEnabled: (l) => isLangEnabled(cfg, l), dailyCharLimit: cfg.translation.dailyCharLimit });
    const existing = loadUiBundle(lang);
    const result = await engine.translateUi(lang, loadSourceMessages(), existing.strings, existing.hashes);
    writeUiBundle(lang, result);
    revalidateSite();
    return { output: {} };
  },
};

export const TASKS = [translateDocTask, translateUiTask];
