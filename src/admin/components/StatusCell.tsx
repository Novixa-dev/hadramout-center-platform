'use client';
import { useTranslation } from '@payloadcms/ui';

/**
 * The «الحالة» column of every list as the site's chips: done in green, waiting in gold, in progress outlined, closed in grey.
 * Wired to every top-level select field named `status` (payload.config.ts → withStatusCells), so no collection is missed.
 */
const TONE: Record<string, 'done' | 'waiting' | 'progress' | 'closed'> = {
  published: 'done', approved: 'done', verified: 'done', paid: 'done', delivered: 'done', confirmed: 'done', accepted: 'done',
  draft: 'waiting', new: 'waiting', pending: 'waiting',
  contacted: 'progress', reviewing: 'progress', received: 'progress',
  archived: 'closed', cancelled: 'closed', rejected: 'closed', declined: 'closed', suspended: 'closed', read: 'closed',
};

type Option = string | { value: string; label?: string | Record<string, string> };

export function StatusCell({ cellData, field }: { cellData?: unknown; field?: { options?: Option[] } }) {
  const { i18n } = useTranslation();
  if (typeof cellData !== 'string' || !cellData) return null;
  const option = field?.options?.find((o) => (typeof o === 'string' ? o : o.value) === cellData);
  const raw = typeof option === 'object' ? option.label : undefined;
  const label = typeof raw === 'string' ? raw : (raw?.[i18n.language] ?? raw?.ar ?? cellData);
  return <span className={`hc-status-chip hc-status-chip--${TONE[cellData] ?? 'closed'}`}>{label}</span>;
}
