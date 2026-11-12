'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { CURRENCIES, MAX_RECEIPT_BYTES, PAYABLE_REFERENCE, RECEIPT_ACCEPT, VOLUNTEER_AREAS } from '../../lib/platform-values.ts';

/**
 * The visitor forms of the digital platforms. Errors come back as short codes from the routes and are looked up in `labels`,
 * so every message is translated. A signed-in member's name, address and phone are filled in, and nothing else.
 */

export type Labels = Record<string, string>;
type Sent = { ok: true; reference?: string | null } | { ok: false; code: string };

async function send(url: string, body: Record<string, unknown>): Promise<Sent> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; reference?: string | null };
    if (res.ok) return { ok: true, reference: data.reference };
    return { ok: false, code: res.status === 429 ? 'limit' : (data.error ?? 'failed') };
  } catch {
    return { ok: false, code: 'failed' };
  }
}

export const errorText = (labels: Labels, code: string): string => labels[`err.${code}`] ?? labels['err.failed'] ?? code;

/** The field each error code is about (a form can override one, e.g. «password» means the current password when changing it). */
const FIELD_OF: Record<string, string> = {
  name: 'name', email: 'email', phone: 'phone', address: 'address', amount: 'amount', currency: 'currency', areas: 'areas', experience: 'experience',
  consent: 'consent', reference: 'reference', notfound: 'reference', file: 'receipt', heic: 'receipt', size: 'receipt', large: 'receipt', weak: 'password', invalid: 'password',
};

/**
 * Marks the field a server error names as invalid and moves focus to it, so a screen-reader or keyboard user lands where the fix
 * is; the message itself is announced by its alert. Earlier marks are cleared first. Codes without a field (limit, failed) only clear.
 */
export function flagField(form: HTMLFormElement | null | undefined, code: string | null, fields: Record<string, string> = {}) {
  if (!form) return;
  for (const el of form.querySelectorAll('[aria-invalid="true"]')) el.removeAttribute('aria-invalid');
  const name = code ? (fields[code] ?? FIELD_OF[code]) : undefined;
  if (!name) return;
  const found = form.elements.namedItem(name);
  const el = (found instanceof RadioNodeList ? found[0] : found) as HTMLElement | null;
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  el.focus();
}

/** Focus moves to a confirmation that replaces its form, or it would fall back to the top of the page unannounced. */
export function useFocusOnShow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

/**
 * Fills empty contact fields of the form from the signed-in account. `shown` changes whenever the form comes (back) on screen
 * (the cart's order form appears only with its first book), so the fields are filled then too, not only on the first render.
 */
export function usePrefill(shown: unknown = true) {
  const form = useRef<HTMLFormElement>(null);
  const [member, setMember] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/hc/member/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { member?: Record<string, string> | null } | null) => {
        if (live && d?.member) setMember(d.member);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!member || !form.current) return;
    for (const name of ['name', 'email', 'phone']) {
      const el = form.current.elements.namedItem(name) as HTMLInputElement | null;
      if (el && !el.value && member[name]) el.value = member[name] as string;
    }
  }, [member, shown]);
  return form;
}

export function ContactFields({ labels, phoneRequired = false }: { labels: Labels; phoneRequired?: boolean }) {
  return (
    <>
      <div className="field"><label htmlFor="pf-name">{labels.name}</label><input id="pf-name" className="input" name="name" required minLength={2} maxLength={120} autoComplete="name" /></div>
      <div className="field"><label htmlFor="pf-email">{labels.email}</label><input id="pf-email" className="input" type="email" name="email" required maxLength={200} autoComplete="email" dir="ltr" /></div>
      <div className="field"><label htmlFor="pf-phone">{phoneRequired ? labels.phone : labels.phoneOptional}</label><input id="pf-phone" className="input" type="tel" name="phone" required={phoneRequired} maxLength={40} autoComplete="tel" dir="ltr" /></div>
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    </>
  );
}

export function Consent({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  return (
    <label className="check field--full">
      <input type="checkbox" name="consent" required />
      <span>{labels.consent} <Link prefetch={false} href={privacyHref}>{labels.privacy}</Link>.</span>
    </label>
  );
}

export function Done({ labels, reference, children }: { labels: Labels; reference?: string | null; children?: ReactNode }) {
  const ref = useFocusOnShow<HTMLDivElement>();
  return (
    <div className="notice notice--ok" role="status" tabIndex={-1} ref={ref}>
      <p>{labels.done}</p>
      {reference ? (
        <>
          <p>{labels.reference}: <strong dir="ltr" translate="no">{reference}</strong></p>
          <p>{labels.keepReference}</p>
        </>
      ) : null}
      {children}
    </div>
  );
}

/** While sending, the button says so but stays focusable (a disabled button drops focus to the page); the form ignores a second submit. */
export function Submit({ busy, label, error }: { busy: boolean; label: string; error?: string }) {
  return (
    <div className="field--full">
      <button className="btn btn--primary" type="submit" aria-disabled={busy || undefined} aria-busy={busy}>{label}</button>
      {error ? <p className="notice notice--err platform-error" role="alert">{error}</p> : null}
    </div>
  );
}

/** Common submit flow: read the form, post it, and report back. */
function useRequest(kind: string, lang: string, labels: Labels, extra: (d: FormData) => Record<string, unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference?: string | null } | null>(null);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = e.currentTarget;
    const d = new FormData(f);
    const more = extra(d);
    setBusy(true);
    setError('');
    const base = Object.fromEntries(d) as Record<string, unknown>;
    const res = await send(`/api/hc/requests/${kind}`, { ...base, ...more, consent: d.get('consent') === 'on', lang });
    setBusy(false);
    if (res.ok) {
      setDone({ reference: res.reference });
      if (res.reference && kind === 'pledge') offerReceipt(res.reference, String(d.get('email') ?? ''));
    } else {
      setError(errorText(labels, res.code));
      flagField(f, res.code);
    }
  }
  return { busy, error, done, onSubmit };
}

