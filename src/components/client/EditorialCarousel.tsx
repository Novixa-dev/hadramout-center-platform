'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '../Icon.tsx';

export interface EditorialCarouselProps {
  id: string;
  isRtl: boolean;
  theme?: 'light' | 'dark';
  badge?: {
    label: string;
    icon?: 'layers' | 'bookmark' | 'book' | 'rosette' | 'manuscript';
  };
  title: string;
  description: string;
  viewAll?: {
    href: string;
    label: string;
  };
  prevLabel?: string;
  nextLabel?: string;
  children: ReactNode;
  className?: string;
}

export function EditorialCarousel({
  id,
  isRtl,
  theme = 'light',
  badge,
  title,
  description,
  viewAll,
  prevLabel,
  nextLabel,
  children,
  className = '',
}: EditorialCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [progress, setProgress] = useState(0);

  const updateBounds = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 8) {
      setCanPrev(false);
      setCanNext(false);
      setProgress(1);
      return;
    }
    const current = Math.abs(el.scrollLeft);
    setCanPrev(current > 8);
    setCanNext(current < maxScroll - 8);
    setProgress(Math.min(1, Math.max(0, current / maxScroll)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateBounds();

    el.addEventListener('scroll', updateBounds, { passive: true });
    window.addEventListener('resize', updateBounds, { passive: true });

    return () => {
      el.removeEventListener('scroll', updateBounds);
      window.removeEventListener('resize', updateBounds);
    };
  }, [updateBounds]);

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>(':scope > *');
    const step = card ? card.offsetWidth + 24 : Math.round(el.clientWidth * 0.75);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReduced ? 'instant' : 'smooth';

    // In RTL, "next" advances into negative scrollLeft (to the left),
    // and "prev" returns towards 0 (to the right).
    // In LTR, "next" advances into positive scrollLeft (to the right),
    // and "prev" returns towards 0 (to the left).
    const delta = isRtl
      ? direction === 'next' ? -step : step
      : direction === 'next' ? step : -step;

    el.scrollBy({ left: delta, behavior });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      if (isRtl) handleScroll('prev');
      else handleScroll('next');
    } else if (e.key === 'ArrowLeft') {
      if (isRtl) handleScroll('next');
      else handleScroll('prev');
    }
  };

  const pLabel = prevLabel ?? (isRtl ? 'السابق' : 'Previous');
  const nLabel = nextLabel ?? (isRtl ? 'التالي' : 'Next');

  return (
    <div
      className={`editorial-carousel editorial-carousel--${theme} ${className}`}
      id={id}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="editorial-carousel__head">
        <div className="editorial-carousel__lead">
          {badge ? (
            <div className="editorial-carousel__badge">
              {badge.icon ? <Icon name={badge.icon} className="editorial-carousel__badge-icon" /> : null}
              <span>{badge.label}</span>
            </div>
          ) : null}
          <h2 id={`${id}-title`} className="editorial-carousel__title">
            {title}
          </h2>
          {description ? (
            <p className="editorial-carousel__desc">{description}</p>
          ) : null}
        </div>

        <div className="editorial-carousel__controls-wrapper">
          {viewAll ? (
            <Link href={viewAll.href} className="editorial-carousel__view-all">
              <span>{viewAll.label}</span>
              <Icon name="arrow" className="editorial-carousel__view-all-icon" />
            </Link>
          ) : null}

          <div className="editorial-carousel__nav-btns" role="group" aria-label={title}>
            <button
              type="button"
              className="editorial-carousel__nav-btn editorial-carousel__nav-btn--prev"
              onClick={() => handleScroll('prev')}
              disabled={!canPrev}
              aria-label={pLabel}
              title={pLabel}
            >
              {/* Chevron pointing backwards: right in RTL, left in LTR */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isRtl ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
              </svg>
            </button>
            <button
              type="button"
              className="editorial-carousel__nav-btn editorial-carousel__nav-btn--next"
              onClick={() => handleScroll('next')}
              disabled={!canNext}
              aria-label={nLabel}
              title={nLabel}
            >
              {/* Chevron pointing forwards: left in RTL, right in LTR */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isRtl ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="editorial-carousel__track"
        tabIndex={0}
        role="region"
        aria-labelledby={`${id}-title`}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>

      <div className="editorial-carousel__progress-wrap" aria-hidden="true">
        <div
          className="editorial-carousel__progress-bar"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: isRtl ? 'right' : 'left',
          }}
        />
      </div>
    </div>
  );
}
