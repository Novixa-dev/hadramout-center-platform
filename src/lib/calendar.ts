/**
 * Calendar entries for events and announcements: an RFC 5545 `.ics` file and an "add to Google Calendar" link.
 * Both are all-day entries (the archive stores days, and times are free text such as «بعد صلاة العصر»).
 */
export interface CalendarEntry {
  /** stable id, unique per site (e.g. "events-12") */
  uid: string;
  host: string;
  title: string;
  /** first day, ISO date or date-time (only the date part is used) */
  start: string;
  /** last day (inclusive); defaults to the first */
  end?: string;
  location?: string;
  description?: string;
  url: string;
}

const day = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

/** The day after `iso` as YYYYMMDD: all-day entries end on an exclusive date in both formats. */
function nextDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return day(d.toISOString());
}

/** RFC 5545 text escaping. */
export const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Lines longer than 75 octets are folded (continuation lines start with a space); multi-byte characters stay whole. */
export function foldIcs(line: string): string {
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

export function icsFile(e: CalendarEntry, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hadramout Center//Archive//AR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.uid}@${e.host}`,
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;VALUE=DATE:${day(e.start)}`,
    `DTEND;VALUE=DATE:${nextDay(e.end ?? e.start)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    ...(e.location ? [`LOCATION:${escapeIcs(e.location)}`] : []),
    `DESCRIPTION:${escapeIcs([e.description, e.url].filter(Boolean).join('\n'))}`,
    `URL:${e.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldIcs).join('\r\n')}\r\n`;
}

/** https://calendar.google.com/calendar/render?action=TEMPLATE… (the documented "add event" template link). */
export function googleCalendarUrl(e: CalendarEntry): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${day(e.start)}/${nextDay(e.end ?? e.start)}`,
    details: [e.description, e.url].filter(Boolean).join('\n\n'),
  });
  if (e.location) p.set('location', e.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
