import { createHash } from 'node:crypto';
import { extras } from './extras.ts';

/** Fixed-window limiter backed by the extras DB. Returns true when the request is allowed. */
export function allow(bucket: string, limit: number, windowSec: number): boolean {
  const db = extras();
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const row = db.get<{ hits: number }>(
    'INSERT INTO rate_limits (bucket, window, hits) VALUES (?, ?, 1) ON CONFLICT(bucket, window) DO UPDATE SET hits = hits + 1 RETURNING hits',
    bucket,
    window,
  );
  if (Math.random() < 0.01) db.run('DELETE FROM rate_limits WHERE window < ?', window - 2);
  return (row?.hits ?? 1) <= limit;
}

/**
 * One host usually holds a whole IPv6 /64, so limiting per full address would give it endless fresh buckets.
 * IPv4 addresses and IPv4-mapped forms are returned unchanged.
 */
export function limitingAddress(ip: string): string {
  if (!ip.includes(':') || ip.includes('.')) return ip;
  const [head = '', tail] = ip.split('%')[0]!.toLowerCase().split('::') as [string, string?];
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

/** Client identity for limiting without storing the address: a daily-salted hash of the IP. */
export function clientKey(req: Request): string {
  const ip = limitingAddress(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local');
  return createHash('sha256').update(`${ip}|${new Date().toISOString().slice(0, 10)}|${process.env.PAYLOAD_SECRET ?? ''}`).digest('hex').slice(0, 24);
}
