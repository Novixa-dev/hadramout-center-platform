/**
 * Load content into Payload.   npm run db:seed [-- --defaults-only] [-- --file=content/legacy-snapshot.json.gz]
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no user exists.
 */
import { resolve } from 'node:path';
import { getPayload } from 'payload';
import config from '@payload-config';
import { readSnapshot, seedDefaults, seedSnapshot } from '../src/seed/seed.ts';
import { reindexAll } from '../src/lib/reindex.ts';

const args = new Map(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k as string, v ?? 'true'] as const; }));
const payload = await getPayload({ config });
const log = (m: string) => console.log(m);

if ((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  await payload.create({ collection: 'users', data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: 'مدير النظام', role: 'admin' }, overrideAccess: true });
  log(`✔ admin user created: ${process.env.ADMIN_EMAIL}`);
}

await seedDefaults(payload);
log('✔ pages, timeline, glossary, site settings');

if (!args.has('defaults-only')) {
  const file = resolve(process.cwd(), args.get('file') ?? 'content/legacy-snapshot.json.gz');
  const report = await seedSnapshot(payload, readSnapshot(file), log);
  log(JSON.stringify(report));
}

const n = await reindexAll(payload);
log(`✔ search index rebuilt (${n} documents)`);
process.exit(0);
