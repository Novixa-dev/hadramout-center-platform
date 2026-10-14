'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '../Icon.tsx';

/** Click-to-load YouTube player: no third-party request and no cookies until the visitor presses play. */
export function VideoFacade({ youtubeId, title, label, poster }: { youtubeId: string; title: string; label: string; poster?: string | null }) {
  const [on, setOn] = useState(false);
  return (
    <div className="video-facade">
      {on ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`} title={title} allow="autoplay; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`${label}: ${title}`}>
          {poster ? <Image src={poster} alt="" fill sizes="(max-width: 900px) 100vw, 800px" style={{ objectFit: 'cover', opacity: 0.85 }} /> : null}
          <span className="play"><Icon name="play" className="icon" /></span>
        </button>
      )}
    </div>
  );
}
