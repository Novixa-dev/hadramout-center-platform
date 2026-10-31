import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { Field } from 'payload';
import ar from '../../messages/ar.json' with { type: 'json' };
import en from '../../messages/en.json' with { type: 'json' };

registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/cache' ? 'next/cache.js' : spec, ctx) });
const { Events, ForumEvents } = await import('../../src/collections/content.ts');

type ArrayField = Field & { fields: Field[] };

describe('Event tracks, chairs, and papers configuration', () => {
  test('events and forum-events collections exist', () => {
    assert.ok(Events, 'events collection must exist');
    assert.ok(ForumEvents, 'forum-events collection must exist');
  });

  test('events collection contains tracks, chairs, and papers fields', () => {
    const fields = Events.fields;
    const tracksField = fields.find((f) => 'name' in f && f.name === 'tracks');
    const chairsField = fields.find((f) => 'name' in f && f.name === 'chairs');
    const papersField = fields.find((f) => 'name' in f && f.name === 'papers');

    assert.ok(tracksField, 'tracks field must exist on events');
    assert.equal(tracksField.type, 'array');

    assert.ok(chairsField, 'chairs field must exist on events');
    assert.equal(chairsField.type, 'text');
    assert.equal('localized' in chairsField && chairsField.localized, true);

    assert.ok(papersField, 'papers field must exist on events');
    assert.equal(papersField.type, 'array');
  });

  test('tracks array has title and localized description', () => {
    const tracksField = Events.fields.find((f) => 'name' in f && f.name === 'tracks') as ArrayField;
    const subFields = tracksField.fields;
    const titleField = subFields.find((f) => 'name' in f && f.name === 'title');
    const descField = subFields.find((f) => 'name' in f && f.name === 'description');

    assert.ok(titleField, 'title field in tracks must exist');
    assert.equal('required' in titleField && titleField.required, true);

    assert.ok(descField, 'description field in tracks must exist');
    assert.equal('localized' in descField && descField.localized, true);
  });

  test('papers array has title, researcher, abstract, and file fields', () => {
    const papersField = Events.fields.find((f) => 'name' in f && f.name === 'papers') as ArrayField;
    const subFields = papersField.fields;
    const title = subFields.find((f) => 'name' in f && f.name === 'title');
    const researcher = subFields.find((f) => 'name' in f && f.name === 'researcher');
    const paperAbstract = subFields.find((f) => 'name' in f && f.name === 'abstract');
    const fileUrl = subFields.find((f) => 'name' in f && f.name === 'fileUrl');
    const file = subFields.find((f) => 'name' in f && f.name === 'file');

    assert.ok(title, 'title field must exist');
    assert.equal('required' in title && title.required, true);

    assert.ok(researcher, 'researcher field must exist');
    assert.equal('localized' in researcher && researcher.localized, true);
    assert.equal('required' in researcher && researcher.required, true);

    assert.ok(paperAbstract, 'abstract field must exist');
    assert.equal('localized' in paperAbstract && paperAbstract.localized, true);

    assert.ok(fileUrl, 'fileUrl field must exist');
    assert.ok(file, 'file upload field must exist');
  });

  test('event UI translation keys exist in both ar and en message catalogs', () => {
    const requiredKeys = [
      'event.tracks',
      'event.papers',
      'event.chairs',
      'event.downloadPaper',
    ] as const;

    const arMap: Record<string, string> = ar;
    const enMap: Record<string, string> = en;

    for (const key of requiredKeys) {
      assert.ok(key in arMap, `key ${key} should exist in ar.json`);
      assert.ok(key in enMap, `key ${key} should exist in en.json`);
      assert.notEqual(arMap[key], '', `ar value for ${key} should not be empty`);
      assert.notEqual(enMap[key], '', `en value for ${key} should not be empty`);
    }
  });
});
