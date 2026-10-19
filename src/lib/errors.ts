/**
 * Payload throws an APIError for a document that does not exist (404) or that the visitor may not read, e.g. an
 * unpublished draft (403). Both mean "no such page" to the public; anything else is a real failure that must not be
 * rendered as a 404 (it would be cached and read by crawlers as "gone").
 */
export function isNotFound(err: unknown): boolean {
  const status = typeof err === 'object' && err !== null ? (err as { status?: unknown }).status : undefined;
  return status === 404 || status === 403;
}

/** Ids come from the URL; values beyond SQLite's 32-bit row ids can never exist, so they are "not found", not errors. */
export const isPlausibleId = (id: number): boolean => Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647;
