import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeIcs, foldIcs, googleCalendarUrl, icsFile, type CalendarEntry } from '../../src/lib/calendar.ts';

const entry: CalendarEntry = {
  uid: 'events-12',
  host: 'hadramout-center.novixa.dev',
  title: 'ندوة: البحر في الموروث الثقافي، والشعبي; في حضرموت',
  start: '2026-11-15T00:00:00.000Z',
  end: '2026-11-16',
  location: 'المكلا',
  description: 'السطر الأول\nالسطر الثاني',
  url: 'https://hadramout-center.novixa.dev/ar/events/12',
};

describe('calendar entries (RFC 5545 + Google Calendar)', () => {
  test('an all-day entry ends on the exclusive next day, also for a single day', () => {
    const multi = icsFile(entry, new Date('2026-11-03T10:00:00Z'));
    assert.match(multi, /DTSTART;VALUE=DATE:20261115\r\n/);
    assert.match(multi, /DTEND;VALUE=DATE:20261117\r\n/);
    const single = icsFile({ ...entry, end: undefined });
    assert.match(single, /DTEND;VALUE=DATE:20261116\r\n/);
    assert.ok(single.startsWith('BEGIN:VCALENDAR\r\n') && single.endsWith('END:VCALENDAR\r\n'));
    assert.match(single, /UID:events-12@hadramout-center\.novixa\.dev\r\n/);
  });

  test('text is escaped and long lines are folded without splitting a character', () => {
    assert.equal(escapeIcs('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
    const folded = foldIcs(`SUMMARY:${'حضرموت '.repeat(20)}`);
    for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
    assert.equal(folded.split('\r\n').map((l, i) => (i ? l.slice(1) : l)).join(''), `SUMMARY:${'حضرموت '.repeat(20)}`);
  });

  test('the Google link carries title, all-day dates, place and the page link', () => {
    const u = new URL(googleCalendarUrl(entry));
    assert.equal(u.origin + u.pathname, 'https://calendar.google.com/calendar/render');
    assert.equal(u.searchParams.get('action'), 'TEMPLATE');
    assert.equal(u.searchParams.get('text'), entry.title);
    assert.equal(u.searchParams.get('dates'), '20261115/20261117');
    assert.equal(u.searchParams.get('location'), 'المكلا');
    assert.ok(u.searchParams.get('details')?.endsWith(entry.url));
  });
});