const RECEIPT_EVENT = 'hc-receipt-for';

/** Fills the page's receipt form with a request just sent, so the visitor does not copy its reference by hand. */
export function offerReceipt(reference: string, email: string) {
  window.dispatchEvent(new CustomEvent(RECEIPT_EVENT, { detail: { reference, email } }));
}

/**
 * The photo of a transfer receipt for an order or a pledge, matched by its reference and email. The reference also comes from
 * `?ref=` (the account page links here) or from a request sent a moment ago on the same page.
 */
export function ReceiptForm({ lang, labels }: { lang: string; labels: Labels }) {
  const [done, setDone] = useState(false);
  const form = usePrefill(done);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [chosen, setChosen] = useState('');

  useEffect(() => {
    const fill = (reference: string, email?: string) => {
      const els = form.current?.elements;
      if (!els) return;
      const ref = els.namedItem('reference') as HTMLInputElement | null;
      const mail = els.namedItem('email') as HTMLInputElement | null;
      if (ref) ref.value = reference;
      if (mail && email && !mail.value) mail.value = email;
    };
    const fromUrl = (new URLSearchParams(window.location.search).get('ref') ?? '').toUpperCase();
    if (PAYABLE_REFERENCE.test(fromUrl)) fill(fromUrl);
    const onOffer = (e: Event) => {
      const { reference, email } = (e as CustomEvent<{ reference: string; email: string }>).detail;
      setDone(false);
      // the form may be showing its confirmation: fill it once it is back on screen
      requestAnimationFrame(() => fill(reference, email));
    };
    window.addEventListener(RECEIPT_EVENT, onOffer);
    return () => window.removeEventListener(RECEIPT_EVENT, onOffer);
  }, [form, done]);

  const [chosenSize, setChosenSize] = useState('');
  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setError('');
    input.removeAttribute('aria-invalid');
    if (file && file.size > MAX_RECEIPT_BYTES) {
      input.value = '';
      setChosen('');
      setError(errorText(labels, 'size'));
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    setChosen(file?.name ?? '');
    setChosenSize(file ? new Intl.NumberFormat(`${lang}-u-nu-latn`, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 0 }).format(Math.max(1, file.size / 1024)) : '');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = e.currentTarget;
    const d = new FormData(f);
    d.set('lang', lang);
    setBusy(true);
    setError('');
    let code: string | null = null;
    try {
      // no content-type header: the browser writes the multipart boundary itself
      const res = await fetch('/api/hc/receipts', { method: 'POST', body: d });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setDone(true);
        setChosen('');
      } else code = res.status === 429 ? 'limit' : (data.error ?? 'failed');
    } catch {
      code = 'failed';
    }
    setBusy(false);
    if (code) {
      setError(errorText(labels, code));
      flagField(f, code);
    }
  }

  if (done) return <ReceiptDone labels={labels} onAnother={() => setDone(false)} />;
  return (
    <form ref={form} onSubmit={onSubmit} className="form-grid" encType="multipart/form-data">
      <div className="field">
        <label htmlFor={`${id}-ref`}>{labels.reference}</label>
        <input id={`${id}-ref`} className="input" name="reference" required maxLength={40} dir="ltr" autoComplete="off" spellCheck={false} aria-describedby={`${id}-ref-hint`} />
        <span className="field__hint" id={`${id}-ref-hint`}>{labels.referenceHint}</span>
      </div>
      <div className="field"><label htmlFor={`${id}-email`}>{labels.email}</label><input id={`${id}-email`} className="input" type="email" name="email" required maxLength={200} autoComplete="email" dir="ltr" /></div>
      <div className="field field--full">
        <label htmlFor={`${id}-file`}>{labels.file}</label>
        <input id={`${id}-file`} className="input" type="file" name="receipt" required accept={RECEIPT_ACCEPT} onChange={onFile} aria-describedby={`${id}-file-hint`} />
        <span className="field__hint" id={`${id}-file-hint`}>{labels.fileHint}</span>
        {chosen ? <span className="field__hint">{labels.chosen}: <bdi>{chosen}</bdi> (<bdi dir="ltr">{chosenSize}</bdi>)</span> : null}
      </div>
      <div className="field"><label htmlFor={`${id}-amount`}>{labels.amount}</label><input id={`${id}-amount`} className="input" type="number" name="amount" min="0.01" step="any" inputMode="decimal" dir="ltr" /></div>
      <div className="field"><label htmlFor={`${id}-cur`}>{labels.currency}</label>
        <select id={`${id}-cur`} className="select" name="currency" defaultValue="YER">{CURRENCIES.map((c) => <option key={c} value={c}>{labels[`cur.${c}`]}</option>)}</select>
      </div>
      <div className="field field--full"><label htmlFor={`${id}-tx`}>{labels.transferRef}</label><input id={`${id}-tx`} className="input" name="transferRef" maxLength={100} dir="auto" autoComplete="off" /></div>
      <div className="field field--full"><label htmlFor={`${id}-note`}>{labels.note}</label><textarea id={`${id}-note`} className="textarea" name="note" maxLength={1000} /></div>
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <Submit busy={busy} label={labels.send as string} error={error} />
    </form>
  );
}

