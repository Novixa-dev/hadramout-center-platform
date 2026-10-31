import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { Field } from 'payload';

registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/cache' ? 'next/cache.js' : spec, ctx) });
const { Partners } = await import('../../src/collections/Partners.ts');
const { Testimonials } = await import('../../src/collections/Testimonials.ts');

describe('Partners & Testimonials collections', () => {
  test('Partners collection exists and has proper schema', () => {
    assert.ok(Partners, 'Partners collection must exist');
    assert.equal(Partners.slug, 'partners');

    const fields = Partners.fields;
    const nameField = fields.find((f) => 'name' in f && f.name === 'name');
    const categoryField = fields.find((f) => 'name' in f && f.name === 'category');
    const logoField = fields.find((f) => 'name' in f && f.name === 'logo');
    const consentField = fields.find((f) => 'name' in f && f.name === 'hasWrittenConsent');

    assert.ok(nameField, 'name field must exist');
    assert.ok(categoryField, 'category field must exist');
    assert.ok(logoField, 'logo field must exist');
    assert.ok(consentField, 'hasWrittenConsent field must exist');

    assert.equal('defaultValue' in consentField! && consentField.defaultValue, false);
  });

  test('Partners categories are defined properly', () => {
    const categoryField = Partners.fields.find((f) => 'name' in f && f.name === 'category') as Field & { options: { value: string }[] };
    assert.ok(categoryField.options, 'category must have options');
    const values = categoryField.options.map((o) => o.value);
    assert.ok(values.includes('academic'));
    assert.ok(values.includes('research'));
    assert.ok(values.includes('cultural'));
    assert.ok(values.includes('governmental'));
  });

  test('Testimonials collection exists and has proper schema', () => {
    assert.ok(Testimonials, 'Testimonials collection must exist');
    assert.equal(Testimonials.slug, 'testimonials');

    const fields = Testimonials.fields;
    const personName = fields.find((f) => 'name' in f && f.name === 'personName');
    const quote = fields.find((f) => 'name' in f && f.name === 'quote');
    const consentField = fields.find((f) => 'name' in f && f.name === 'hasWrittenConsent');

    assert.ok(personName, 'personName field must exist');
    assert.ok(quote, 'quote field must exist');
    assert.ok(consentField, 'hasWrittenConsent field must exist');
    assert.equal('defaultValue' in consentField! && consentField.defaultValue, false);
  });
});
