import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateIcs, googleCalendarUrl } from '../../src/lib/ical.ts';

describe('iCalendar generator (RFC 5545)', () => {
  test('generates valid VCALENDAR with VEVENT structure', () => {
    const ics = generateIcs({
      uid: 'conf-2026-101',
      title: 'مؤتمر حضرموت الدولي الأول',
      description: 'مؤتمر تاريخي وثائقي ينظمه مركز حضرموت.',
      location: 'المكلا، اليمن',
      start: new Date('2026-11-15T09:00:00Z'),
      end: new Date('2026-11-15T17:00:00Z'),
      url: 'https://hadramout-center.org/ar/events/101',
    });

    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('UID:conf-2026-101@hadramout-center.org'));
    assert.ok(ics.includes('SUMMARY:مؤتمر حضرموت الدولي الأول'));
    assert.ok(ics.includes('LOCATION:المكلا، اليمن'));
    assert.ok(ics.includes('URL:https://hadramout-center.org/ar/events/101'));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  test('escapes commas, semicolons and newlines properly', () => {
    const ics = generateIcs({
      uid: 'test-escape',
      title: 'محاضرة: التاريخ; التوثيق, والنشر',
      description: 'السطر الأول\nالسطر الثاني; والفاصلة, هنا.',
      start: '2026-12-01T10:00:00Z',
    });

    assert.ok(ics.includes('SUMMARY:محاضرة: التاريخ\\; التوثيق\\, والنشر'));
    assert.ok(ics.includes('DESCRIPTION:السطر الأول\\nالسطر الثاني\\; والفاصلة\\, هنا.'));
  });

  test('handles missing optional fields and defaults end date', () => {
    const ics = generateIcs({
      uid: 'minimal-1',
      title: 'اجتماع',
      start: new Date('2026-11-20T14:00:00Z'),
    });

    assert.ok(ics.includes('SUMMARY:اجتماع'));
    assert.ok(ics.includes('DTSTART:20261120T140000Z'));
    assert.ok(ics.includes('DTEND:20261120T140000Z'));
    assert.ok(!ics.includes('LOCATION:'));
    assert.ok(!ics.includes('DESCRIPTION:'));
  });
});

describe('Google Calendar link', () => {
  const dec = (u: string | null) => new URL(u as string).searchParams;
  test('a one-day event spans that day (end-exclusive)', () => {
    const q = dec(googleCalendarUrl({ title: 'ندوة', start: '2026-12-19T00:00:00.000Z', location: 'المكلا', url: 'https://x.test/ar/events/1' }));
    assert.equal(q.get('action'), 'TEMPLATE');
    assert.equal(q.get('dates'), '20261219/20261220');
    assert.equal(q.get('text'), 'ندوة');
    assert.equal(q.get('location'), 'المكلا');
    assert.equal(q.get('details'), 'https://x.test/ar/events/1');
  });
  test('a multi-day event ends the day after its last day, across a month boundary', () => {
    assert.equal(dec(googleCalendarUrl({ title: 't', start: '2016-12-30', end: '2016-12-31' })).get('dates'), '20161230/20170101');
  });
  test('an end before the start is ignored; an invalid start gives no link', () => {
    assert.equal(dec(googleCalendarUrl({ title: 't', start: '2026-05-10', end: '2026-05-01' })).get('dates'), '20260510/20260511');
    assert.equal(googleCalendarUrl({ title: 't', start: 'soon' }), null);
  });
  test('the host is fixed and the title is encoded, never interpreted', () => {
    const u = googleCalendarUrl({ title: 'a&dates=1/2#x', start: '2026-01-01' }) as string;
    assert.ok(u.startsWith('https://calendar.google.com/calendar/render?'));
    assert.equal(new URL(u).searchParams.get('text'), 'a&dates=1/2#x');
    assert.equal(new URL(u).searchParams.get('dates'), '20260101/20260102');
  });
});
