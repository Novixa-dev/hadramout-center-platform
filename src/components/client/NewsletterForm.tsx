'use client';
import { useId, useState, type FormEvent } from 'react';

export function NewsletterForm({ lang, labels, variant = 'stack' }: { lang: string; labels: { email: string; submit: string; ok: string; error: string }; variant?: 'stack' | 'inline' }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const id = useId();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/hc/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), website: data.get('website'), lang }) });
      setState(res.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    }
  }
  if (state === 'ok') return <p className="notice notice--ok" role="status">{labels.ok}</p>;
  return (
    <form onSubmit={onSubmit} className={variant === 'inline' ? 'nl-inline' : 'stack'} style={variant === 'inline' ? undefined : { ['--stack' as string]: '0.6rem' }}>
      <div className={variant === 'inline' ? 'nl-inline__row' : undefined}>
        <label className="sr-only" htmlFor={`${id}-email`}>{labels.email}</label>
        <input id={`${id}-email`} className="input" type="email" name="email" required autoComplete="email" placeholder={labels.email} />
        <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className={variant === 'inline' ? 'btn btn--gold' : 'btn btn--primary'} type="submit" disabled={state === 'busy'} aria-busy={state === 'busy'}>{labels.submit}</button>
      </div>
      {state === 'error' ? <p className="notice notice--err" role="alert">{labels.error}</p> : null}
    </form>
  );
}
