import type { CollectionSlug, Payload, Where } from 'payload';
import { queuesFor, type QueueKey, type StaffRole } from '../admin/queues.ts';

export interface Waiting {
  key: QueueKey;
  /** null when the count failed or the user may not read that collection */
  n: number | null;
}

/**
 * How many items wait in each queue the user works on, counted with the user's own access (never overrideAccess), so a
 * count can only ever be what that person could open in the list anyway.
 */
export async function waitingCounts(payload: Payload, user: { role?: string } & Record<string, unknown>): Promise<Waiting[]> {
  const role = (['admin', 'editor', 'reviewer'].includes(user.role ?? '') ? user.role : 'editor') as StaffRole;
  return Promise.all(
    queuesFor(role).map(async (q): Promise<Waiting> => {
      try {
        const { totalDocs } = await payload.count({ collection: q.collection as CollectionSlug, where: q.where as Where, user: user as never, overrideAccess: false });
        return { key: q.key, n: totalDocs };
      } catch {
        return { key: q.key, n: null };
      }
    }),
  );
}
