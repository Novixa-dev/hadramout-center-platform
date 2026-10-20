'use client';
import { useEffect } from 'react';

/** Registers the offline service worker (production only; needs https or localhost). Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const register = () => void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
