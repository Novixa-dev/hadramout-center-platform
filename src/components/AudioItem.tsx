import type { Ctx } from '../lib/ctx.ts';
import type { AudioDoc } from '../lib/data.ts';
import { formatDate } from '../lib/dates.ts';
import { isAudioFile, mediaUrl, safeHref } from '../lib/media-links.ts';
import { sanitizeBody } from '../lib/sanitize.ts';
import { Icon } from './Icon.tsx';

interface Part {
  title: string;
  url: string;
}

/** The playable parts of a recording: the main file or link, then each extra clip (file or link), in order. */
function partsOf(item: AudioDoc, ctx: Ctx): Part[] {
  const parts: Part[] = [];
  const main = mediaUrl(item.audioFile) ?? safeHref(item.audioUrl);
  if (main) parts.push({ title: item.title, url: main });
  for (const [i, c] of (item.clips ?? []).entries()) {
    const url = mediaUrl(c.file) ?? safeHref(c.url);
    if (url) parts.push({ title: c.title || ctx.t('audio.part', { n: i + 1 }), url });
  }
  return parts;
}

/** One recording (library item or podcast episode): cover, details, a player per audio file, links for the rest. */
export function AudioItem({ ctx, item }: { ctx: Ctx; item: AudioDoc }) {
  const { t } = ctx;
  const cover = mediaUrl(item.cover);
  const parts = partsOf(item, ctx);
  const headingId = `audio-${item.id}`;
  return (
    <article className="media-item" id={headingId} aria-labelledby={`${headingId}-h`}>
      {cover ? <img className="media-item__cover" src={cover} alt="" loading="lazy" width={160} height={160} /> : null}
      <div className="media-item__body">
        {item.series === 'saqaya' && item.episode ? <p className="kicker">{t('podcast.episode', { n: item.episode })}</p> : item.program ? <p className="kicker">{item.program}</p> : null}
        <h2 id={`${headingId}-h`} className="media-item__title">{item.title}</h2>
        <p className="media-item__meta">
          {item.presenter ? <span><Icon name="user" /> {item.presenter}</span> : null}
          {item.duration ? <span><Icon name="clock" /> {item.duration}</span> : null}
          {item.publishedAt ? <span><Icon name="calendar" /> {formatDate(item.publishedAt, ctx.lang.tag)}</span> : null}
        </p>
        {item.excerpt ? <p className="media-item__excerpt">{item.excerpt}</p> : null}
        {parts.length ? (
          <ol className="media-item__parts">
            {parts.map((p) => (
              <li key={p.url}>
                {parts.length > 1 ? <span className="media-item__part-title">{p.title}</span> : null}
                {isAudioFile(p.url) || p.url.startsWith('/') ? (
                  <audio controls preload="none" src={p.url}>
                    <a href={p.url}>{t('audio.listen')}</a>
                  </audio>
                ) : (
                  <a className="btn btn--ghost btn--sm" href={p.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="external" /> {t('audio.openExternal')}
                  </a>
                )}
              </li>
            ))}
          </ol>
        ) : null}
        {item.body ? (
          <details className="media-item__transcript">
            <summary>{t('audio.transcript')}</summary>
            <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeBody(item.body) }} />
          </details>
        ) : null}
      </div>
    </article>
  );
}
