'use client';
import { useId, useState, type FormEvent } from 'react';
import { Icon } from '../Icon.tsx';

export function NewsletterForm({
  lang,
  labels,
  variant = 'premium',
}: {
  lang: string;
  labels: { email: string; submit: string; ok: string; error: string };
  variant?: 'stack' | 'inline' | 'premium';
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const id = useId();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/hc/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), website: data.get('website'), lang }),
      });
      setState(res.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    }
  }

  if (variant === 'premium') {
    if (state === 'ok') {
      return (
        <div className="hc-nl-notice hc-nl-notice--ok" role="status">
          <span className="hc-nl-notice__icon-circle" aria-hidden="true">
            <Icon name="check" />
          </span>
          <div className="hc-nl-notice__text">
            <p className="hc-nl-notice__msg">{labels.ok}</p>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={onSubmit} className="hc-nl-form" noValidate={false}>
        <div className="hc-nl-form__controls">
          <div className="hc-nl-form__input-wrapper">
            <span className="hc-nl-form__input-icon" aria-hidden="true">
              <Icon name="mail" />
            </span>
            <label className="sr-only" htmlFor={`${id}-email`}>
              {labels.email}
            </label>
            <input
              id={`${id}-email`}
              className="hc-nl-form__input"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={labels.email}
              disabled={state === 'busy'}
            />
          </div>
          <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button
            className="hc-nl-form__btn"
            type="submit"
            disabled={state === 'busy'}
            aria-busy={state === 'busy'}
          >
            {state === 'busy' ? (
              <span className="hc-nl-form__btn-loading">
                <span className="hc-nl-form__spinner" aria-hidden="true" />
                <span>{lang === 'ar' ? 'جاري الاشتراك...' : 'Subscribing...'}</span>
              </span>
            ) : (
              <span className="hc-nl-form__btn-inner">
                <span>{labels.submit}</span>
                <Icon name="arrow" className="hc-nl-form__btn-arrow" />
              </span>
            )}
          </button>
        </div>
        {state === 'error' && (
          <div className="hc-nl-notice hc-nl-notice--err" role="alert">
            <span className="hc-nl-notice__icon-circle" aria-hidden="true">
              <Icon name="info" />
            </span>
            <p className="hc-nl-notice__msg">{labels.error}</p>
          </div>
        )}
      </form>
    );
  }

  if (state === 'ok') return <p className="notice notice--ok" role="status" style={variant === 'inline' ? { color: 'var(--text)' } : undefined}>{labels.ok}</p>;
  return (
    <form onSubmit={onSubmit} className={variant === 'inline' ? 'nl-inline' : 'stack'} style={variant === 'inline' ? { display: 'grid', gap: '0.6rem' } : { ['--stack' as string]: '0.6rem' }}>
      <div style={variant === 'inline' ? { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } : undefined}>
        <label className="sr-only" htmlFor={`${id}-email`}>{labels.email}</label>
        <input id={`${id}-email`} className="input" type="email" name="email" required autoComplete="email" placeholder={labels.email} style={variant === 'inline' ? { flex: '1 1 14rem', inlineSize: 'auto', background: '#fff', color: '#1f2421' } : undefined} />
        <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className={variant === 'inline' ? 'btn btn--gold' : 'btn btn--primary'} type="submit" disabled={state === 'busy'} aria-busy={state === 'busy'}>{labels.submit}</button>
      </div>
      {state === 'error' ? <p className="notice notice--err" role="alert" style={variant === 'inline' ? { color: 'var(--text)' } : undefined}>{labels.error}</p> : null}
    </form>
  );
}

