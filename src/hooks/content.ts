import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, CollectionConfig, Payload } from 'payload';
import { extras } from '../lib/extras.ts';
import { indexDocument, removeFromIndex, toIndexText, type IndexText } from '../db/search.ts';
import { appConfig } from '../lib/runtime-light.ts';
import { TRANSLATABLE } from '../i18n/translation/registry.ts';
import { revalidateSite } from './revalidate.ts';
import type { CollectionSlug } from '../lib/content-types.ts';
import type { TranslationMeta } from '../i18n/translation/engine.ts';

type AnyDoc = Record<string, unknown> & { id: number; status?: string; translationMeta?: TranslationMeta | null; authors?: unknown };

const authorName = (a: unknown): string => (a && typeof a === 'object' && typeof (a as { name?: unknown }).name === 'string' ? ((a as { name: string }).name) : '');

/** Rebuild every search-index row (Arabic + each translated language) of one document. */
export async function reindexDoc(payload: Payload, slug: CollectionSlug | 'pages', id: number, req?: unknown): Promise<void> {
  const db = extras();
  const base = { collection: slug as never, id, depth: 1, overrideAccess: true, fallbackLocale: false as const, ...(req ? { req: req as never } : {}) };
  let ar: AnyDoc | null = null;
  try {
    ar = (await payload.findByID({ ...base, locale: 'ar' })) as unknown as AnyDoc;
  } catch {
    removeFromIndex(db, slug, id);
    return;
  }
  if (ar.status && ar.status !== 'published') {
    removeFromIndex(db, slug, id);
    return;
  }
  const byLang: Record<string, IndexText> = {
    ar: toIndexText({ title: ar.title, excerpt: ar.excerpt, body: ar.body, authors: Array.isArray(ar.authors) ? ar.authors.map(authorName) : [] }),
  };
  for (const lang of Object.keys(ar.translationMeta ?? {})) {
    try {
      const d = (await payload.findByID({ ...base, locale: lang as never })) as unknown as AnyDoc;
      if (d.title) byLang[lang] = toIndexText({ title: d.title, excerpt: d.excerpt, body: d.body, authors: Array.isArray(d.authors) ? d.authors.map(authorName) : [] });
    } catch {
      /* locale without data */
    }
  }
  indexDocument(db, slug, id, byLang);
}

/** Queue translation of one document for the eager languages plus every language it already has. */
export async function queueTranslations(payload: Payload, slug: string, id: number, doc: { translationMeta?: TranslationMeta | null }, req?: unknown): Promise<void> {
  const cfg = appConfig();
  if (cfg.translation.provider === 'none') return;
  const langs = new Set([...cfg.translation.eagerLangs, ...Object.keys(doc.translationMeta ?? {})]);
  for (const lang of langs) {
    if (lang === 'ar') continue;
    await payload.jobs.queue({ task: 'translate-doc', input: { slug, id, lang }, queue: 'translation', ...(req ? { req: req as never } : {}) });
  }
}

/** A human edit of a translated field turns it into "manual": machine translation will never overwrite it. */
const trackManualEdits: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation, collection }) => {
  if (operation !== 'update' || req.locale === 'ar' || req.context?.fromTranslation === true || !req.user) return data;
  const meta: TranslationMeta = { ...((originalDoc?.translationMeta as TranslationMeta | null) ?? {}) };
  const lang = String(req.locale);
  const langMeta = { ...(meta[lang] ?? {}) };
  let changed = false;
  for (const spec of TRANSLATABLE[collection.slug as keyof typeof TRANSLATABLE] ?? []) {
    if (spec.name in data && data[spec.name] !== originalDoc?.[spec.name]) {
      langMeta[spec.name] = { h: langMeta[spec.name]?.h ?? '', q: 'manual', at: new Date().toISOString() };
      changed = true;
    }
  }
  if (changed) data.translationMeta = { ...meta, [lang]: langMeta };
  return data;
};

export function contentHooks(slug: CollectionSlug): NonNullable<CollectionConfig['hooks']> {
  const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
    if (req.context?.skipHooks === true) return doc;
    try {
      await reindexDoc(req.payload, slug, doc.id, req);
      if (req.locale === 'ar' && doc.status === 'published' && req.context?.fromImport !== true) await queueTranslations(req.payload, slug, doc.id, doc, req);
    } catch (err) {
      req.payload.logger.error({ err, msg: `post-save hook failed for ${slug}/${doc.id}` });
    }
    revalidateSite();
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = ({ id, doc }) => {
    removeFromIndex(extras(), slug, Number(id));
    revalidateSite();
    return doc;
  };
  return { beforeChange: [trackManualEdits], afterChange: [afterChange], afterDelete: [afterDelete] };
}
