'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../Icon.tsx';
import { MAX_ORDER_LINES, MAX_QUANTITY } from '../../lib/platform-values.ts';
import { Consent, ContactFields, Done, errorText, offerReceipt, usePrefill, type Labels } from './PlatformForms.tsx';

/** The cart lives in this browser until the order is sent; the server re-checks every book, so titles here are for display only. */

const KEY = 'hc-cart';
const CHANGED = 'hc-cart-changed';

interface Line {
  id: number;
  title: string;
  quantity: number;
}

function read(): Line[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Line[];
    return Array.isArray(v) ? v.filter((l) => Number.isSafeInteger(l?.id) && typeof l.title === 'string' && Number.isSafeInteger(l.quantity) && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

function write(lines: Line[]) {
  try {
    if (lines.length) localStorage.setItem(KEY, JSON.stringify(lines));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the cart simply does not persist */
  }
  window.dispatchEvent(new Event(CHANGED));
}

function useCart(): Line[] | null {
  const [lines, setLines] = useState<Line[] | null>(null);
  useEffect(() => {
    const sync = () => setLines(read());
    sync();
    window.addEventListener(CHANGED, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return lines;
}

export function AddToCart({ id, title, add, added, cartHref, viewCart }: { id: number; title: string; add: string; added: string; cartHref?: string; viewCart?: string }) {
  const lines = useCart();
  const inCart = lines?.some((l) => l.id === id) ?? false;
  const toggle = () => {
    const now = read();
    write(now.some((l) => l.id === id) ? now.filter((l) => l.id !== id) : [...now, { id, title, quantity: 1 }].slice(0, MAX_ORDER_LINES));
  };
  return (
    <>
      <button type="button" className={`btn btn--sm ${inCart ? 'btn--secondary' : 'btn--gold'}`} aria-pressed={inCart} aria-label={`${inCart ? added : add}: ${title}`} onClick={toggle}>
        <Icon name={inCart ? 'check' : 'cart'} /> {inCart ? added : add}
      </button>
      {inCart && cartHref ? <a className="btn btn--secondary btn--sm" href={cartHref}>{viewCart}</a> : null}
    </>
  );
}

export function CartPanel({ lang, labels, privacyHref, booksHref }: { lang: string; labels: Labels; privacyHref: string; booksHref: string }) {
  const lines = useCart();
  const form = usePrefill(Boolean(lines?.length));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference?: string | null } | null>(null);

  if (done) {
    return (
      <Done labels={labels} reference={done.reference}>
        {done.reference ? <p><a className="btn btn--secondary btn--sm" href="#receipt">{labels.receiptLater}</a></p> : null}
      </Done>
    );
  }
  if (lines === null) return <div className="skeleton" style={{ blockSize: '6rem' }} aria-hidden="true" />;
  if (lines.length === 0) return <p className="empty-state">{labels.cartEmpty} <a href={booksHref}>{labels.browse}</a></p>;

  const setQuantity = (id: number, quantity: number) => write(read().map((l) => (l.id === id ? { ...l, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity || 1)) } : l)));
  const remove = (id: number) => write(read().filter((l) => l.id !== id));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/hc/requests/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(d), consent: d.get('consent') === 'on', lang, items: read().map((l) => ({ book: l.id, quantity: l.quantity })) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; reference?: string | null };
      if (res.ok) {
        write([]);
        setDone({ reference: data.reference });
        if (data.reference) offerReceipt(data.reference, String(d.get('email') ?? ''));
      } else setError(errorText(labels, res.status === 429 ? 'limit' : (data.error ?? 'failed')));
    } catch {
      setError(errorText(labels, 'failed'));
    }
    setBusy(false);
  }

  return (
    <div className="stack">
      <ul className="cart-lines" role="list">
        {lines.map((l) => (
          <li key={l.id} className="cart-line">
            <span className="cart-line__title">{l.title}</span>
            <label className="cart-line__qty">
              <span className="sr-only">{labels.quantity}: {l.title}</span>
              <QuantityInput value={l.quantity} onCommit={(n) => setQuantity(l.id, n)} />
            </label>
            <button type="button" className="icon-btn" onClick={() => remove(l.id)} aria-label={`${labels.remove}: ${l.title}`}><Icon name="close" /></button>
          </li>
        ))}
      </ul>
      <form ref={form} onSubmit={onSubmit} className="form-grid">
        <ContactFields labels={labels} phoneRequired />
        <div className="field field--full"><label htmlFor="o-address">{labels.address}</label><textarea id="o-address" className="textarea" name="address" required minLength={5} maxLength={500} autoComplete="street-address" /></div>
        <div className="field field--full"><label htmlFor="o-note">{labels.note}</label><textarea id="o-note" className="textarea" name="note" maxLength={2000} /></div>
        <Consent labels={labels} privacyHref={privacyHref} />
        <div className="field--full">
          <button className="btn btn--primary" type="submit" disabled={busy} aria-busy={busy}>{labels.send}</button>
          {error ? <p className="notice notice--err platform-error" role="alert">{error}</p> : null}
        </div>
      </form>
    </div>
  );
}

/** A draft while typing: clearing the field to type another number must not snap it back to 1 (that turned "3" into "13"). */
function QuantityInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() && Number.isInteger(n) && n >= 1) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <input
      className="input"
      type="number"
      inputMode="numeric"
      min={1}
      max={MAX_QUANTITY}
      value={draft}
      dir="ltr"
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() && Number.isInteger(n) && n >= 1) onCommit(n);
      }}
      onBlur={commit}
    />
  );
}
