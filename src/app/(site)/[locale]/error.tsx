'use client';

import { useEffect } from 'react';

/** Boundary for failures while rendering a page (database hiccup, upstream error). Retry re-renders the segment. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[route-error]', error.digest ?? '', error.message);
  }, [error]);
  return (
    <div className="container error-page" role="alert">
      <p className="code" aria-hidden="true">500</p>
      <h1>حدث خطأ غير متوقع</h1>
      <p style={{ color: 'var(--text-2)', maxInlineSize: '32rem' }}>نعتذر عن ذلك. حاول مرة أخرى بعد قليل.</p>
      <p lang="en" dir="ltr" style={{ color: 'var(--text-2)', maxInlineSize: '32rem' }}>Something went wrong. Please try again in a moment.</p>
      <div className="cluster">
        <button type="button" className="btn btn--primary" onClick={() => reset()}>إعادة المحاولة · Try again</button>
        <a className="btn btn--secondary" href="/ar">الرئيسية</a>
        <a className="btn btn--secondary" href="/en" lang="en">Home</a>
      </div>
    </div>
  );
}
