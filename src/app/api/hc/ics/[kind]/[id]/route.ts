import { typeFromRoute } from '../../../../../../lib/content-types.ts';
import { getDoc } from '../../../../../../lib/data.ts';
import { absolute } from '../../../../../../lib/ctx.ts';
import { getPayloadClient } from '../../../../../../lib/runtime.ts';

export const dynamic = 'force-dynamic';

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
/** Lines longer than 75 octets must be folded. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 74) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}
const ymd = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

/** /api/hc/ics/{events|forum|announcements}/{id}.ics — an all-day calendar entry for an event or announcement. */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const n = Number(id.replace(/\.ics$/i, ''));
  if (!Number.isInteger(n) || n < 1) return new Response('Not found', { status: 404 });
  const lang = new URL(req.url).searchParams.get('lang') ?? 'ar';

  if (kind === 'announcements') {
    const payload = await getPayloadClient();
    try {
      const doc = (await payload.findByID({
        collection: 'announcements',
        id: n,
        depth: 0,
        overrideAccess: true,
      })) as { title?: string; eventDate?: string; excerpt?: string; venue?: string } | null;
      const start = doc?.eventDate;
      if (!doc || !start) return new Response('Not found', { status: 404 });
      const url = absolute(`/${lang}`);
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Hadramout Center//Announcements//AR',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:announcement-${n}@${new URL(absolute('')).host}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
        `DTSTART;VALUE=DATE:${ymd(start)}`,
        `DTEND;VALUE=DATE:${ymd(start)}`,
        `SUMMARY:${esc(doc.title || 'Announcement')}`,
        ...(doc.venue ? [`LOCATION:${esc(String(doc.venue))}`] : []),
        ...(doc.excerpt ? [`DESCRIPTION:${esc(doc.excerpt)}`] : []),
        `URL:${url}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ];
      return new Response(`${lines.map(fold).join('\r\n')}\r\n`, {
        headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="announcement-${n}.ics"`, 'cache-control': 'public, max-age=3600' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }

  const info = typeFromRoute(kind);
  if (!info || (info.type !== 'event' && info.type !== 'forum')) return new Response('Not found', { status: 404 });
  const doc = await getDoc(info.type, n, /^[a-z-]{2,6}$/.test(lang) ? lang : 'ar');
  const start = (doc?.eventDate as string | undefined) ?? undefined;
  if (!doc || !start) return new Response('Not found', { status: 404 });
  const end = (doc.endDate as string | undefined) ?? start;
  const endExclusive = new Date(`${end.slice(0, 10)}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const url = absolute(`/${lang}/${info.route}/${n}`);
  const desc = [doc.speaker && `${doc.speaker}`, doc.timeText && `${doc.timeText}`, url].filter(Boolean).join('\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hadramout Center//Archive//AR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${info.route}-${n}@${new URL(absolute('')).host}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${ymd(start)}`,
    `DTEND;VALUE=DATE:${ymd(endExclusive.toISOString())}`,
    `SUMMARY:${esc(doc.title)}`,
    ...(doc.venue ? [`LOCATION:${esc(String(doc.venue))}`] : []),
    `DESCRIPTION:${esc(desc)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Response(`${lines.map(fold).join('\r\n')}\r\n`, {
    headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${info.route}-${n}.ics"`, 'cache-control': 'public, max-age=3600' },
  });
}
