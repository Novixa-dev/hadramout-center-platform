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
