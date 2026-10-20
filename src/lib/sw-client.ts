/** Messages the page sends to the service worker (public/sw.js) so saved articles stay readable offline. */
export type SwMessage = { type: 'save' | 'unsave'; url: string };

/** Fire-and-forget; silently does nothing when service workers are unavailable (http, private mode, old browsers). */
export function tellServiceWorker(message: SwMessage): void {
  try {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage(message)).catch(() => undefined);
  } catch {
    /* offline support is an enhancement only */
  }
}

/** The list page of the visitor's language, cached together with the first saved article so it opens offline too. */
export const savedPageOf = (articleUrl: string): string | null => {
  const lang = articleUrl.split('/')[1];
  return lang && /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/.test(lang) ? `/${lang}/saved` : null;
};
