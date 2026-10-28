'use client';
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  locale?: string;
  duration?: number;
}

export function AnimatedCounter({ value, locale = 'ar', duration = 2000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || hasAnimated.current) return;

    let rafId: number;
    let timerId: NodeJS.Timeout;

    const startAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      // Small 120ms pause so the initial '0' is perceptible before numbers count up
      timerId = setTimeout(() => {
        const start = 0;
        const end = value;
        const startTime = performance.now();

        const step = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Smooth easeOutCubic curve for highly visible rolling digits and gentle landing
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(start + (end - start) * ease);

          setDisplayValue(current);

          if (progress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            setDisplayValue(end);
          }
        };

        rafId = requestAnimationFrame(step);
      }, 120);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: '0px 0px -20px 0px' }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        clearTimeout(timerId);
        cancelAnimationFrame(rafId);
      };
    } else {
      startAnimation();
    }
  }, [value, duration]);

  const formatter = new Intl.NumberFormat(locale);

  return (
    <span
      ref={elementRef}
      className="animated-counter"
      aria-label={String(value)}
      suppressHydrationWarning
    >
      {formatter.format(displayValue)}
    </span>
  );
}
