'use client';
import { useState, type FormEvent } from 'react';

interface Props {
  lang: string;
  kind: string;
  subject: string;
  pageUrl: string;
  bookId: string;
  labels: { name: string; email: string; phone: string; subject: string; message: string; send: string; ok: string; error: string; limit: string };
}

export function ContactForm({ lang, kind, subject, pageUrl, bookId, labels }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error' | 'limit'>('idle');
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('busy');
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch('/api/hc/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...d, kind, lang, pageUrl, bookId }) });
      setState(res.ok ? 'ok' : res.status === 429 ? 'limit' : 'error');
    } catch {
      setState('error');
    }
  }
  if (state === 'ok') return <p className="notice notice--ok" role="status">{labels.ok}</p>;
  return (
    <form onSubmit={onSubmit} className="form-grid" noValidate={false}>
      <div className="field"><label htmlFor="c-name">{labels.name}</label><input id="c-name" className="input" name="name" required maxLength={120} autoComplete="name" /></div>
      <div className="field"><label htmlFor="c-email">{labels.email}</label><input id="c-email" className="input" type="email" name="email" required maxLength={200} autoComplete="email" /></div>
      <div className="field"><label htmlFor="c-phone">{labels.phone}</label><input id="c-phone" className="input" type="tel" name="phone" maxLength={40} autoComplete="tel" /></div>
      <div className="field"><label htmlFor="c-subject">{labels.subject}</label><input id="c-subject" className="input" name="subject" required maxLength={200} defaultValue={subject} /></div>
      <div className="field field--full"><label htmlFor="c-msg">{labels.message}</label><textarea id="c-msg" className="textarea" name="body" required minLength={5} maxLength={5000} /></div>
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="field--full">
        <button className="btn btn--primary" type="submit" disabled={state === 'busy'}>{labels.send}</button>
        {state === 'error' ? <p className="notice notice--err" role="alert" style={{ marginBlockStart: '0.75rem' }}>{labels.error}</p> : null}
        {state === 'limit' ? <p className="notice notice--warn" role="alert" style={{ marginBlockStart: '0.75rem' }}>{labels.limit}</p> : null}
      </div>
    </form>
  );
}