export function PledgeForm({ lang, labels, privacyHref }: { lang: string; labels: Labels; privacyHref: string }) {
  const form = usePrefill();
  const { busy, error, done, onSubmit } = useRequest('pledge', lang, labels, (d) => ({ anonymous: d.get('anonymous') === 'on' }));
  if (done) {
    return (
      <Done labels={labels} reference={done.reference}>
        {done.reference ? <p><a className="btn btn--gold btn--sm" href="#receipt">{labels.receiptNow}</a></p> : null}
      </Done>
    );
  }
  return (
    <form ref={form} onSubmit={onSubmit} className="form-grid">
      <ContactFields labels={labels} />
      <div className="field"><label htmlFor="pl-amount">{labels.amount}</label><input id="pl-amount" className="input" type="number" name="amount" min="1" step="any" inputMode="decimal" dir="ltr" aria-describedby="pl-amount-hint" /><span className="field__hint" id="pl-amount-hint">{labels.amountHint}</span></div>
      <div className="field"><label htmlFor="pl-currency">{labels.currency}</label>
        <select id="pl-currency" className="select" name="currency" defaultValue="USD">{CURRENCIES.map((c) => <option key={c} value={c}>{labels[`cur.${c}`]}</option>)}</select>
      </div>
      <div className="field field--full"><label htmlFor="pl-purpose">{labels.purpose}</label><input id="pl-purpose" className="input" name="purpose" maxLength={200} /></div>
      <div className="field field--full"><label htmlFor="pl-note">{labels.note}</label><textarea id="pl-note" className="textarea" name="note" maxLength={2000} /></div>
      <label className="check field--full"><input type="checkbox" name="anonymous" /><span>{labels.anonymous}</span></label>
      <Consent labels={labels} privacyHref={privacyHref} />
      <Submit busy={busy} label={labels.send as string} error={error} />
    </form>
  );
}

export function VolunteerForm({ lang, labels, privacyHref }: { lang: string; labels: Labels; privacyHref: string }) {
  const form = usePrefill();
  // FormData keeps only the last of several same-named boxes in Object.fromEntries; the route answers «areas» when none is ticked
  const { busy, error, done, onSubmit } = useRequest('volunteer', lang, labels, (d) => ({ areas: d.getAll('areas') }));
  if (done) return <Done labels={labels} reference={done.reference} />;
  return (
    <form ref={form} onSubmit={onSubmit} className="form-grid">
      <ContactFields labels={labels} />
      <div className="field"><label htmlFor="v-city">{labels.city}</label><input id="v-city" className="input" name="city" maxLength={120} autoComplete="address-level2" /></div>
      <fieldset className="field field--full check-group">
        <legend>{labels.areas}</legend>
        {VOLUNTEER_AREAS.map((a) => <label key={a} className="check"><input type="checkbox" name="areas" value={a} /><span>{labels[`area.${a}`]}</span></label>)}
      </fieldset>
      <div className="field field--full"><label htmlFor="v-avail">{labels.availability}</label><input id="v-avail" className="input" name="availability" maxLength={200} /></div>
      <div className="field field--full"><label htmlFor="v-exp">{labels.experience}</label><textarea id="v-exp" className="textarea" name="experience" required minLength={10} maxLength={3000} /></div>
      <Consent labels={labels} privacyHref={privacyHref} />
      <Submit busy={busy} label={labels.send as string} error={error} />
    </form>
  );
}

function ReceiptDone({ labels, onAnother }: { labels: Labels; onAnother: () => void }) {
  const ref = useFocusOnShow<HTMLDivElement>();
  return (
    <div className="notice notice--ok" role="status" tabIndex={-1} ref={ref}>
      <p>{labels.done}</p>
      <button type="button" className="btn btn--secondary btn--sm" onClick={onAnother}>{labels.another}</button>
    </div>
  );
}
