'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PASSWORD_MIN } from '../../lib/platform-values.ts';
import { errorText, flagField, useFocusOnShow, type Labels } from './PlatformForms.tsx';
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

/**
 * One account action at a time. A second submit while one is on its way is ignored (the button stays focusable, see Submit in
 * PlatformForms). On failure the field the error names is marked and focused; `fields` maps codes whose field differs on this form.
 */
function useAction(labels: Labels, fields: Record<string, string> = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const running = useRef(false);
  const run = async (action: string, body: Record<string, unknown>, form?: HTMLFormElement): Promise<boolean> => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError('');
    setOk(false);
    const res = await call(action, body);
    running.current = false;
    setBusy(false);
    if (res.ok) setOk(true);
    else setError(errorText(labels, res.code));
    flagField(form, res.ok ? null : res.code, fields);
    return res.ok;
  };
  const clear = () => setError('');
  return { busy, error, ok, run, clear };
}

const Button = ({ busy, kind, children }: { busy: boolean; kind: 'primary' | 'secondary'; children: ReactNode }) => (
  <button className={`btn btn--${kind}`} type="submit" aria-disabled={busy || undefined} aria-busy={busy}>{children}</button>
);

const Err = ({ text }: { text: string }) => (text ? <p className="notice notice--err platform-error" role="alert">{text}</p> : null);
const reload = () => window.location.reload();

export function SignIn({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { busy, error, run, clear } = useAction(labels, { exists: 'email' });
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    const done = await run(mode, mode === 'login' ? { email: d.email, password: d.password } : { ...d, consent: d.consent === 'on' }, f);
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
          <input id="a-password" className="input" type="password" name="password" required minLength={isLogin ? 1 : PASSWORD_MIN} maxLength={200} autoComplete={isLogin ? 'current-password' : 'new-password'} dir="ltr" aria-describedby={isLogin ? undefined : 'a-password-hint'} />
          {isLogin ? null : <span className="field__hint" id="a-password-hint">{labels.passwordHint}</span>}
        </div>
        {isLogin ? null : (
          <>
            <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="check field--full"><input type="checkbox" name="consent" required /><span>{labels.consent} <Link prefetch={false} href={privacyHref}>{labels.privacy}</Link>.</span></label>
          </>
        )}
        <div className="field--full">
          <Button busy={busy} kind="primary">{isLogin ? labels.login : labels.register}</Button>
          <Err text={error} />
        </div>
      </form>
      <p>
        {isLogin ? labels.noAccount : labels.haveAccount}{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            clear();
            setMode(isLogin ? 'register' : 'login');
          }}
        >{isLogin ? labels.register : labels.login}</button>
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
        void run('profile', Object.fromEntries(new FormData(e.currentTarget)), e.currentTarget);
      }}
    >
      <div className="field"><label htmlFor="p-name">{labels.name}</label><input id="p-name" className="input" name="name" required minLength={2} maxLength={120} defaultValue={name} autoComplete="name" /></div>
      <div className="field"><label htmlFor="p-phone">{labels.phoneOptional}</label><input id="p-phone" className="input" type="tel" name="phone" maxLength={40} defaultValue={phone} autoComplete="tel" dir="ltr" /></div>
      <div className="field--full">
        <Button busy={busy} kind="secondary">{labels.saveChanges}</Button>
        {ok ? <p className="notice notice--ok platform-error" role="status">{labels.saved}</p> : null}
        <Err text={error} />
      </div>
    </form>
  );
}

export function PasswordForm({ labels }: { labels: Labels }) {
  const { busy, error, ok, run } = useAction(labels, { password: 'current', weak: 'next' });
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        if (await run('password', Object.fromEntries(new FormData(f)), f)) f.reset();
      }}
    >
      <div className="field"><label htmlFor="pw-current">{labels.currentPassword}</label><input id="pw-current" className="input" type="password" name="current" required autoComplete="current-password" dir="ltr" /></div>
      <div className="field"><label htmlFor="pw-next">{labels.newPassword}</label><input id="pw-next" className="input" type="password" name="next" required minLength={PASSWORD_MIN} maxLength={200} autoComplete="new-password" dir="ltr" aria-describedby="pw-next-hint" /><span className="field__hint" id="pw-next-hint">{labels.passwordHint}</span></div>
      <div className="field--full">
        <Button busy={busy} kind="secondary">{labels.changePassword}</Button>
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

/**
 * Copying the reading list is always the reader's explicit choice: a device's list stays private until they press the button.
 * A backup replaces the account's copy, so it is refused from an empty device and asks first when it would drop items that exist
 * only in the account (a new phone backing up before restoring would otherwise wipe the copy).
 */
export function SavedSync({ labels }: { labels: Labels }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dropping, setDropping] = useState<number | null>(null);
  const fetchCopy = async (): Promise<SavedRow[]> => {
    const res = await fetch('/api/hc/member/saved');
    if (!res.ok) throw new Error('failed');
    return ((await res.json()) as { items: SavedRow[] }).items;
  };
  const start = () => {
    setError('');
    setMessage('');
    setDropping(null);
  };
  const upload = async () => {
    const res = await call('saved', { items: readSaved() });
    setDropping(null);
    if (res.ok) setMessage(labels.savedBackedUp as string);
    else setError(errorText(labels, res.code));
  };
  const backup = async () => {
    start();
    const local = readSaved();
    if (local.length === 0) return setError(labels.savedNothing as string);
    try {
      const here = new Set(local.map((i) => i.id));
      const lost = (await fetchCopy()).filter((i) => !here.has(i.id)).length;
      if (lost > 0) return setDropping(lost);
    } catch {
      return setError(errorText(labels, 'failed'));
    }
    await upload();
  };
  const restore = async () => {
    start();
    try {
      const items = await fetchCopy();
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
      {dropping !== null ? <ReplaceWarning labels={labels} n={dropping} onReplace={() => void upload()} onCancel={() => setDropping(null)} /> : null}
      {message ? <p className="notice notice--ok" role="status">{message}</p> : null}
      <Err text={error} />
    </div>
  );
}

function ReplaceWarning({ labels, n, onReplace, onCancel }: { labels: Labels; n: number; onReplace: () => void; onCancel: () => void }) {
  const ref = useFocusOnShow<HTMLDivElement>();
  return (
    <div className="notice notice--warn stack" role="alert" tabIndex={-1} ref={ref}>
      <p>{(labels.savedReplaceWarn as string).replace('{n}', String(n))}</p>
      <div className="cluster">
        <button type="button" className="btn btn--secondary btn--sm" onClick={onReplace}>{labels.savedReplace}</button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onCancel}>{labels.cancel}</button>
      </div>
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
  const { busy, error, run } = useAction(labels, { password: 'current' });
  return (
    <details className="danger-zone">
      <summary>{labels.deleteTitle}</summary>
      <p>{labels.deleteNote}</p>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          if (await run('delete', Object.fromEntries(new FormData(f)), f)) reload();
        }}
      >
        <div className="field"><label htmlFor="d-current">{labels.currentPassword}</label><input id="d-current" className="input" type="password" name="current" required autoComplete="current-password" dir="ltr" /></div>
        <div className="field--full">
          <Button busy={busy} kind="secondary">{labels.deleteConfirm}</Button>
          <Err text={error} />
        </div>
      </form>
    </details>
  );
}
