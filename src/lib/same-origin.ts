import { loadConfig } from '../config.ts';

/**
 * Cross-site request protection for routes that act on a session cookie, on top of its SameSite=Lax: the request must be JSON (a
 * cross-site form cannot send that without a preflight this site never answers) and, when the browser names an origin, it must be
 * this site. A request with no Origin comes from a non-browser client, which does not hold a visitor's cookie.
 */
export function isSameOrigin(req: Request): boolean {
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return false;
  return isOwnOrigin(req);
}

/** The Origin check alone, for an upload (multipart cannot be JSON). Browsers send Origin on every cross-site POST. */
export function isOwnOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const own = [req.headers.get('x-forwarded-host')?.split(',')[0]?.trim(), req.headers.get('host'), new URL(loadConfig().siteUrl).host];
  return own.includes(host);
}

/** The largest body a platform route reads: a full reading list is about 350 KB. nginx alone would allow 25 MB. */
export const MAX_BODY_BYTES = 512 * 1024;

/** The request's JSON object, or null when it is too large, malformed or not an object. */
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return null;
  try {
    const raw = await readCapped(req, MAX_BODY_BYTES);
    if (raw === null) return null;
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The body as text, read only up to `max` bytes: a chunked body or a false Content-Length cannot make the server buffer more. */
async function readCapped(req: Request, max: number): Promise<string | null> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
