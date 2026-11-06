/**
 * Generates RFC 5545 compliant iCalendar (.ics) format.
 * Used for official announcements, conference deadlines, and scholarly events.
 */

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date | string;
  end?: Date | string;
  url?: string;
}

function formatIcalDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateIcs(event: CalendarEvent): string {
  const dtStamp = formatIcalDate(new Date());
  const dtStart = formatIcalDate(event.start);
  const dtEnd = event.end ? formatIcalDate(event.end) : dtStart;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hadhramout Center for Historical Studies//NONSGML v2.0//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@hadramout-center.org`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcalText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcalText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcalText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

/** "20261115" for a calendar date given as "2026-11-15" or an ISO timestamp (the date part is used; no timezone shifting). */
const compactDate = (d: string): string => d.slice(0, 10).replace(/-/g, '');
const nextDay = (d: string): string => {
  const t = new Date(`${d.slice(0, 10)}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10).replace(/-/g, '');
};

/**
 * "Add to Google Calendar" link for an all-day (date-only) event: the Center publishes event dates, not times.
 * Google's all-day range is end-exclusive, so the last day is passed as the day after. Returns null for an invalid start date.
 */
export function googleCalendarUrl(e: { title: string; start: string; end?: string | null; location?: string | null; url?: string | null; details?: string | null }): string | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(e.start)) return null;
  const last = e.end && /^\d{4}-\d{2}-\d{2}/.test(e.end) && e.end.slice(0, 10) >= e.start.slice(0, 10) ? e.end : e.start;
  const q = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${compactDate(e.start)}/${nextDay(last)}` });
  const details = [e.details, e.url].filter(Boolean).join('\n\n');
  if (details) q.set('details', details);
  if (e.location) q.set('location', e.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
