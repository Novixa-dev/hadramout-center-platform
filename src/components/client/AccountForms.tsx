'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PASSWORD_MIN } from '../../lib/platform-values.ts';
import { errorText, type Labels } from './PlatformForms.tsx';
import { readSaved, SAVED_KEY } from './Tools.tsx';

/** Sign-in, sign-up and account actions. The session lives in an http-only cookie that this code never sees. */

async function call(action: string, body: Record<string, unknown>): Promise<{ ok: boolean; code: string; data: Record<string, unknown> }> {
  try {
    const res = await fetch(`/api/hc/member/${action}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, code: res.status === 429 ? 'limit' : String(data.error ?? 'failed'), data };
  } catch {
    return { ok: false, code: 'failed', data: {} };
  }
}

function useAction(labels: Labels) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const run = async (action: string, body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setError('');
    setOk(false);
    const res = await call(action, body);
    setBusy(false);
    if (res.ok) setOk(true);
    else setError(errorText(labels, res.code));
    return res.ok;
  };
  return { busy, error, ok, run };
}

const Err = ({ text }: { text: string }) => (text ? <p className="notice notice--err platform-error" role="alert">{text}</p> : null);
const reload = () => window.location.reload();

export function SignIn({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { busy, error, run } = useAction(labels);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const done = await run(mode, mode === 'login' ? { email: d.email, password: d.password } : { ...d, consent: d.consent === 'on' });
    if (done) reload();
  }
  const isLogin = mode === 'login';
  return (
    <section className="info-section" aria-labelledby="signin-h">
      <h2 id="signin-h">{isLogin ? labels.loginTitle : labels.registerTitle}</h2>
      <form onSubmit={onSubmit} className="form-grid" key={mode}>
        {isLogin ? null : <div className="field field--full"><label htmlFor="a-name">{labels.name}</label><input id="a-name" className="input" name="name" required minLength={2} maxLength={120} autoComplete="name" /></div>}
        <div className="field"><label htmlFor="a-email">{labels.email}</label><input id="a-email" className="input" type="email" name="email" required maxLength={200} autoComplete={isLogin ? 'username' : 'email'} dir="ltr" /></div>
        <div className="field">
          <label htmlFor="a-password">{labels.password}</label>
          <input id="a-password" className="input" type="password" name="password" required minLength={isLogin ? 1 : PASSWORD_MIN} maxLength={200} autoComplete={isLogin ? 'current-password' : 'new-password'} dir="ltr" />
          {isLogin ? null : <span className="field__hint">{labels.passwordHint}</span>}
        </div>
        {isLogin ? null : (
          <>
            <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="check field--full"><input type="checkbox" name="consent" required /><span>{labels.consent} <Link prefetch={false} href={privacyHref}>{labels.privacy}</Link>.</span></label>
          </>
        )}
        <div className="field--full">
          <button className="btn btn--primary" type="submit" disabled={busy} aria-busy={busy}>{isLogin ? labels.login : labels.register}</button>
          <Err text={error} />
        </div>
      </form>
      <p>
        {isLogin ? labels.noAccount : labels.haveAccount}{' '}
        <button type="button" className="link-btn" onClick={() => setMode(isLogin ? 'register' : 'login')}>{isLogin ? labels.register : labels.login}</button>
      </p>
      {isLogin ? <p className="field__hint">{labels.forgot}</p> : null}
    </section>
  );
}

export function ProfileForm({ labels, name, phone }: { labels: Labels; name: string; phone: string }) {
  const { busy, error, ok, run } = useAction(labels);
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        void run('profile', Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <div className="field"><label htmlFor="p-name">{labels.name}</label><input id="p-name" className="input" name="name" required minLength={2} maxLength={120} defaultValue={name} autoComplete="name" /></div>
      <div className="field"><label htmlFor="p-phone">{labels.phoneOptional}</label><input id="p-phone" className="input" type="tel" name="phone" maxLength={40} defaultValue={phone} autoComplete="tel" dir="ltr" /></div>
      <div className="field--full">
        <button className="btn btn--secondary" type="submit" disabled={busy} aria-busy={busy}>{labels.saveChanges}</button>
        {ok ? <p className="notice notice--ok platform-error" role="status">{labels.saved}</p> : null}
        <Err text={error} />
      </div>
    </form>
  );
}

export function PasswordForm({ labels }: { labels: Labels }) {
  const { busy, error, ok, run } = useAction(labels);
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        if (await run('password', Object.fromEntries(new FormData(f)))) f.reset();
      }}
    >
      <div className="field"><label htmlFor="pw-current">{labels.currentPassword}</label><input id="pw-current" className="input" type="password" name="current" required autoComplete="current-password" dir="ltr" /></div>
      <div className="field"><label htmlFor="pw-next">{labels.newPassword}</label><input id="pw-next" className="input" type="password" name="next" required minLength={PASSWORD_MIN} maxLength={200} autoComplete="new-password" dir="ltr" /><span className="field__hint">{labels.passwordHint}</span></div>
      <div className="field--full">
        <button className="btn btn--secondary" type="submit" disabled={busy} aria-busy={busy}>{labels.changePassword}</button>
        {ok ? <p className="notice notice--ok platform-error" role="status">{labels.passwordChanged}</p> : null}
        <Err text={error} />
      </div>
    </form>
  );
}

interface SavedRow {
  id: string;
  title: string;
  url: string;
  type: string;
}

/** Copying the reading list is always the reader's explicit choice: a device's list stays private until they press the button. */
export function SavedSync({ labels }: { labels: Labels }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const backup = async () => {
    setError('');
    setMessage('');
    const res = await call('saved', { items: readSaved() });
    if (res.ok) setMessage(labels.savedBackedUp as string);
    else setError(errorText(labels, res.code));
  };
  const restore = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/hc/member/saved');
      if (!res.ok) throw new Error('failed');
      const { items } = (await res.json()) as { items: SavedRow[] };
      const local = readSaved();
      const known = new Set(local.map((i) => i.id));
      localStorage.setItem(SAVED_KEY, JSON.stringify([...local, ...items.filter((i) => !known.has(i.id))]));
      setMessage(labels.savedRestored as string);
    } catch {
      setError(errorText(labels, 'failed'));
    }
  };
  return (
    <div className="stack">
      <div className="cluster">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => void backup()}>{labels.savedBackup}</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => void restore()}>{labels.savedRestore}</button>
      </div>
      {message ? <p className="notice notice--ok" role="status">{message}</p> : null}
      <Err text={error} />
    </div>
  );
}

export function SignOut({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={async () => {
        await call('logout', {});
        reload();
      }}
    >
      {label}
    </button>
  );
}

export function DeleteAccount({ labels }: { labels: Labels }) {
  const { busy, error, run } = useAction(labels);
  return (
    <details>
      <summary>{labels.deleteTitle}</summary>
      <p>{labels.deleteNote}</p>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run('delete', Object.fromEntries(new FormData(e.currentTarget)))) reload();
        }}
      >
        <div className="field"><label htmlFor="d-current">{labels.currentPassword}</label><input id="d-current" className="input" type="password" name="current" required autoComplete="current-password" dir="ltr" /></div>
        <div className="field--full">
          <button className="btn btn--secondary" type="submit" disabled={busy} aria-busy={busy}>{labels.deleteConfirm}</button>
          <Err text={error} />
        </div>
      </form>
    </details>
  );
}
