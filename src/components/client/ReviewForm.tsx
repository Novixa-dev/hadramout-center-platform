'use client';
import { Fragment, useId, useState } from 'react';
import { Star } from '../Icon.tsx';

interface Labels {
  title: string;
  rating: string;
  /** "{n} of 5" */
  stars: string;
  name: string;
  nameHint: string;
  body: string;
  bodyHint: string;
  submit: string;
  sending: string;
  ok: string;
  errInvalid: string;
  errShort: string;
  errDuplicate: string;
  errRate: string;
  errGeneric: string;
}

/** Reader review form. Always ends in a visible success or error message (never a silent failure). */
export function ReviewForm({ type, id, lang, labels }: { type: 'book' | 'article' | 'magazine'; id: number; lang: string; labels: Labels }) {
  const uid = useId();
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = String(f.get('body') ?? '').trim();
    if (!rating) {
      setState('error');
      setMsg(labels.errInvalid);
      return;
    }
    if (body.length < 10) {
      setState('error');
      setMsg(labels.errShort);
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/hc/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type, id, lang, rating, name: f.get('name'), body, website: f.get('website') }),
      });
      if (res.ok) {
        setState('ok');
        setMsg(labels.ok);
        return;
      }
      setState('error');
      setMsg(res.status === 409 ? labels.errDuplicate : res.status === 429 ? labels.errRate : res.status === 400 ? labels.errShort : labels.errGeneric);
    } catch {
      setState('error');
      setMsg(labels.errGeneric);
    }
  };

  if (state === 'ok') return <p className="notice notice--ok" role="status">{msg}</p>;

  return (
    <form onSubmit={submit} className="stack" noValidate aria-labelledby={`${uid}-t`} style={{ '--stack': '1rem' } as React.CSSProperties}>
      <h3 id={`${uid}-t`}>{labels.title}</h3>
      <fieldset className="rate" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">{labels.rating}</legend>
        {[5, 4, 3, 2, 1].map((n) => (
          <Fragment key={n}>
            <input type="radio" name={`${uid}-rating`} id={`${uid}-r${n}`} value={n} checked={rating === n} onChange={() => setRating(n)} />
            <label htmlFor={`${uid}-r${n}`} title={labels.stars.replace('{n}', String(n))}>
              <Star />
              <span className="sr-only">{labels.stars.replace('{n}', String(n))}</span>
            </label>
          </Fragment>
        ))}
      </fieldset>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${uid}-n`}>{labels.name}</label>
          <input id={`${uid}-n`} className="input" name="name" maxLength={80} autoComplete="name" aria-describedby={`${uid}-nh`} />
          <span className="field__hint" id={`${uid}-nh`}>{labels.nameHint}</span>
        </div>
        <div className="field field--full">
          <label htmlFor={`${uid}-b`}>{labels.body}</label>
          <textarea id={`${uid}-b`} className="textarea" name="body" required minLength={10} maxLength={2000} aria-describedby={`${uid}-bh`} aria-invalid={state === 'error' && !!msg} />
          <span className="field__hint" id={`${uid}-bh`}>{labels.bodyHint}</span>
        </div>
      </div>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state === 'error' ? <p className="field__error" role="alert">{msg}</p> : null}
      <div>
        <button className="btn btn--primary" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>{state === 'sending' ? labels.sending : labels.submit}</button>
      </div>
    </form>
  );
}
