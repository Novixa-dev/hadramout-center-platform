import type { Page } from '../../payload-types.ts';
import { VideoFacade } from '../client/VideoFacade.tsx';

type MediaEmbedProps = Extract<NonNullable<Page['blocks']>[number], { blockType: 'mediaEmbed' }>;

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1]! : null;
}

export function MediaEmbedBlock({ title, videoUrl, audioUrl, transcript }: MediaEmbedProps) {
  const ytId = videoUrl ? extractYouTubeId(videoUrl) : null;

  return (
    <section className="container--narrow section" style={{ paddingBlock: 'var(--space-6)' }}>
      {title ? <h2 style={{ fontSize: 'var(--step-2)', marginBlockEnd: 'var(--space-4)' }}>{title}</h2> : null}
      {ytId ? (
        <VideoFacade youtubeId={ytId} title={title || 'فيديو'} label="تشغيل الفيديو" />
      ) : videoUrl ? (
        <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: '#000' }}>
          <video src={videoUrl} controls style={{ inlineSize: '100%', blockSize: 'auto', display: 'block' }}>
            <track kind="captions" />
          </video>
        </div>
      ) : null}
      {audioUrl ? (
        <div style={{ marginBlockStart: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
          <audio controls src={audioUrl} style={{ inlineSize: '100%' }}>
            <track kind="captions" />
          </audio>
        </div>
      ) : null}
      {transcript ? (
        <details style={{ marginBlockStart: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>التفريغ المكتوب أو نبذة</summary>
          <div className="prose" style={{ marginBlockStart: 'var(--space-3)' }} dangerouslySetInnerHTML={{ __html: transcript }} />
        </details>
      ) : null}
    </section>
  );
}
