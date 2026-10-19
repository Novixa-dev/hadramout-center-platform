import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Editorial taxonomy for the article archive (data migration, idempotent, name-based — never id-based).
 *
 * The 53 article "categories" imported from the old site are really the magazine's columns (أبواب المجلة), with
 * spelling slips and a few mash-ups. This migration
 *   1. creates eight top-level topics (only when missing),
 *   2. files each existing column under one of them (only columns that have no parent yet, so an editor's choice
 *      made in the admin is never overwritten),
 *   3. merges three unambiguous typos into their canonical column (articles are re-pointed first, then the typo
 *      category is removed): «حديث الباية»→«حديث البداية», «درايسات»→«دراسات», «أضو»→«أضواء».
 * Everything else (e.g. the column called «40», «توقيع فلم») is left untouched and listed in
 * docs/09-redesign/02-editorial-issues.md for the Center's editors. The grouping is a proposal: edit it in the admin
 * under «التصنيفات».
 */

/** Strip tatweel, diacritics and spacing differences so names from the old site compare equal. */
const norm = (s: string): string => s.normalize('NFC').replace(/[ـً-ْٰ]/g, '').replace(/\s+/g, ' ').trim()

const TOPICS: { name: string; order: number; columns: string[]; prefixes?: string[] }[] = [
  { name: 'دراسات وبحوث', order: 10, columns: ['دراسات', 'ملف', 'ملف العدد'] },
  { name: 'التاريخ والتراث والآثار', order: 20, columns: ['تاريخ', 'تراث', 'تراثيات', 'موروثات', 'تراث وآثار', 'آثار', 'ذاكرة', 'أمكنة'] },
  { name: 'الأعلام والشخصيات', order: 30, columns: ['أعلام', 'شخصيات'], prefixes: ['أضواء - ملف خاص'] },
  { name: 'الأدب والإبداع', order: 40, columns: ['إبداعات', 'إبداع', 'كتابات', 'قصة قصيرة', 'قصص قصيرة', 'نصوص قصيرة جدا', 'توقيع قلم', 'تباريح قلم', 'حكايات'] },
  { name: 'الفنون والمسرح', order: 50, columns: ['فنون', 'تشكيل', 'مسرح'] },
  { name: 'حوارات ولقاءات واستطلاعات', order: 60, columns: ['حوار', 'لقاء', 'لقاء العدد', 'استطلاع'], prefixes: ['استطلاع عادل', 'تحقيق وتصوير'] },
  { name: 'قراءات ونقد', order: 70, columns: ['قراءة', 'قراءات', 'قراءة في كتاب', 'عرض كتاب', 'نقد', 'متابعات', 'نقاش'] },
  { name: 'مقالات ورؤى', order: 80, columns: ['أضواء', 'آفاق', 'تأملات', 'آراء', 'مدار', 'مدارات', 'لغويات', 'ترجمة', 'حديث البداية'] },
]

const TYPO_MERGES: [string, string][] = [
  ['حديث الباية', 'حديث البداية'],
  ['درايسات', 'دراسات'],
  ['أضو', 'أضواء'],
]

interface Row {
  id: number
  name: string
  parent_id: number | null
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const load = async (): Promise<Row[]> => {
    const res = (await db.all(
      sql`SELECT c.id AS id, l.name AS name, c.parent_id AS parent_id FROM categories c JOIN categories_locales l ON l._parent_id = c.id AND l._locale = 'ar' WHERE c.kind = 'article'`,
    )) as unknown as Row[]
    return res
  }

  // 3. typo merges first, so the canonical column receives the articles before it is filed under a topic
  let rows = await load()
  for (const [typo, canonical] of TYPO_MERGES) {
    const from = rows.find((r) => norm(r.name) === norm(typo))
    const to = rows.find((r) => norm(r.name) === norm(canonical))
    if (!from || !to || from.id === to.id) continue
    await db.run(sql`UPDATE articles SET category_id = ${to.id} WHERE category_id = ${from.id}`)
    await db.run(sql`UPDATE books SET category_id = ${to.id} WHERE category_id = ${from.id}`)
    await db.run(sql`UPDATE categories SET parent_id = NULL WHERE parent_id = ${from.id}`)
    await db.run(sql`DELETE FROM categories_locales WHERE _parent_id = ${from.id}`)
    await db.run(sql`DELETE FROM categories WHERE id = ${from.id}`)
  }

  // 1 + 2. topics and their columns
  rows = await load()
  for (const topic of TOPICS) {
    let parent = rows.find((r) => r.parent_id === null && norm(r.name) === norm(topic.name))
    if (!parent) {
      await db.run(sql`INSERT INTO categories (kind, "order") VALUES ('article', ${topic.order})`)
      const created = (await db.all(sql`SELECT last_insert_rowid() AS id`)) as unknown as { id: number }[]
      const id = Number(created[0]?.id)
      await db.run(sql`INSERT INTO categories_locales (name, _locale, _parent_id) VALUES (${topic.name}, 'ar', ${id})`)
      parent = { id, name: topic.name, parent_id: null }
      rows.push(parent)
    }
    const wanted = new Set(topic.columns.map(norm))
    for (const r of rows) {
      if (r.id === parent.id || r.parent_id !== null) continue
      const n = norm(r.name)
      if (wanted.has(n) || (topic.prefixes ?? []).some((p) => n.startsWith(norm(p)))) {
        // a column is never a parent itself
        const isParent = rows.some((x) => x.parent_id === r.id) || TOPICS.some((t) => norm(t.name) === n)
        if (isParent) continue
        await db.run(sql`UPDATE categories SET parent_id = ${parent.id} WHERE id = ${r.id} AND parent_id IS NULL`)
        r.parent_id = parent.id
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reversible part only: detach columns and drop the topics created above. Merged typo categories are not restored.
  const names = TOPICS.map((t) => t.name)
  for (const name of names) {
    const found = (await db.all(sql`SELECT c.id AS id FROM categories c JOIN categories_locales l ON l._parent_id = c.id AND l._locale = 'ar' WHERE l.name = ${name} AND c.parent_id IS NULL`)) as unknown as { id: number }[]
    for (const { id } of found) {
      await db.run(sql`UPDATE categories SET parent_id = NULL WHERE parent_id = ${id}`)
      await db.run(sql`DELETE FROM categories_locales WHERE _parent_id = ${id}`)
      await db.run(sql`DELETE FROM categories WHERE id = ${id}`)
    }
  }
}
