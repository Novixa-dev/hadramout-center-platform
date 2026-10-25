'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function HeaderScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const update = () => {
      const header = document.querySelector('.site-header');
      if (!header) return;
      const hero = document.querySelector('.hero-custom');
      const headerH = (header as HTMLElement).offsetHeight || 80;
      const isPast = hero
        ? hero.getBoundingClientRect().bottom <= headerH
        : window.scrollY > 40;
      header.classList.toggle('site-header--scrolled', isPast);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  return null;
}
