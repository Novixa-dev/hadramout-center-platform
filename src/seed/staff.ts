import type { Payload } from 'payload';

/**
 * Staff accounts from the environment, never from the repository (it is public): `STAFF_ACCOUNTS` lists who, and
 * `STAFF_PASSWORD` is the starting password. Used by `npm run db:seed` and on its own by `npm run staff:ensure`.
 *
 *   STAFF_ACCOUNTS="admin@novixa.dev:admin:Novixa, admin@hadramout.center:admin"   (email[:role[:name]], comma-separated)
 *   STAFF_PASSWORD="…"            at least 12 characters
 *   STAFF_RESET_PASSWORD=1        also set that password (and role) on accounts that already exist
 */

export type StaffRole = 'admin' | 'editor' | 'reviewer';
export interface StaffSpec {
  email: string;
  role: StaffRole;
  name: string;
}

const EMAIL = /^[^\s@:,]+@[^\s@:,]+\.[^\s@:,]{2,}$/;
const ROLES: readonly StaffRole[] = ['admin', 'editor', 'reviewer'];
const DEFAULT_NAME: Record<StaffRole, string> = { admin: 'مدير النظام', editor: 'محرر', reviewer: 'مراجع ترجمة' };
export const MIN_STAFF_PASSWORD = 12;

/** Parse `STAFF_ACCOUNTS`. Throws on anything malformed: a typo must not create a wrong account silently. */
export function parseStaffAccounts(raw: string | undefined): StaffSpec[] {
  const out: StaffSpec[] = [];
  for (const part of (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const [emailRaw = '', roleRaw = 'admin', ...nameParts] = part.split(':').map((s) => s.trim());
    const email = emailRaw.toLowerCase();
    const role = (roleRaw || 'admin') as StaffRole;
    if (!EMAIL.test(email)) throw new Error(`STAFF_ACCOUNTS: not an email: "${emailRaw}"`);
    if (!ROLES.includes(role)) throw new Error(`STAFF_ACCOUNTS: unknown role "${roleRaw}" for ${email} (admin, editor or reviewer)`);
    if (out.some((s) => s.email === email)) throw new Error(`STAFF_ACCOUNTS: ${email} is listed twice`);
    out.push({ email, role, name: nameParts.join(':') || DEFAULT_NAME[role] });
  }
  return out;
}

export function checkStaffPassword(password: string | undefined): string {
  if (!password || password.length < MIN_STAFF_PASSWORD) throw new Error(`STAFF_PASSWORD must be at least ${MIN_STAFF_PASSWORD} characters`);
  return password;
}

/** Create the listed accounts that do not exist; with `resetPassword`, also set role and password on existing ones. */
export async function ensureStaff(payload: Payload, specs: StaffSpec[], password: string, opts: { resetPassword?: boolean } = {}): Promise<{ created: string[]; updated: string[]; kept: string[] }> {
  const result = { created: [] as string[], updated: [] as string[], kept: [] as string[] };
  for (const s of specs) {
    const found = await payload.find({ collection: 'users', where: { email: { equals: s.email } }, limit: 1, depth: 0, overrideAccess: true });
    const existing = found.docs[0] as { id: number | string } | undefined;
    if (!existing) {
      await payload.create({ collection: 'users', data: { email: s.email, password, name: s.name, role: s.role } as never, overrideAccess: true });
      result.created.push(s.email);
    } else if (opts.resetPassword) {
      // a reset also clears a lockout left by failed attempts
      await payload.update({ collection: 'users', id: existing.id, data: { password, role: s.role, loginAttempts: 0, lockUntil: null } as never, overrideAccess: true });
      result.updated.push(s.email);
    } else {
      result.kept.push(s.email);
    }
  }
  return result;
}
