import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'
import { applyBookRecords, revertBookRecords, type RawDb } from '../seed/book-records.ts'
import { reindexAll } from '../lib/reindex.ts'

/**
 * The Center's record of its own activity, from the decade book: conferences, seminars, panels, lectures, competitions and forum
 * events with their papers and people, plus four books the old catalogue lacks. See src/seed/book-records-data.ts for the rules.
 * Data only; a fresh database gets the same records from the seeder, after the snapshot.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const report = await applyBookRecords(db as unknown as RawDb)
  payload.logger.info(`book records: ${JSON.stringify(report)}`)
  if (!report.created && !report.matched) return
  // new rows reach search only through the index. It reads with today's schema, so a database several migrations behind can't do it here.
  try {
    await reindexAll(payload)
  } catch (err) {
    payload.logger.warn(`book records: search index not rebuilt (${String(err)}); run: npm run db:seed -- --defaults-only`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await revertBookRecords(db as unknown as RawDb)
}
