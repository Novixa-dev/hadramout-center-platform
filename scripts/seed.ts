/**
 * Load content into Payload.   npm run db:seed   (options as environment variables, since `payload run` drops arguments:
 *   SEED_DEFAULTS_ONLY=1 · SEED_FILE=content/legacy-snapshot.json.gz · SEED_EXAMPLE_PROMOTIONS=1)
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no user exists, and the staff accounts listed in
 * STAFF_ACCOUNTS with STAFF_PASSWORD (see src/seed/staff.ts). Passwords only ever come from the environment.
 * SEED_EXAMPLE_PROMOTIONS=1 adds example promotions as drafts (nothing is shown until an editor publishes one).
 */
import { resolve } from 'node:path';
import { getPayload } from 'payload';
import config from '@payload-config';
import { readSnapshot, seedDefaults, seedSnapshot } from '../src/seed/seed.ts';
import { applyBookRecords, type RawDb } from '../src/seed/book-records.ts';
import { reindexAll } from '../src/lib/reindex.ts';
import { checkStaffPassword, ensureStaff, parseStaffAccounts } from '../src/seed/staff.ts';
import { seedExamplePromotions } from '../src/seed/promotions.ts';

// `payload run` does not hand command-line arguments to the script (2026-11-20: argv holds only node and payload), so
// every option is also an environment variable: SEED_DEFAULTS_ONLY=1, SEED_FILE=…, SEED_EXAMPLE_PROMOTIONS=1
const args = new Map(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k as string, v ?? 'true'] as const; }));
const env = (name: string, key: string) => {
  const v = process.env[name];
  if (v && v !== '0' && v !== 'false') args.set(key, v === '1' || v === 'true' ? 'true' : v);
};
env('SEED_DEFAULTS_ONLY', 'defaults-only');
env('SEED_FILE', 'file');
env('SEED_EXAMPLE_PROMOTIONS', 'example-promotions');
const payload = await getPayload({ config });
const log = (m: string) => console.log(m);

if ((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  await payload.create({ collection: 'users', data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: 'مدير النظام', role: 'admin' }, overrideAccess: true });
  log(`✔ admin user created: ${process.env.ADMIN_EMAIL}`);
}

const staff = parseStaffAccounts(process.env.STAFF_ACCOUNTS);
if (staff.length) {
  const r = await ensureStaff(payload, staff, checkStaffPassword(process.env.STAFF_PASSWORD));
  log(`✔ staff accounts: ${r.created.length} created, ${r.kept.length} already there`);
}

await seedDefaults(payload);
log('✔ pages, timeline, glossary, site settings');

if (!args.has('defaults-only')) {
  const file = resolve(process.cwd(), args.get('file') ?? 'content/legacy-snapshot.json.gz');
  const report = await seedSnapshot(payload, readSnapshot(file), log);
  log(JSON.stringify(report));
}

log(`✔ book records ${JSON.stringify(await applyBookRecords((payload.db as unknown as { drizzle: RawDb }).drizzle))}`);

if (args.has('example-promotions')) log(`✔ example promotions (drafts): ${await seedExamplePromotions(payload)} added`);

const n = await reindexAll(payload);
log(`✔ search index rebuilt (${n} documents)`);
process.exit(0);
