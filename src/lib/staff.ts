import { getPayloadClient } from './runtime.ts';

export type StaffRole = 'admin' | 'editor' | 'reviewer';
export interface StaffUser {
  id: number | string;
  role: StaffRole;
}

const ROLES: readonly string[] = ['admin', 'editor', 'reviewer'];

/**
 * The signed-in staff member behind a request (Payload session cookie or `Authorization: JWT …`), or null for a visitor.
 * Routes outside Payload's own handlers (site pages, /api/hc/*) must call this before exposing drafts or spending budget.
 */
export async function staffUser(headers: Headers): Promise<StaffUser | null> {
  // no credentials at all → a visitor; skip the Payload lookup so public pages stay cheap
  if (!headers.get('cookie')?.includes('payload-token') && !headers.get('authorization')) return null;
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers });
  const role = (user as { role?: unknown } | null)?.role;
  if (!user || typeof role !== 'string' || !ROLES.includes(role)) return null;
  return { id: user.id as number | string, role: role as StaffRole };
}

/** Editors and admins may create content and use the paid editorial tools; reviewers only fix translations. */
export const canEdit = (user: StaffUser | null): boolean => user?.role === 'admin' || user?.role === 'editor';
