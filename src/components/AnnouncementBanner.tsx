'use client';
import { useState } from 'react';
import type { AnnouncementDoc } from '../lib/data.ts';
import { Icon } from './Icon.tsx';

interface Props {
  announcements: AnnouncementDoc[];
  calendarLabel: string;
  closeLabel: string;
}

export function AnnouncementBanner({ announcements, calendarLabel, closeLabel }: Props) {
  const [closed, setClosed] = useState(false);

  if (closed || !announcements.length) return null;

  const current = announcements[0];
  if (!current) return null;

  return (
    <aside
      className="announcement-banner no-print"
      aria-label={current.title}
      style={{
        backgroundColor: 'var(--brand-fill, #1a2e26)',
        color: '#ffffff',
        paddingBlock: 'var(--space-2, 0.5rem)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.4)',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2, 0.5rem)',
          fontSize: 'var(--step--1, 0.9rem)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 auto' }}>
          <span
            style={{
              backgroundColor: 'var(--gold, #d4af37)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
              textTransform: 'uppercase',
            }}
          >
            <Icon name="info" />
          </span>
          <strong style={{ fontWeight: 600 }}>{current.title}</strong>
          {current.eventDate ? (
            <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>
              ({current.eventDate.slice(0, 10)})
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {current.eventDate ? (
            <a
              href={`/api/hc/ics/announcements/${current.id}.ics`}
              className="btn btn--secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Icon name="calendar" /> {calendarLabel}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label={closeLabel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Icon name="close" />
          </button>
        </div>
      </div>
    </aside>
  );
}
