'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icon.tsx';

interface Props {
  id: number;
  title: string;
  when: string | null;
  href: string;
  labels: { kicker: string; more: string; close: string };
}

const KEY = 'hc-announcement-closed';

/**
 * The pinned announcement above the header, until it expires (the server stops sending it). Closing hides this one
 * announcement for the visitor (remembered in the browser); a new pinned announcement shows again.
 */
export function AnnouncementBanner({ id, title, when, href, labels }: Props) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === String(id)) setClosed(true);
    } catch {
      // storage blocked: the banner simply stays
    }
  }, [id]);
  if (closed) return null;

  const close = () => {
    setClosed(true);
    try {
      localStorage.setItem(KEY, String(id));
    } catch {
      // storage blocked: closed for this page view only
    }
  };

  return (
    <aside className="announce-bar no-print" aria-label={labels.kicker}>
      <div className="container announce-bar__row">
        <span className="announce-bar__kicker"><Icon name="info" /> {labels.kicker}</span>
        <Link className="announce-bar__text" href={href}>
          <strong>{title}</strong>
          {when ? <span className="announce-bar__when">{when}</span> : null}
          <span className="announce-bar__more">{labels.more}</span>
        </Link>
        <button type="button" className="icon-btn announce-bar__close" onClick={close} aria-label={labels.close}>
          <Icon name="close" />
        </button>
      </div>
    </aside>
  );
}
