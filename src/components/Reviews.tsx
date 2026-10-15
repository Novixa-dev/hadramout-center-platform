import type { Ctx } from '../lib/ctx.ts';
import { formatDate } from '../lib/dates.ts';
import type { ReviewSummary } from '../lib/reviews.ts';
import { Star } from './Icon.tsx';
import { ReviewForm } from './client/ReviewForm.tsx';

export function Stars({ value, label }: { value: number; label: string }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= full ? '' : 'off'} />)}
    </span>
  );
}

/** Reader reviews of one item: summary, approved reviews, and the (moderated) submission form. */
export function Reviews({ ctx, type, id, data }: { ctx: Ctx; type: 'book' | 'article' | 'magazine'; id: number; data: ReviewSummary }) {
  const { t, lang } = ctx;
  return (
    <section id="reviews" className="reviews box" aria-labelledby="reviews-h" style={{ marginBlockStart: 'var(--space-8)' }}>
      <h2 id="reviews-h" style={{ fontSize: 'var(--step-1)' }}>{t('reviews.title')}</h2>
      {data.count > 0 ? (
        <p className="review__head" style={{ marginBlockEnd: '0.5rem' }}>
          <Stars value={data.average} label={t('reviews.average', { avg: data.average, count: data.count })} />
          <strong>{data.average}</strong>
          <span>{t('reviews.count', { count: data.count })}</span>
        </p>
      ) : (
        <p style={{ color: 'var(--text-2)' }}>{t('reviews.none')}</p>
      )}
      {data.items.map((r) => (
        <article key={r.id} className="review">
          <div className="review__head">
            <Stars value={r.rating} label={t('reviews.stars', { n: r.rating })} />
            <strong>{r.name || t('reviews.anonymous')}</strong>
            <time dateTime={r.createdAt}>{formatDate(r.createdAt, lang.code)}</time>
          </div>
          <p dir="auto" style={{ whiteSpace: 'pre-line' }}>{r.body}</p>
        </article>
      ))}
      <div style={{ marginBlockStart: 'var(--space-5)' }}>
        <ReviewForm
          type={type}
          id={id}
          lang={lang.code}
          labels={{
            title: t('reviews.write'),
            rating: t('reviews.rating'),
            stars: t('reviews.stars', { n: '{n}' }),
            name: t('reviews.name'),
            nameHint: t('reviews.nameHint'),
            body: t('reviews.body'),
            bodyHint: t('reviews.bodyHint'),
            submit: t('reviews.submit'),
            sending: t('reviews.sending'),
            ok: t('reviews.ok'),
            errInvalid: t('reviews.errInvalid'),
            errShort: t('reviews.errShort'),
            errDuplicate: t('reviews.errDuplicate'),
            errRate: t('reviews.errRate'),
            errGeneric: t('reviews.errGeneric'),
          }}
        />
      </div>
    </section>
  );
}
