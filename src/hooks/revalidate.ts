import { revalidatePath } from 'next/cache';

/**
 * Drop Next.js' cached pages after content changed. Outside a Next request (import scripts,
 * tests, job runner started by the CLI) there is nothing to revalidate, so failures are ignored.
 */
export function revalidateSite(): void {
  // in-memory facet/topic caches (lib/facets.ts) — kept on globalThis so this hook never imports the data layer
  (globalThis as { __hcFacets?: Map<string, unknown> }).__hcFacets?.clear();
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* not running inside Next */
  }
}
