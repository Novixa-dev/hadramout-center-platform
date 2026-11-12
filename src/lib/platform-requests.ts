import { randomBytes } from 'node:crypto';
import { sanitizeLines, sanitizeText } from './sanitize.ts';
import { CURRENCIES, MAX_ORDER_LINES, MAX_QUANTITY, PAYABLE_REFERENCE, VOLUNTEER_AREAS, type Currency, type VolunteerArea } from './platform-values.ts';

/**
 * Validation of what visitors send to the platforms (orders, donation pledges, volunteer applications, accounts).
 * Pure functions: they only read the submitted values and return clean ones. No request here moves money: an order or a pledge
 * is recorded for the Center's staff, who answer with availability, price and how to pay.
 */

export const STORE_STATUSES = ['on_request', 'available', 'out_of_stock', 'hidden'] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];
/** A status a visitor can still order. Empty means the book predates the field: same as «on request». */
export const canOrder = (status: unknown): boolean => status === undefined || status === null || status === 'on_request' || status === 'available';

export { CURRENCIES, VOLUNTEER_AREAS, MAX_ORDER_LINES, MAX_QUANTITY };
export type { Currency, VolunteerArea };

export const MAX_AMOUNT = 1_000_000_000;
export const MAX_SAVED_ITEMS = 500;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s()-]{5,39}$/;

export type Raw = Record<string, unknown>;
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** Cut before cleaning: parsing a huge string costs time on the one event loop, and only the first `max` characters can survive anyway. */
export const cleanText = (v: unknown, max: number): string => (typeof v === 'string' ? sanitizeText(v.slice(0, max * 4)).slice(0, max) : '');
const text = cleanText;
/** cleanText for fields people write on several lines (an address, a note): the line breaks are kept. */
export const cleanLines = (v: unknown, max: number): string => (typeof v === 'string' ? sanitizeLines(v.slice(0, max * 4)).slice(0, max) : '');
const lines = cleanLines;

export const normalizeEmail = (v: unknown): string => text(v, 200).toLowerCase();
export const isEmail = (v: string): boolean => EMAIL.test(v);
export const isPhone = (v: string): boolean => PHONE.test(v);

/** An unguessable reference a visitor can quote to the Center: HC-O-2026-7F3K9Q (no I, L, O, 0 or 1 to misread). */
export function makeReference(prefix: 'O' | 'D' | 'V', now = new Date()): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const code = [...randomBytes(6)].map((b) => alphabet[b % alphabet.length]).join('');
  return `HC-${prefix}-${now.getUTCFullYear()}-${code}`;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
}

/** Name, a way to reach the person, and consent to keep the data: common to every request. */
function contact(b: Raw): Parsed<Contact> {
  const name = text(b.name, 120);
  const email = normalizeEmail(b.email);
  const phone = text(b.phone, 40);
  if (name.length < 2) return { ok: false, error: 'name' };
  if (!isEmail(email)) return { ok: false, error: 'email' };
  if (phone && !isPhone(phone)) return { ok: false, error: 'phone' };
  if (b.consent !== true) return { ok: false, error: 'consent' };
  return { ok: true, value: { name, email, phone } };
}

/** An optional amount with its currency, as a pledge or a receipt states it: both or neither. */
function amountOf(b: Raw): Parsed<{ amount: number | null; currency: Currency | null }> {
  const given = b.amount === undefined || b.amount === null || b.amount === '' ? null : Number(b.amount);
  if (given === null) return { ok: true, value: { amount: null, currency: null } };
  if (!Number.isFinite(given) || given <= 0 || given > MAX_AMOUNT) return { ok: false, error: 'amount' };
  const currency = (CURRENCIES as readonly unknown[]).includes(b.currency) ? (b.currency as Currency) : null;
  if (!currency) return { ok: false, error: 'currency' };
  return { ok: true, value: { amount: Math.round(given * 100) / 100, currency } };
}

export interface OrderRequest extends Contact {
  address: string;
  note: string;
  items: { book: number; quantity: number }[];
}

