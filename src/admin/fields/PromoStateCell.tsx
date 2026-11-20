'use client';
import { useFormFields, useTranslation } from '@payloadcms/ui';
import { promoState } from '../../lib/promotions.ts';

/**
 * A promotion's schedule as one of the site's status chips: draft, scheduled (published, not started), live, ended.
 * `PromoStateCell` is the list column; `PromoStateField` shows the same chip in the edit view's sidebar as the form changes.
 */
const TEXT = {
  draft: ['مسودة', 'Draft'],
  scheduled: ['مجدول', 'Scheduled'],
  live: ['يظهر الآن', 'Live now'],
  ended: ['انتهى', 'Ended'],
} as const;
const TONE = { draft: 'waiting', scheduled: 'progress', live: 'done', ended: 'closed' } as const;

function Chip({ state }: { state: keyof typeof TEXT }) {
  const { i18n } = useTranslation();
  const label = TEXT[state][i18n.language === 'en' ? 1 : 0];
  return <span className={`hc-status-chip hc-status-chip--${TONE[state]}`}>{label}</span>;
}

export function PromoStateCell({ rowData }: { rowData?: { status?: string; startAt?: string; endAt?: string } }) {
  return <Chip state={promoState(rowData?.status, rowData?.startAt, rowData?.endAt)} />;
}

export function PromoStateField() {
  const { i18n } = useTranslation();
  const f = useFormFields(([fields]) => ({
    status: fields?.status?.value as string | undefined,
    startAt: fields?.startAt?.value as string | undefined,
    endAt: fields?.endAt?.value as string | undefined,
  }));
  return (
    <div className="field-type hc-promo-state">
      <span className="field-label">{i18n.language === 'en' ? 'Schedule' : 'حالة الجدولة'}</span>
      <Chip state={promoState(f.status, f.startAt, f.endAt)} />
    </div>
  );
}
