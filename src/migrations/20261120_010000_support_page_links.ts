import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

// The «دعم أنشطة المركز» page (seeded by 20261103_160000_center_book_content) still said the donation platform was
// "under construction"; /donate, /volunteer and the projects page exist since 2026-11-09. Only the untouched seeded text
// is replaced, so an editor's own version is never overwritten, and its existing translations are queued again; down
// restores the old text the same way.
const OLD = `<p>منصة التبرعات الإلكترونية قيد الإنشاء. للاستفسار عن دعم أنشطة المركز أو رعاية فعالياته وإصداراته، تواصلوا معنا عبر <a href="/ar/contact">صفحة التواصل</a>.</p>`
const NEW = `<p>يمكنكم دعم أنشطة المركز وإصداراته وفعالياته بإحدى الطرق الآتية:</p>
<ul>
<li><a href="/ar/donate">منصة التبرعات</a>: سجلوا نية التبرع، ويتواصل معكم المركز بطرق التحويل المعتمدة. لا يُخصم أي مبلغ عبر الموقع.</li>
<li><a href="/ar/projects-exhibition">معرض المشاريع للدعم</a> (قيد الإعداد): المشاريع التي يطرحها المركز للدعم والرعاية.</li>
<li><a href="/ar/volunteer">بوابة التطوع</a>: شاركوا بوقتكم وخبرتكم.</li>
</ul>
<p>وللاستفسار عن رعاية فعالية أو إصدار، تواصلوا معنا عبر <a href="/ar/contact">صفحة التواصل</a>.</p>`

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const page = await db.get<{ id: number; meta: string | null }>(sql`SELECT p.id AS id, p.translation_meta AS meta FROM pages p
    JOIN pages_locales l ON l._parent_id = p.id AND l._locale = 'ar' WHERE p.slug = 'support' AND l.body = ${OLD}`)
  if (!page) return
  await db.run(sql`UPDATE pages_locales SET body = ${NEW} WHERE _locale = 'ar' AND _parent_id = ${page.id}`)
  // raw SQL runs no hooks: translations made from the old text are queued again (the engine sees the source changed)
  let langs: string[] = []
  try {
    langs = Object.keys((page.meta ? JSON.parse(page.meta) : {}) as Record<string, unknown>).filter((l) => l !== 'ar')
  } catch {
    langs = []
  }
  for (const lang of langs) {
    try {
      await payload.jobs.queue({ task: 'translate-doc', input: { slug: 'pages', id: page.id, lang }, queue: 'translation' })
    } catch {
      // no job runner here (a script): the next edit or a visitor's request translates it
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`UPDATE pages_locales SET body = ${OLD}
    WHERE _locale = 'ar' AND body = ${NEW} AND _parent_id IN (SELECT id FROM pages WHERE slug = 'support')`)
}
