import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clip, describe as describeText } from '../../src/lib/seo-text.ts';
import { announcementEventsJsonLd } from '../../src/lib/jsonld.ts';

test('direction controls from imported titles never reach a preview', () => {
  assert.equal(clip('المؤتمر العلمي الرابع الحضارمة⁩ في القرن', 200), 'المؤتمر العلمي الرابع الحضارمة في القرن');
  assert.equal(describeText('⁨نص⁩ تجريبي طويل بما يكفي ليكون وصفاً‏'), 'نص تجريبي طويل بما يكفي ليكون وصفاً');
});

test('dated announcements become schema.org Events; undated ones are left out', () => {
  const org = { name: 'مركز حضرموت', origin: 'https://x.test', logo: 'https://x.test/l.png' };
  const ld = announcementEventsJsonLd(
    [{ id: 1, title: 'ندوة', eventDate: '2026-12-01T17:00:00.000Z', venue: 'المكلا' }, { id: 2, title: 'تعميم' }],
    { pageUrl: 'https://x.test/ar/announcements', lang: 'ar', org },
  ) as { '@graph': Record<string, unknown>[] };
  assert.equal(ld['@graph'].length, 1);
  assert.equal(ld['@graph'][0]!['@type'], 'Event');
  assert.equal(ld['@graph'][0]!.startDate, '2026-12-01T17:00:00.000Z');
  assert.deepEqual(ld['@graph'][0]!.location, { '@type': 'Place', name: 'المكلا', address: 'المكلا' });
  assert.equal(announcementEventsJsonLd([{ id: 3, title: 'x' }], { pageUrl: 'u', lang: 'ar', org }), null);
});
