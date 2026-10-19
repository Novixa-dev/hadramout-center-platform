import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Replaces the default accessibility statement with one that states what was actually tested (axe-core + Lighthouse +
 * keyboard review) and what is known to be missing. Only rows that still hold the original seeded text are changed,
 * so an editor's own wording is never overwritten. Idempotent.
 */
const OLD = `<p>نسعى لأن يكون الموقع متاحاً للجميع، وفق معايير <strong>WCAG 2.2 المستوى AA</strong>.</p>
<h2>ما نوفره</h2>
<ul>
<li>تصفح كامل بلوحة المفاتيح، وروابط «تخطي إلى المحتوى» وإلى البحث.</li>
<li>تباين ألوان كافٍ، ووضع ليلي، وتحكم بحجم الخط وعرض السطر في صفحات القراءة.</li>
<li>دعم كامل للعربية (من اليمين لليسار) ولغات أخرى بالاتجاه المناسب لكل لغة.</li>
<li>احترام تفضيل تقليل الحركة في نظام التشغيل.</li>
</ul>
<h2>الملاحظات</h2>
<p>إن واجهتك صعوبة في الوصول لأي محتوى أخبرنا عبر <a href="/ar/contact">صفحة التواصل</a> وسنعالجها.</p>`
const NEW = `<p>نسعى لأن يكون الموقع متاحاً للجميع، وفق معايير <strong>WCAG 2.2 المستوى AA</strong>. هذا البيان يصف ما نعمل به فعلاً وما نعرف أنه ما زال ناقصاً.</p>
<h2>ما نوفره</h2>
<ul>
<li>تصفح كامل بلوحة المفاتيح مع حلقة تركيز ظاهرة، ورابط «تخطي إلى المحتوى»، واختصار «/» لفتح البحث من أي صفحة.</li>
<li>تباين ألوان مُختبَر آلياً لكل أزواج النص والخلفية في الوضعين الفاتح والليلي (4.5:1 فأكثر).</li>
<li>في صفحات القراءة: تحكم بحجم الخط وتباعد الأسطر وعرض النص، وطباعة نظيفة تحتفظ بالمصدر والرابط.</li>
<li>عربية من اليمين إلى اليسار ولغات أخرى بالاتجاه المناسب لكل لغة، مع وسم لغة المقاطع العربية داخل الصفحات المترجمة.</li>
<li>احترام تفضيل «تقليل الحركة» في نظام التشغيل، وأهداف لمس مريحة في الأزرار والروابط الرئيسية.</li>
</ul>
<h2>كيف اختبرنا</h2>
<p>فحص آلي بأداتي axe-core وLighthouse على القوالب الرئيسية (الرئيسية، القوائم، المقال، الكتاب، العدد، البحث، الكتّاب، الخط الزمني، التواصل) ومراجعة يدوية بلوحة المفاتيح. الفحص الآلي لا يكشف كل المشكلات، ولم نُجرِ بعد اختباراً مع مستخدمي قارئات الشاشة.</p>
<h2>ما نعرف أنه ناقص</h2>
<ul>
<li>ملفات PDF القديمة للمجلة والكتب قد تكون صوراً ممسوحة ضوئياً بلا نص قابل للقراءة الآلي.</li>
<li>بعض الصور في المحتوى المنقول من الموقع القديم بلا وصف بديل مناسب.</li>
<li>الترجمة الآلية إلى اللغات الأخرى قد تحوي أخطاء، وهي موسومة بذلك في كل صفحة.</li>
</ul>
<h2>أخبرنا</h2>
<p>إن واجهتك صعوبة في الوصول إلى أي محتوى فاكتب لنا عبر <a href="/ar/contact">صفحة التواصل</a> وسنعالجها ونردّ عليك.</p>`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`UPDATE pages_locales SET body = ${NEW} WHERE _locale = 'ar' AND body = ${OLD} AND _parent_id IN (SELECT id FROM pages WHERE slug = 'accessibility')`,
  )
}

export async function down(): Promise<void> {
  // wording change only; nothing to revert
}
