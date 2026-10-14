import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { LEGACY_FILES_ORIGIN, contentTypeFor, resolveLegacyPath } from '../../../lib/legacy-media.ts';

export const dynamic = 'force-dynamic';

const HEADERS = (rel: string) => ({
  'content-type': contentTypeFor(rel),
  'cache-control': 'public, max-age=31536000, immutable',
  'x-content-type-options': 'nosniff',
  // SVG from a third party must never run scripts
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
});

/**
 * Images of the migrated content. Served from the local cache (`$DATA_DIR/legacy-media`); a missing file is fetched
 * once from the old site and kept, so the platform keeps working after the old host goes away
 * (run `npm run import:images` to pre-fill the cache in bulk).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  let target: ReturnType<typeof resolveLegacyPath>;
  try {
    target = resolveLegacyPath(path);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  if (!target) return new Response('Not found', { status: 404 });

  if (existsSync(target.file)) return new Response(new Uint8Array(await readFile(target.file)), { headers: HEADERS(target.rel) });

  try {
    const res = await fetch(`${LEGACY_FILES_ORIGIN}/media/${target.rel.split('/').map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(20_000), redirect: 'error' });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^(image\/|application\/pdf)/.test(type)) return new Response('Not found', { status: 404 });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) return new Response('Too large', { status: 404 });
    await mkdir(dirname(target.file), { recursive: true });
    const tmp = `${target.file}.${process.pid}.tmp`;
    await writeFile(tmp, buf);
    await rename(tmp, target.file);
    return new Response(new Uint8Array(buf), { headers: HEADERS(target.rel) });
  } catch {
    return new Response('Upstream unavailable', { status: 502, headers: { 'cache-control': 'no-store' } });
  }
}
