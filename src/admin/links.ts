/** `where` as the admin list understands it in the URL (`?where[status][equals]=pending`). */
export function listUrl(slug: string, where: Record<string, Record<string, string>> = {}): string {
  const q = Object.entries(where)
    .flatMap(([field, ops]) => Object.entries(ops).map(([op, v]) => `where[${field}][${op}]=${encodeURIComponent(v)}`))
    .join('&');
  return `/admin/collections/${slug}${q ? `?${q}` : ''}`;
}
