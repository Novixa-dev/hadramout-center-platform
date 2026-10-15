import { join, resolve, sep } from 'node:path';

/** Images of the old website live on this host; we serve (and lazily cache) them from our own origin. */
export const LEGACY_FILES_ORIGIN = 'https://files.hadramout.center';
export const LEGACY_MEDIA_PREFIX = '/legacy-media/';

const URL_RE = /https?:\/\/files\.hadramout\.center\/media\//gi;
const SAFE_PATH = /^[\p{L}\p{N}\p{M}_@%+.\-/ ()]{1,300}$/u;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp|avif|svg|pdf)$/i;

/** Rewrite old-site media URLs inside HTML (or a single URL) to local `/legacy-media/...` paths. */
export function localizeLegacyMedia(value: string): string {
  return value.replace(URL_RE, LEGACY_MEDIA_PREFIX);
}

export function legacyCacheDir(): string {
  return resolve(process.env.DATA_DIR || './data', 'legacy-media');
}

/** Validate a request path (segments after /legacy-media/) and resolve it inside the cache dir; null if unsafe. */
export function resolveLegacyPath(segments: string[]): { rel: string; file: string } | null {
  const rel = segments.map((s) => decodeURIComponent(s)).join('/');
  if (!SAFE_PATH.test(rel) || rel.split('/').some((p) => p === '..' || p === '.' || p === '') || !ALLOWED_EXT.test(rel)) return null;
  const base = legacyCacheDir();
  const file = resolve(join(base, rel));
  if (!file.startsWith(base + sep)) return null;
  return { rel, file };
}

export function contentTypeFor(rel: string): string {
  const ext = rel.slice(rel.lastIndexOf('.') + 1).toLowerCase();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', pdf: 'application/pdf' } as Record<string, string>)[ext] ?? 'application/octet-stream';
}
