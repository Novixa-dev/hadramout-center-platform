import { typeFromRoute } from '../../../../../../lib/content-types.ts';
import { getAnnouncement, getDoc } from '../../../../../../lib/data.ts';
import { absolute } from '../../../../../../lib/ctx.ts';
import { icsFile, type CalendarEntry } from '../../../../../../lib/calendar.ts';
import { isPlausibleId } from '../../../../../../lib/errors.ts';

export const dynamic = 'force-dynamic';

const notFound = () => new Response('Not found', { status: 404 });

function respond(entry: CalendarEntry, filename: string) {
  return new Response(icsFile(entry), {
    headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${filename}.ics"`, 'cache-control': 'public, max-age=3600' },
  });
}

/** /api/hc/ics/{events|forum|announcements}/{id}.ics — an all-day calendar entry for a published event or announcement. */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const n = Number(id.replace(/\.ics$/i, ''));
  if (!isPlausibleId(n)) return notFound();
  const asked = new URL(req.url).searchParams.get('lang') ?? 'ar';
  const lang = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(asked) ? asked : 'ar';
  const host = new URL(absolute('')).host;

  if (kind === 'announcements') {
    const doc = await getAnnouncement(n, lang);
    if (!doc?.eventDate) return notFound();
    const url = absolute(`/${lang}/announcements#announcement-${n}`);
    return respond({ uid: `announcement-${n}`, host, title: doc.title, start: doc.eventDate, location: doc.venue ?? undefined, url }, `announcement-${n}`);
  }

  const info = typeFromRoute(kind);
  if (!info || (info.type !== 'event' && info.type !== 'forum')) return notFound();
  const doc = await getDoc(info.type, n, lang);
  const start = doc?.eventDate as string | undefined;
  if (!doc || !start) return notFound();
  const url = absolute(`/${lang}/${info.route}/${n}`);
  const description = [doc.speaker, doc.timeText].filter(Boolean).join('\n');
  return respond(
    { uid: `${info.route}-${n}`, host, title: doc.title, start, end: (doc.endDate as string | undefined) ?? undefined, location: doc.venue ? String(doc.venue) : undefined, description: description || undefined, url },
    `${info.route}-${n}`,
  );
}
