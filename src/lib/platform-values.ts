/** Option lists shared by the server (validation, admin) and the browser forms. No imports: this file is safe in client bundles. */

export const CURRENCIES = ['YER', 'SAR', 'USD', 'AED'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const VOLUNTEER_AREAS = ['documents', 'digitization', 'research', 'translation', 'events', 'media', 'other'] as const;
export type VolunteerArea = (typeof VOLUNTEER_AREAS)[number];

export const MAX_QUANTITY = 20;
export const MAX_ORDER_LINES = 30;
export const PASSWORD_MIN = 10;

/** A payment receipt is a photo or screenshot: phone pictures are 2–6 MB. The proxy buffers at most 10 MB of a request body. */
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp';
/** One request rarely needs more than a transfer and a correction; the cap keeps a known reference from filling the disk. */
export const MAX_RECEIPTS_PER_REQUEST = 5;
/** HC-O-2026-7F3K9Q (order) or HC-D-2026-… (donation pledge): the only requests that are paid for. */
export const PAYABLE_REFERENCE = /^HC-[OD]-\d{4}-[A-HJKMNP-Z2-9]{6}$/;
