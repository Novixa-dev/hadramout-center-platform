import { createHmac, hkdfSync, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { PASSWORD_MIN } from './platform-values.ts';

/**
 * Passwords and session tokens of reader accounts (`members`). Deliberately separate from Payload's staff authentication:
 * collection access treats any `req.user` as staff (collections/shared.ts), so a reader must never become a `req.user`.
 * Tokens are signed with a key derived for this purpose only, and are useless against Payload's own session checks.
 */

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 32;
const MAX_MEM = 128 * N * R * 2;

export { PASSWORD_MIN };
export const PASSWORD_MAX = 200;
export const SESSION_DAYS = 30;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, len: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, len, { N: n, r, p, maxmem: MAX_MEM }, (err, key) => (err ? reject(err) : resolve(key)));
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEY_LEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

/** True only for the exact password. A malformed or empty stored value never matches and never throws. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const parts = (stored ?? '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [n, r, p] = parts.slice(1, 4).map(Number) as [number, number, number];
  if (n !== N || r !== R || p !== P) return false;
  const salt = Buffer.from(parts[4] as string, 'base64url');
  const expected = Buffer.from(parts[5] as string, 'base64url');
  if (!salt.length || expected.length !== KEY_LEN) return false;
  const actual = await derive(password, salt, n, r, p, KEY_LEN);
  return timingSafeEqual(actual, expected);
}

/** Work done when no account matches, so a wrong address takes as long as a wrong password. */
let decoy: Promise<string> | null = null;
export async function spendPasswordWork(password: string): Promise<void> {
  decoy ??= hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, await decoy);
}

const signingKey = (secret: string): Buffer => {
  if (!secret) throw new Error('PAYLOAD_SECRET is required for member sessions');
  return Buffer.from(hkdfSync('sha256', secret, 'hc-member-session', 'v1', 32));
};

const mac = (body: string, secret: string): Buffer => createHmac('sha256', signingKey(secret)).update(body).digest();

export interface SessionClaims {
  /** member id */
  m: number;
  /** the member's session version: changing the password invalidates every older token */
  v: number;
  /** expiry, seconds since the epoch */
  e: number;
}

export function signSession(memberId: number, version: number, secret: string, now = Date.now()): string {
  const claims: SessionClaims = { m: memberId, v: version, e: Math.floor(now / 1000) + SESSION_DAYS * 86_400 };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${body}.${mac(body, secret).toString('base64url')}`;
}

/** The claims of an authentic, unexpired token; null for anything else. */
export function readSession(token: string | null | undefined, secret: string, now = Date.now()): SessionClaims | null {
  if (!token || token.length > 500) return null;
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  const given = Buffer.from(signature, 'base64url');
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SessionClaims>;
    if (!Number.isSafeInteger(c.m) || !Number.isSafeInteger(c.v) || !Number.isSafeInteger(c.e)) return null;
    return (c.e as number) * 1000 > now ? (c as SessionClaims) : null;
  } catch {
    return null;
  }
}
