import type { Payload } from 'payload';
import { clearIndex } from '../db/search.ts';
import { extras } from './extras.ts';
import { reindexDoc } from '../hooks/content.ts';
import { COLLECTION_SLUGS } from './content-types.ts';

/** Rebuild the whole full-text index from the published content. */
export async function reindexAll(payload: Payload): Promise<number> {
  clearIndex(extras());
  let n = 0;
  for (const slug of COLLECTION_SLUGS) {
    let page = 1;
    for (;;) {
      const res = await payload.find({ collection: slug, where: { status: { equals: 'published' } }, limit: 100, page, depth: 0, locale: 'ar', overrideAccess: true, select: { id: true } as never });
      for (const d of res.docs) {
        await reindexDoc(payload, slug, (d as unknown as { id: number }).id);
        n++;
      }
      if (!res.hasNextPage) break;
      page++;
    }
  }
  return n;
}
