/** Ceilings for reads of Payload's REST API (/api/<collection>). */
export const REST_MAX_LIMIT = 100;
export const REST_MAX_DEPTH = 2;

const clampLimit = (n: number): number => (n <= 0 ? REST_MAX_LIMIT : Math.min(Math.trunc(n), REST_MAX_LIMIT)); // limit=0 means "no limit" in Payload
const clampDepth = (n: number): number => Math.min(Math.max(Math.trunc(n), 0), REST_MAX_DEPTH);

const RULES = [
  ['limit', clampLimit, REST_MAX_LIMIT],
  ['depth', clampDepth, REST_MAX_DEPTH],
] as const;

/** Returns a copy of the query string with `limit` and `depth` clamped, or null when nothing needed changing. */
export function clampRestQuery(search: string): string | null {
  const params = new URLSearchParams(search);
  let changed = false;
  for (const [name, fn, fallback] of RULES) {
    const current = params.get(name);
    if (current === null) continue;
    const n = Number(current);
    const next = String(Number.isFinite(n) ? fn(n) : fallback);
    if (next !== current) {
      params.set(name, next);
      changed = true;
    }
  }
  return changed ? params.toString() : null;
}
