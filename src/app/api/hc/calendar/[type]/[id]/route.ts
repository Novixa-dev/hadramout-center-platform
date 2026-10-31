import { getPayloadClient } from '../../../../../../lib/runtime.ts';
import { generateIcs } from '../../../../../../lib/ical.ts';
import { isPlausibleId } from '../../../../../../lib/errors.ts';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ type: string; id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { type, id: rawId } = await params;
  const id = Number(rawId);
  if (!isPlausibleId(id)) {
    return new Response('Invalid ID', { status: 400 });
  }

  const validTypes = ['events', 'forum-events', 'announcements'];
  if (!validTypes.includes(type)) {
    return new Response('Unsupported type', { status: 400 });
  }

  const payload = await getPayloadClient();
  try {
    const doc = (await payload.findByID({
      collection: type as never,
      id,
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown> | null;

    if (!doc) {
      return new Response('Not found', { status: 404 });
    }

    const title = typeof doc.title === 'string' ? doc.title : 'Event';
    const dateStr = typeof doc.eventDate === 'string' ? doc.eventDate : typeof doc.publishedAt === 'string' ? doc.publishedAt : null;
    if (!dateStr) {
      return new Response('Event has no date', { status: 400 });
    }

    const ics = generateIcs({
      uid: `${type}-${id}`,
      title,
      description: typeof doc.excerpt === 'string' ? doc.excerpt : undefined,
      location: typeof doc.venue === 'string' ? doc.venue : undefined,
      start: dateStr,
      url: `https://hadramout.center/ar/${type === 'forum-events' ? 'forum' : type}/${id}`,
    });

    return new Response(ics, {
      status: 200,
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': `attachment; filename="${type}-${id}.ics"`,
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
