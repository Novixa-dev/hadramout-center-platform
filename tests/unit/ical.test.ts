import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateIcs } from '../../src/lib/ical.ts';

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
