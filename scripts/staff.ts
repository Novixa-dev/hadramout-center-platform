/**
 * Create (or, with --reset-password, reset) staff accounts from the environment. The password is never in the repository.
 *   STAFF_ACCOUNTS="admin@novixa.dev:admin, admin@hadramout.center:admin" STAFF_PASSWORD='…' [STAFF_RESET_PASSWORD=1] npm run staff:ensure
 * On the server: docker compose run --rm -e STAFF_ACCOUNTS -e STAFF_PASSWORD [-e STAFF_RESET_PASSWORD=1] tools npm run staff:ensure
 */
import { getPayload } from 'payload';
import config from '@payload-config';
import { checkStaffPassword, ensureStaff, parseStaffAccounts } from '../src/seed/staff.ts';

// STAFF_QUIET=1 (the deploy): counts only, so no staff address reaches a public log, not even inside an error message
const quiet = process.env.STAFF_QUIET === '1';
let specs: ReturnType<typeof parseStaffAccounts>;
let password: string;
try {
  specs = parseStaffAccounts(process.env.STAFF_ACCOUNTS);
  password = checkStaffPassword(process.env.STAFF_PASSWORD);
} catch (err) {
  console.error(quiet ? '✗ STAFF_ACCOUNTS or STAFF_PASSWORD is malformed (details hidden in quiet mode)' : (err as Error).message);
  process.exit(2);
}
if (specs.length === 0) {
  console.error('Set STAFF_ACCOUNTS (email[:role[:name]], comma-separated) and STAFF_PASSWORD.');
  process.exit(2);
}
const payload = await getPayload({ config });
const r = await ensureStaff(payload, specs, password, { resetPassword: process.argv.includes('--reset-password') || process.env.STAFF_RESET_PASSWORD === '1' });
if (quiet) console.log(`✔ staff accounts: ${r.created.length} created, ${r.updated.length} reset, ${r.kept.length} already there`);
else for (const s of specs) console.log(`${r.created.includes(s.email) ? '✔ created' : r.updated.includes(s.email) ? '✔ reset  ' : '• exists '} ${s.email} (${s.role})`);
process.exit(0);
