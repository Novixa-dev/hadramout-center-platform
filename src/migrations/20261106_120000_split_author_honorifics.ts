import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Moves academic titles out of author names into the `honorific` field, and re-joins bylines the legacy import cut in two.
 *
 * Why: the legacy import stored "أ.د. فلان" as the name, so the A–Z index, search and the merge key saw the title. The field exists
 * since 20261031_025843 but nothing filled it on the live database (the clean-up had only been run by hand on a development copy).
 *
 * 1. A byline such as "أ.م.د/ عبدالله عبدالرحمن بكير" was cut at the slash into two authors: a bare title ("أ.م.د", "الشيخ") and the
 *    real person. The title moves onto the person and the bare-title author is removed, but only when it is always followed by the
 *    same single person in every record that cites it (authors 159 and 78 at the time of writing). Anything else is left for the editors.
 * 2. Every remaining Arabic author row without an honorific has its leading title split off. The rules are frozen below and mirrored in
 *    src/lib/author-names.ts, which the seeder uses, so a fresh seed and this database agree. A name that is only a title is left alone.
 *
 * Idempotent. down() is a no-op: the pre-deploy backup holds the original names.
 */

const PREFIXES: { re: RegExp; honorific: string }[] = [
  { re: /^(?:أ\.م\.د\.|أ\.م\.د)\s+/u, honorific: 'أ.م.د.' },
  { re: /^(?:أ\.\s*د\.?|الأستاذ\s+الدكتور)\s+/u, honorific: 'أ.د.' },
  { re: /^(?:د\.\s*|د\s+|الدكتور\s+)/u, honorific: 'د.' },
  { re: /^الشيخ\s*[:/]?\s+/u, honorific: 'الشيخ' },
  { re: /^الباحث\s*[:/]?\s+/u, honorific: 'الباحث' },
  { re: /^القاضي\s+/u, honorific: 'القاضي' },
  { re: /^السيد\s+العلامة\s+الفقيه\s+القاضي\s+المؤرخ\s+/u, honorific: 'السيد العلامة' },
  { re: /^م\.\s+/u, honorific: 'م.' },
  { re: /^أ\.\s*(?=\p{L}{2})/u, honorific: 'أ.' }, // "أ. فلان" (Ustadh): needs a real word after it, so the initials in "أ.م.د" are not eaten
]
const FOREIGN_INITIALS = /^م\.أ\./u
const TRAILING_ROLE = /\s*[-–—]\s*رئيس\s+التحرير\s*$/u
const BARE_TITLE = /^(?:أ\.\s*م\.\s*د|أ\.\s*د|أ|د|الشيخ|الدكتور|الأستاذ|الباحث|القاضي|م)\.?$/u

function split(raw: string): { name: string; honorific: string } | null {
  const input = raw.replace(TRAILING_ROLE, '').trim()
  if (FOREIGN_INITIALS.test(input)) return null
  for (const { re, honorific } of PREFIXES) {
    if (!re.test(input)) continue
    const name = input.replace(re, '').trim()
    return name ? { name, honorific } : null
  }
  return input !== raw.trim() ? { name: input, honorific: '' } : null
}

type Row = { id: number; parent: number; name: string | null; honorific: string | null }

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const load = () =>
    db.all<Row>(sql`SELECT id, _parent_id AS parent, name, honorific FROM authors_locales WHERE _locale = 'ar' AND name IS NOT NULL`)

  // (1) re-join cut bylines
  const relTables = (
    await db.all<{ name: string }>(
      sql`SELECT m.name AS name FROM sqlite_master m JOIN pragma_table_info(m.name) p ON p.name = 'authors_id' WHERE m.type = 'table' AND m.name NOT LIKE 'payload%'`,
    )
  ).map((r) => r.name)

  for (const bare of (await load()).filter((r) => BARE_TITLE.test((r.name ?? '').trim()))) {
    const followers = new Set<number>()
    let orphan = false
    for (const t of relTables) {
      const table = sql.raw(`\`${t}\``)
      const cited = await db.all<{ parent_id: number; order: number }>(
        sql`SELECT parent_id, \`order\` AS \`order\` FROM ${table} WHERE authors_id = ${bare.parent} AND path = 'authors'`,
      )
      for (const c of cited) {
        const next = await db.all<{ authors_id: number }>(
          sql`SELECT authors_id FROM ${table} WHERE parent_id = ${c.parent_id} AND path = 'authors' AND \`order\` = ${c.order + 1}`,
        )
        if (next[0]) followers.add(next[0].authors_id)
        else orphan = true
      }
    }
    if (orphan || followers.size !== 1) continue // not clearly a cut byline: leave it for the editors
    const person = (await load()).find((r) => r.parent === [...followers][0])
    if (!person) continue
    const title = split(`${(bare.name ?? '').trim()} x`)?.honorific
    if (!title) continue
    if (!person.honorific) await db.run(sql`UPDATE authors_locales SET honorific = ${title} WHERE id = ${person.id}`)
    for (const t of relTables) await db.run(sql`DELETE FROM ${sql.raw(`\`${t}\``)} WHERE authors_id = ${bare.parent}`)
    await db.run(sql`DELETE FROM payload_locked_documents_rels WHERE authors_id = ${bare.parent}`)
    await db.run(sql`DELETE FROM authors_locales WHERE _parent_id = ${bare.parent}`)
    await db.run(sql`DELETE FROM authors WHERE id = ${bare.parent}`)
  }

  // (2) split the remaining titles
  for (const row of await load()) {
    if (row.honorific) continue
    const s = split(row.name ?? '')
    if (!s) continue
    await db.run(sql`UPDATE authors_locales SET name = ${s.name}, honorific = ${s.honorific || null} WHERE id = ${row.id}`)
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // nothing to restore: see the note above
}
