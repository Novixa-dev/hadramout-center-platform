'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import aosPkg from 'aos';
import 'aos/dist/aos.css';

export function AOSInit() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const AOS = (aosPkg as any).default ?? aosPkg;
      if (typeof AOS?.init === 'function') {
        AOS.init({
          duration: 650,
          easing: 'ease-out-cubic',
          once: true,
          offset: 50,
          delay: 50,
        });
        AOS.refresh();
      }
    } catch {
      // Graceful fallback if AOS encounters any DOM issue
    }
  }, [pathname]);

  return null;
}
