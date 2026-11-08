import type { ReactNode } from 'react';
import type { Ctx } from '../lib/ctx.ts';

/** A small status label: «قيد الإنشاء», «قيد الاعتماد», «متاح»… */
export function StatusBadge({ kind, children }: { kind: 'pending' | 'building' | 'live'; children: ReactNode }) {
  return <span className={`status-badge status-badge--${kind}`}>{children}</span>;
}

/** Credits text taken from the Center's decade book «عقد من المنجزات والتحديات» (December 2025), with its page numbers. */
export function SourceNote({ ctx, pages }: { ctx: Ctx; pages: string }) {
  return <p className="source-note">{ctx.t('source.book', { pages })}</p>;
}
