'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  lang: string;
  slug: string;
  id: number | null;
  /** page language ≠ ar and this page still shows Arabic text → ask for a translation */
  needsTranslation: boolean;
  machine: boolean;
  reviewed: boolean;
  labels: { machine: string; reviewed: string; pending: string; unavailable: string; failed: string; ready: string; viewOriginal: string; report: string };
  originalHref: string;
  reportHref: string;
  providerEnabled: boolean;
}

/**
 * Shown on pages whose language is not Arabic.
 *  - complete machine translation → disclosure + link to the Arabic original
 *  - missing/partial → the browser (never a crawler) asks the server to translate, then polls and refreshes
 */
export function TrBanner({ lang, slug, id, needsTranslation, machine, reviewed, labels, originalHref, reportHref, providerEnabled }: Props) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'pending' | 'failed' | 'ready'>('idle');

  useEffect(() => {
    if (!needsTranslation || !providerEnabled) return;
    let cancelled = false;
    let tries = 0;
    const body = JSON.stringify({ slug, id, lang });
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/hc/translate?slug=${encodeURIComponent(slug)}&id=${id ?? ''}&lang=${encodeURIComponent(lang)}`, { cache: 'no-store' });
        const data = (await res.json()) as { state: 'ready' | 'pending' | 'failed' | 'none' };
        if (data.state === 'ready') {
          setState('ready');
          router.refresh();
          return;
        }
        if (data.state === 'failed' || ++tries > 60) {
          setState('failed');
          return;
        }
      } catch {
        /* transient: keep polling */
      }
      setTimeout(poll, 4000);
    };
    (async () => {
      setState('pending');
      try {
        await fetch('/api/hc/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      } catch {
        /* the poll reports the real state */
      }
      setTimeout(poll, 2500);
    })();
    return () => {
      cancelled = true;
    };
  }, [needsTranslation, providerEnabled, slug, id, lang, router]);

  if (needsTranslation) {
    return (
      <div className="tr-banner" role="status" aria-live="polite">
        <div className="container tr-banner__in">
          {state === 'pending' || state === 'ready' ? <span className="spinner" aria-hidden="true" /> : null}
          <span>{!providerEnabled ? labels.unavailable : state === 'failed' ? labels.failed : state === 'ready' ? labels.ready : labels.pending}</span>
          <a href={originalHref} hrefLang="ar">{labels.viewOriginal}</a>
        </div>
      </div>
    );
  }
  if (!machine && !reviewed) return null;
  return (
    <div className="tr-banner">
      <div className="container tr-banner__in">
        <span>{reviewed ? labels.reviewed : labels.machine}</span>
        <a href={originalHref} hrefLang="ar">{labels.viewOriginal}</a>
        <a href={reportHref}>{labels.report}</a>
      </div>
    </div>
  );
}
