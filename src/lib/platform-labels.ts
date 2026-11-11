import type { Ctx } from './ctx.ts';
import { CURRENCIES, VOLUNTEER_AREAS } from './platform-values.ts';

/** The strings the platform forms need in the browser, looked up on the server so client bundles stay free of message files. */

const ERRORS = ['failed', 'limit', 'name', 'email', 'phone', 'consent', 'address', 'items', 'unavailable', 'amount', 'currency', 'areas', 'experience', 'invalid', 'exists', 'weak', 'password', 'unauthorized', 'reference', 'notfound', 'closed', 'tooMany', 'file', 'heic', 'size', 'large'];

export function formLabels(ctx: Ctx): Record<string, string> {
  const { t } = ctx;
  const out: Record<string, string> = {
    name: t('forms.name'),
    email: t('forms.email'),
    phone: t('forms.phone'),
    phoneOptional: t('forms.phoneOptional'),
    consent: t('forms.consent'),
    privacy: t('forms.privacy'),
    done: t('forms.done'),
    reference: t('forms.reference'),
    send: t('forms.send'),
    note: t('forms.note'),
  };
  for (const code of ERRORS) out[`err.${code}`] = t(`forms.err.${code}`);
  return out;
}

export const storeLabels = (ctx: Ctx): Record<string, string> => ({
  ...formLabels(ctx),
  send: ctx.t('store.send'),
  done: ctx.t('store.done'),
  cartEmpty: ctx.t('store.cartEmpty'),
  browse: ctx.t('store.browse'),
  quantity: ctx.t('store.quantity'),
  remove: ctx.t('store.remove'),
  address: ctx.t('store.address'),
  receiptLater: ctx.t('receipt.later'),
});

export function pledgeLabels(ctx: Ctx): Record<string, string> {
  const { t } = ctx;
  const out: Record<string, string> = {
    ...formLabels(ctx),
    send: t('donate.send'),
    done: t('donate.done'),
    amount: t('donate.amount'),
    amountHint: t('donate.amountHint'),
    currency: t('donate.currency'),
    purpose: t('donate.purpose'),
    anonymous: t('donate.anonymous'),
    receiptNow: t('receipt.now'),
  };
  for (const c of CURRENCIES) out[`cur.${c}`] = t(`forms.cur.${c}`);
  return out;
}

/** The payment-receipt form on the store and donation pages. */
export function receiptLabels(ctx: Ctx): Record<string, string> {
  const { t } = ctx;
  const out: Record<string, string> = {
    ...formLabels(ctx),
    email: t('receipt.email'),
    referenceHint: t('receipt.referenceHint'),
    file: t('receipt.file'),
    fileHint: t('receipt.fileHint'),
    amount: t('receipt.amount'),
    currency: t('donate.currency'),
    transferRef: t('receipt.transferRef'),
    send: t('receipt.send'),
    done: t('receipt.done'),
    another: t('receipt.another'),
    chosen: t('receipt.chosen'),
  };
  for (const c of CURRENCIES) out[`cur.${c}`] = t(`forms.cur.${c}`);
  return out;
}

export function volunteerLabels(ctx: Ctx): Record<string, string> {
  const { t } = ctx;
  const out: Record<string, string> = {
    ...formLabels(ctx),
    send: t('volunteer.send'),
    done: t('volunteer.done'),
    city: t('volunteer.city'),
    areas: t('volunteer.areas'),
    availability: t('volunteer.availability'),
    experience: t('volunteer.experience'),
  };
  for (const a of VOLUNTEER_AREAS) out[`area.${a}`] = t(`volunteer.area.${a}`);
  return out;
}

export function accountLabels(ctx: Ctx): Record<string, string> {
  const { t } = ctx;
  return {
    ...formLabels(ctx),
    loginTitle: t('account.loginTitle'),
    registerTitle: t('account.registerTitle'),
    login: t('account.login'),
    register: t('account.register'),
    password: t('account.password'),
    passwordHint: t('account.passwordHint', { n: 10 }),
    noAccount: t('account.noAccount'),
    haveAccount: t('account.haveAccount'),
    forgot: t('account.forgot'),
    saveChanges: t('account.saveChanges'),
    saved: t('account.saved'),
    currentPassword: t('account.currentPassword'),
    newPassword: t('account.newPassword'),
    changePassword: t('account.changePassword'),
    passwordChanged: t('account.passwordChanged'),
    savedBackup: t('account.savedBackup'),
    savedRestore: t('account.savedRestore'),
    savedBackedUp: t('account.savedBackedUp'),
    savedRestored: t('account.savedRestored'),
    deleteTitle: t('account.deleteTitle'),
    deleteNote: t('account.deleteNote'),
    deleteConfirm: t('account.deleteConfirm'),
  };
}
