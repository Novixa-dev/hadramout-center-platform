import { renderOgCached, renderOgCard, type OgInput } from './og.ts';

/** At most two cards are rendered at a time so a burst of crawler requests cannot starve page rendering. */
let running = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export const OG_HEADERS = {
  'content-type': 'image/png',
  // regenerated when the content changes (the URL carries ?v=updatedAt); shared caches may keep it a long time
  'cache-control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
  'x-content-type-options': 'nosniff',
} as const;

export function renderCard(key: string, input: OgInput): Promise<Buffer> {
  return renderOgCached(key, () => slot(() => renderOgCard(input)));
}

/** Any failure falls back to the static brand image so a broken card never breaks a share preview. */
export const fallbackResponse = (req: Request) => Response.redirect(new URL('/brand/og-default.png', req.url), 302);