export function parseOrder(b: Raw): Parsed<OrderRequest> {
  const c = contact(b);
  if (!c.ok) return c;
  if (!c.value.phone) return { ok: false, error: 'phone' };
  const address = lines(b.address, 500);
  if (address.length < 5) return { ok: false, error: 'address' };
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > MAX_ORDER_LINES) return { ok: false, error: 'items' };
  const quantities = new Map<number, number>();
  for (const line of b.items as Raw[]) {
    const book = line?.book;
    const quantity = line?.quantity;
    if (!Number.isSafeInteger(book) || (book as number) <= 0) return { ok: false, error: 'items' };
    if (!Number.isSafeInteger(quantity) || (quantity as number) < 1 || (quantity as number) > MAX_QUANTITY) return { ok: false, error: 'items' };
    quantities.set(book as number, Math.min(MAX_QUANTITY, (quantities.get(book as number) ?? 0) + (quantity as number)));
  }
  return { ok: true, value: { ...c.value, address, note: lines(b.note, 2000), items: [...quantities].map(([book, quantity]) => ({ book, quantity })) } };
}

export interface PledgeRequest extends Contact {
  amount: number | null;
  currency: Currency | null;
  purpose: string;
  anonymous: boolean;
  note: string;
}

export function parsePledge(b: Raw): Parsed<PledgeRequest> {
  const c = contact(b);
  if (!c.ok) return c;
  const money = amountOf(b);
  if (!money.ok) return money;
  return {
    ok: true,
    value: {
      ...c.value,
      ...money.value,
      purpose: text(b.purpose, 200),
      anonymous: b.anonymous === true,
      note: lines(b.note, 2000),
    },
  };
}

export interface VolunteerRequest extends Contact {
  city: string;
  areas: VolunteerArea[];
  availability: string;
  experience: string;
}

export function parseVolunteer(b: Raw): Parsed<VolunteerRequest> {
  const c = contact(b);
  if (!c.ok) return c;
  const areas = Array.isArray(b.areas) ? VOLUNTEER_AREAS.filter((a) => (b.areas as unknown[]).includes(a)) : [];
  if (areas.length === 0) return { ok: false, error: 'areas' };
  const experience = lines(b.experience, 3000);
  if (experience.length < 10) return { ok: false, error: 'experience' };
  return { ok: true, value: { ...c.value, city: text(b.city, 120), areas, availability: text(b.availability, 200), experience } };
}

export interface ReceiptRequest {
  reference: string;
  kind: 'order' | 'pledge';
  email: string;
  amount: number | null;
  currency: Currency | null;
  transferRef: string;
  note: string;
}

/** The text fields sent with a receipt photo. The reference and email must match a request; the route checks that against the database. */
export function parseReceipt(b: Raw): Parsed<ReceiptRequest> {
  const reference = text(b.reference, 40).toUpperCase().replace(/\s+/g, '');
  if (!PAYABLE_REFERENCE.test(reference)) return { ok: false, error: 'reference' };
  const email = normalizeEmail(b.email);
  if (!isEmail(email)) return { ok: false, error: 'email' };
  const money = amountOf(b);
  if (!money.ok) return money;
  return {
    ok: true,
    value: {
      reference,
      kind: reference.startsWith('HC-O-') ? 'order' : 'pledge',
      email,
      ...money.value,
      transferRef: text(b.transferRef, 100),
      note: lines(b.note, 1000),
    },
  };
}

export type ImageKind = 'jpeg' | 'png' | 'webp' | 'heic' | null;

/** What the file really is, read from its first bytes: the browser's type and the file name are the sender's word only. */
export function sniffImage(head: Uint8Array): ImageKind {
  const at = (i: number, ...bytes: number[]) => bytes.every((b, j) => head[i + j] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return 'jpeg';
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'png';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'webp';
  // iPhone photos: an ISO box `ftyp` with a HEIF brand. Named so the visitor can be told what to do, never decoded.
  if (at(4, 0x66, 0x74, 0x79, 0x70)) {
    const brand = String.fromCharCode(...head.slice(8, 12));
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif'].includes(brand)) return 'heic';
  }
  return null;
}

export interface SavedItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

/**
 * A reading list sent back from a browser. It is rendered as links later, so only same-site paths survive:
 * `//host`, `/\host`, `javascript:` and anything else that could leave the site are dropped.
 */
export function parseSavedItems(v: unknown): SavedItem[] | null {
  if (!Array.isArray(v) || v.length > MAX_SAVED_ITEMS) return null;
  const seen = new Set<string>();
  const out: SavedItem[] = [];
  for (const raw of v as Raw[]) {
    const id = text(raw?.id, 80);
    const title = text(raw?.title, 300);
    const url = typeof raw?.url === 'string' ? raw.url.slice(0, 300) : '';
    const type = text(raw?.type, 20);
    if (!id || !title || !/^\/(?![/\\])[^\s\\]*$/.test(url) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, title, url, type });
  }
  return out;
}
