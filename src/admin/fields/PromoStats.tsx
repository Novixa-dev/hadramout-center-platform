'use client';
import { useEffect, useState } from 'react';
import { useDocumentInfo, useTranslation } from '@payloadcms/ui';
import { ctr } from '../../lib/promotions.ts';

interface Totals {
  view: number;
  click: number;
  close: number;
}
interface Stats {
  total: Totals;
  last7: Totals;
  since: string | null;
}

const T = {
  title: ['الإحصاءات', 'Statistics'],
  note: [
    'أعداد يومية مجهولة الهوية: لا يُحفظ أي بيان عن الزائر، ولا تُرسل المتصفحات التي تطلب عدم التتبع شيئاً. تُحدَّث مع كل فتح لهذه الصفحة.',
    'Anonymous daily totals: nothing about visitors is stored, and browsers that ask not to be tracked send nothing. Refreshed each time this page opens.',
  ],
  unsaved: ['تظهر الإحصاءات بعد حفظ الإعلان.', 'Statistics appear once the promotion is saved.'],
  loading: ['جارٍ التحميل…', 'Loading…'],
  failed: ['تعذّر تحميل الإحصاءات.', 'Could not load the statistics.'],
  views: ['مرات الظهور', 'Views'],
  clicks: ['النقرات', 'Clicks'],
  rate: ['نسبة النقر', 'Click rate'],
  closes: ['الإغلاق', 'Closed'],
  all: ['منذ البداية', 'All time'],
  week: ['آخر 7 أيام', 'Last 7 days'],
  since: ['أول تسجيل', 'First recorded'],
} as const;

/** Views, clicks, click rate and closes of one promotion (GET /api/hc/promo?id=…, staff only). */
export function PromoStats() {
  const { id } = useDocumentInfo();
  const { i18n } = useTranslation();
  const en = i18n.language === 'en';
  const t = (k: keyof typeof T) => T[k][en ? 1 : 0];
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ctl = new AbortController();
    fetch(`/api/hc/promo?id=${encodeURIComponent(String(id))}`, { credentials: 'same-origin', signal: ctl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Stats>) : Promise.reject(new Error(String(r.status)))))
      .then(setStats)
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setFailed(true);
      });
    return () => ctl.abort();
  }, [id]);

  // the admin writes numbers with Latin digits in both languages (as the dashboard does)
  const locale = en ? 'en' : 'ar-EG-u-nu-latn';
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const rate = (s: Totals) => {
    const r = ctr(s.view, s.click);
    return r === null ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(r / 100);
  };
  const day = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

  return (
    <section className="hc-promo-stats" aria-labelledby="hc-promo-stats-h">
      <h3 id="hc-promo-stats-h" className="hc-promo-stats__title">{t('title')}</h3>
      {!id ? (
        <p className="hc-promo-stats__note">{t('unsaved')}</p>
      ) : failed ? (
        <p className="hc-promo-stats__note" role="status">{t('failed')}</p>
      ) : !stats ? (
        <p className="hc-promo-stats__note" role="status">{t('loading')}</p>
      ) : (
        <table className="hc-promo-stats__table">
          <thead>
            <tr>
              <td />
              <th scope="col">{t('views')}</th>
              <th scope="col">{t('clicks')}</th>
              <th scope="col">{t('rate')}</th>
              <th scope="col">{t('closes')}</th>
            </tr>
          </thead>
          <tbody>
            {([['week', stats.last7], ['all', stats.total]] as const).map(([k, s]) => (
              <tr key={k}>
                <th scope="row">{t(k)}</th>
                <td data-count={s.view}>{fmt(s.view)}</td>
                <td data-count={s.click}>{fmt(s.click)}</td>
                <td>{rate(s)}</td>
                <td data-count={s.close}>{fmt(s.close)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {stats?.since ? <p className="hc-promo-stats__note">{t('since')}: {day(stats.since)}</p> : null}
      <p className="hc-promo-stats__note">{t('note')}</p>
    </section>
  );
}
