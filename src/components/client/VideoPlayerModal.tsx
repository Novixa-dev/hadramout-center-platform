'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../Icon.tsx';

interface VideoPlayerModalProps {
  youtubeId?: string | null;
  videoUrl: string;
  title: string;
  label: string;
  closeLabel?: string;
}

export function VideoPlayerModal({
  youtubeId,
  videoUrl,
  title,
  label,
  closeLabel = 'إغلاق',
}: VideoPlayerModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOpen = () => {
    if (youtubeId && ref.current) {
      setIsPlaying(true);
      ref.current.showModal();
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    ref.current?.close();
  };

  if (!youtubeId) {
    return (
      <Link href={videoUrl} className="video-card-v2__play-btn" aria-label={`${label}: ${title}`}>
        <span className="video-card-v2__play-disc">
          <svg viewBox="0 0 24 24" fill="currentColor" className="video-card-v2__play-icon" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="video-card-v2__play-btn"
        onClick={handleOpen}
        aria-label={`${label}: ${title}`}
      >
        <span className="video-card-v2__play-disc">
          <svg viewBox="0 0 24 24" fill="currentColor" className="video-card-v2__play-icon" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
      </button>

      <dialog
        ref={ref}
        className="dlg video-modal-dlg"
        aria-label={title}
        onClick={(e) => e.target === ref.current && handleClose()}
        onClose={() => setIsPlaying(false)}
      >
        <div className="dlg__head">
          <h2 className="video-modal-title">{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            aria-label={closeLabel}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="video-modal-frame-wrap">
          {isPlaying ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="video-modal-iframe"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
