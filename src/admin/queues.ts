import type { IconName } from './icons.tsx';
import { listUrl } from './links.ts';
import type { dashboardStrings } from './i18n.ts';

/**
 * What visitors are waiting on, in one place: the dashboard's «ما يحتاج انتباهك», the header's notification bell and the
 * sidebar's inbox all read these, so they always agree on what counts, in which order and where each one opens.
 * Pure data (no Payload import): the browser bundle uses it too.
 */
type Strings = ReturnType<typeof dashboardStrings>;
type Key<K extends keyof Strings> = K;

export type QueueKey = 'receipts' | 'orders' | 'pledges' | 'volunteers' | 'messages' | 'reviews' | 'tr';
export interface Queue {
  key: QueueKey;
  collection: 'receipts' | 'orders' | 'pledges' | 'volunteers' | 'messages' | 'reviews';
  /** the filter, as the admin list URL and Payload's `where` both read it (fields at the top level are joined with AND) */
  where: Record<string, Record<string, string>>;
  icon: IconName;
  label: Key<'newReceipts' | 'newOrders' | 'newPledges' | 'newVolunteers' | 'newMessages' | 'pendingReviews' | 'translationIssues'>;
  quiet: Key<'qReceipts' | 'qOrders' | 'qPledges' | 'qVolunteers' | 'qMessages' | 'qReviews' | 'qTranslation'>;
  hint: Key<'newReceiptsHint' | 'newRequestsHint' | 'newMessagesHint' | 'pendingReviewsHint' | 'translationIssuesHint'>;
  /** editors and admins handle it; translation reviewers see only the translation reports */
  staff: boolean;
}

const NEW = { status: { equals: 'new' } };

export const QUEUES: readonly Queue[] = [
  { key: 'receipts', collection: 'receipts', where: NEW, icon: 'receipt', label: 'newReceipts', quiet: 'qReceipts', hint: 'newReceiptsHint', staff: true },
  { key: 'orders', collection: 'orders', where: NEW, icon: 'cart', label: 'newOrders', quiet: 'qOrders', hint: 'newRequestsHint', staff: true },
  { key: 'pledges', collection: 'pledges', where: NEW, icon: 'heart', label: 'newPledges', quiet: 'qPledges', hint: 'newRequestsHint', staff: true },
  { key: 'volunteers', collection: 'volunteers', where: NEW, icon: 'hand', label: 'newVolunteers', quiet: 'qVolunteers', hint: 'newRequestsHint', staff: true },
  { key: 'messages', collection: 'messages', where: NEW, icon: 'message', label: 'newMessages', quiet: 'qMessages', hint: 'newMessagesHint', staff: true },
  { key: 'reviews', collection: 'reviews', where: { status: { equals: 'pending' } }, icon: 'review', label: 'pendingReviews', quiet: 'qReviews', hint: 'pendingReviewsHint', staff: true },
  { key: 'tr', collection: 'messages', where: { kind: { equals: 'translation_issue' }, status: { equals: 'new' } }, icon: 'language', label: 'translationIssues', quiet: 'qTranslation', hint: 'translationIssuesHint', staff: false },
];

export type StaffRole = 'admin' | 'editor' | 'reviewer';

/** The queues a role works on: editors and admins everything visitors send, translation reviewers their reports. */
export const queuesFor = (role: StaffRole | undefined): Queue[] => QUEUES.filter((q) => (role === 'reviewer' ? !q.staff : q.staff));

export const queueHref = (q: Queue): string => listUrl(q.collection, q.where);

export const queueByKey = (key: string): Queue | undefined => QUEUES.find((q) => q.key === key);
