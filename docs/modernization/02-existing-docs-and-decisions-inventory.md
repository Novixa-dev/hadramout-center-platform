# 02. جرد الوثائق والقرارات والخطط القائمة
## Inventory of Existing Documents, Decisions & Backlog Alignment

> **التاريخ:** 31 أكتوبر 2026  
> **مبدأ الحفاظ على التوثيق:** تُحفظ كافة ملفات التوثيق السابقة في المستودع دون أي حذف أو إعادة تسمية أو تعديل غير مصرح به. هذه الوثيقة ترسم خريطة استيعاب لكافة الخطط السابقة وربطها بالخطة المحدثة الشاملة.

---

## 1. فهرس وتصنيف الوثائق الحالية في المستودع

يحتوي المستودع على أرشيف توثيقي غني يوثق مراحل بناء النسخة الثانية (v2) من المنصة حتى أواخر أكتوبر 2026. فيما يلي جرد كامل للمجموعات التوثيقية الرئيسية وحالتها وكيفية حمل متطلباتها للأمام:

### 1.1 وثائق التخطيط ومتابعة التقدم (`docs/planning/`)

| مسار الوثيقة | ملخص المحتوى | الحالة | آلية الحمل إلى خطة التحديث |
|---|---|---|---|
| [`docs/planning/PROGRESS.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/PROGRESS.md) | سجل متابعة الإنجازات اليومية، القرارات المنفذة، ونقاط التسليم حتى 29 أكتوبر 2026. | مرجع تشغيلي حي | استيعاب كافة الإصلاحات الأمنية وإصلاحات لوحة التحكم، وتثبيت المهام العالقة (مثل بوابات الإطلاق G1-G4). |
| [`docs/planning/ROADMAP.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/ROADMAP.md) | خارطة طريق إطلاق المنصة، وبوابات الإطلاق الـ 11 (Launch Gates G1-G11). | نشطة ومعتمدة | تم دمج بوابات الإطلاق الـ 11 بالكامل داخل خارطة الطريق المحدثة في [`12-implementation-roadmap.md`](./12-implementation-roadmap.md). |
| [`docs/planning/MODERNIZATION_PLAN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/MODERNIZATION_PLAN.md) | مسودة خطة التحديث (مؤرخة في 27 أكتوبر 2026): الحركة والتحميل، التنقل، SEO، وحسابات القرّاء. | مسودة مقترحة | تم البناء على مخرجاتها، مع رفض الحلول الثقيلة (مثل شاشات التحميل المعطلة ومكتبات الرسوم المتحركة الزائدة) واعتماد الحلول الأصيلة (Native CSS). |
| [`docs/planning/NEXT_PLAN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/NEXT_PLAN.md) | أولويات التنفيذ القادمة مرتبة مرحلياً للمطورين. | نشطة | تم التوفيق بين بنودها التحريرية ومتطلبات كتاب الإنجاز وتقرير المركز. |
| [`docs/planning/FEATURE_PLAN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/FEATURE_PLAN.md) | كتالوج الميزات والتزامات التطوير المتفق عليها. | نشطة | جرد الميزات المنفذة وتلك التي ما زالت تنتظر موافقة المركز. |
| [`docs/planning/BACKLOG.md`](file:///d:/novixa-work/hadramout-center-platform/docs/planning/BACKLOG.md) | سجل العيوب والملاحظات التراكمي (101 ملاحظة مفهرسة). | نشطة | تم ربط كافة المهام المفتوحة بجدول التتبع المحدث [`IMPLEMENTATION_TRACKER.md`](./IMPLEMENTATION_TRACKER.md). |

### 1.2 وثائق التقارير والمراجعات والجودة (`docs/reports/` و`docs/quality/`)

| مسار الوثيقة | ملخص المحتوى | الحالة | الأثر والربط |
|---|---|---|---|
| [`docs/reports/RELEASE_READINESS.md`](file:///d:/novixa-work/hadramout-center-platform/docs/reports/RELEASE_READINESS.md) | تقييم الجاهزية للإطلاق (27 أكتوبر 2026): النتيجة (جاهز للمعاينة في Staging / غير جاهز للإطلاق العام بسبب بوابات المركز). | معتمدة | تأكيد أن المنصة الحالية تجريبية ومرهونة باعتماد المركز للمحتوى والقرارات المؤسسية. |
| [`docs/reports/REVIEW_2026-10-28_ADMIN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/reports/REVIEW_2026-10-28_ADMIN.md) | تقرير تدقيق وتحديث لوحة التحكم والأمان وحسابات المحررين. | منجز | البناء على الواجهة العربية المنجزة لتطوير منشئ الصفحات الآمن والمعاينة الحية. |
| [`docs/reports/REVIEW_2026-10-27.md`](file:///d:/novixa-work/hadramout-center-platform/docs/reports/REVIEW_2026-10-27.md) | المراجعة الشاملة للموقع العام، وبطاقات المشاركة، ومصفوفة الروابط. | منجز | الحفاظ على التحسينات المنجزة لبطاقات التواصل وعمليات التحويل 301. |
| [`docs/reports/QUALITY_REPORT.md`](file:///d:/novixa-work/hadramout-center-platform/docs/reports/QUALITY_REPORT.md) | التقرير التحريري المستخرج من قاعدة البيانات: المقالات غير المصنفة، التواريخ المقدرة، ونقص الأوصاف. | مرجع رقمي | استخدام أرقامه كأدلة دامغة في خطة تحسين جودة البيانات (`01-current-state-audit.md`). |
| [`docs/quality/PERFORMANCE_PLAN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/quality/PERFORMANCE_PLAN.md) | خطة قياس الأداء وضوابط السرعة وموازنة الحزم البرمجية (Performance Budget). | معتمدة | إلزام أي ميزة جديدة بعدم تجاوز ميزانية 10 كيلوبايت حزم مضغوطة والحفاظ على سرعة المتصفح. |

### 1.3 وثائق المعمارية والتدقيق والترحيل (`docs/architecture/` و`docs/audit/` و`docs/migration/`)

| مسار الوثيقة | ملخص المحتوى | الحالة | الأثر والربط |
|---|---|---|---|
| [`docs/architecture/DATA_MODEL_AND_TAXONOMY.md`](file:///d:/novixa-work/hadramout-center-platform/docs/architecture/DATA_MODEL_AND_TAXONOMY.md) | تدقيق تفصيلي لنموذج البيانات، الحقول، المفاتيح، وجودة الترحيل. | معتمدة | المرجع الأساسي لتصميم التوسعات في مجموعات المحتوى دون تكرار أو كسر للعلاقات. |
| [`docs/architecture/INFORMATION_ARCHITECTURE.md`](file:///d:/novixa-work/hadramout-center-platform/docs/architecture/INFORMATION_ARCHITECTURE.md) | بنية المعلومات وهيكل القوائم وتصنيفات المحتوى المعتمدة في النسخة v2. | معتمدة | مقارنة المعمارية المعتمدة هنا مع مقترحات تقرير المركز في [`04-information-architecture-and-navigation.md`](./04-information-architecture-and-navigation.md). |
| [`docs/architecture/SYSTEM_ARCHITECTURE.md`](file:///d:/novixa-work/hadramout-center-platform/docs/architecture/SYSTEM_ARCHITECTURE.md) | معمارية النظام والخادم المستقل ونظام الكاش وأمان البيانات. | معتمدة | الحفاظ على نفس البنية وتأكيد عزل النشر المستقل. |
| [`docs/audit/LEGACY_SITE_INVENTORY.md`](file:///d:/novixa-work/hadramout-center-platform/docs/audit/LEGACY_SITE_INVENTORY.md) | جرد تفصيلي لموقع المركز القديم ومطابقة الـ 1,461 عنصراً والـ 1,454 مادة مرحلة. | معتمدة | إثبات أن النواقص في الموقع الحي (مثل الفيديوهين فقط) تعود للموقع القديم وليست خطأ في الترحيل. |
| [`docs/migration/CONTENT_MIGRATION_PLAN.md`](file:///d:/novixa-work/hadramout-center-platform/docs/migration/CONTENT_MIGRATION_PLAN.md) | خطة ترحيل المحتوى وقواعد استيراد ملفات الوسائط. | منجز | دمج خطة استكمال استضافة الـ PDF محلياً (LEG-001). |
| [`docs/migration/URL_REDIRECT_MAP.md`](file:///d:/novixa-work/hadramout-center-platform/docs/migration/URL_REDIRECT_MAP.md) | خريطة تحويل الروابط القديمة بـ 301 للحفاظ على محركات البحث. | منجز ومختبر | استمرار حماية هذه الروابط في بيئة CI. |

### 1.4 وثائق الأمان والتسليم (`docs/security/` و`docs/06-handover/`)

| مسار الوثيقة | ملخص المحتوى | الحالة | الأثر والربط |
|---|---|---|---|
| [`docs/security/SECURITY_REVIEW.md`](file:///d:/novixa-work/hadramout-center-platform/docs/security/SECURITY_REVIEW.md) | المراجعة الأمنية والبنود المغلقة (SEC-001 إلى SEC-016) والبنود المفتوحة. | نشطة | حمل متطلبات التحقق الثنائي (2FA)، حماية رفع الملفات، وضوابط نشر المسودات في خطة التحديث. |
| [`docs/06-handover/ACCESS_AND_ACCOUNTS.md`](file:///d:/novixa-work/hadramout-center-platform/docs/06-handover/ACCESS_AND_ACCOUNTS.md) | دليل إدارة الحسابات، الأدوار التحريرية، وضوابط الأمان. | نشطة | الالتزام بعدم تضمين أي أسرار أو كلمات مرور في المستودع العام. |
| [`docs/06-handover/admin-guide-ar.md`](file:///d:/novixa-work/hadramout-center-platform/docs/06-handover/admin-guide-ar.md) | الدليل الإرشادي العربي لمحرري ومراجعي المركز. | نشط | سيتم تحديثه في ختام المرحلة B ليعكس استخدام منشئ الصفحات الجديد. |
| [`docs/06-handover/client-requirements-checklist-ar.md`](file:///d:/novixa-work/hadramout-center-platform/docs/06-handover/client-requirements-checklist-ar.md) | قائمة النواقص والمتطلبات المطلوب استلامها واعتمادها من إدارة المركز. | بانتظار المركز | تم دمج كافة بنودها في وثيقة [`14-open-questions-and-center-approvals.md`](./14-open-questions-and-center-approvals.md). |

---

## 2. مصفوفة تسوية التعارضات التوثيقية (Conflict Reconciliation)

أثناء التدقيق ومطابقة الوثائق التاريخية، تم رصد بعض التباينات الطفيفة الناتجة عن تطور مراحل المشروع، وتمت تسويتها معمارياً كما يلي:

1. **التباين في عدد الفعاليات (64 في خطة الميزات مقابل 53 في الجرد القديم):**
   - **الواقع المؤكد:** الجرد القديم وثّق 53 فعالية لمجموعة `events` و11 فعالية لمنتدى عميد الوفاء `forum-events`. تم تأكيد جمعهما في إحصائية الصفحة الرئيسية ليكون الناتج 64.
   - **التسوية المعتمدة:** الحفاظ على المجموعتين معاً وفصلهما بوضوح في لوحة التحكم وتوحيدهما للمستخدم في واجهة البحث الموحد.

2. **التباين في آلية إدارة الصفحات (مفهوم `posts` القديم مقابل `pages` المستقلة):**
   - وثائق التخطيط الأولى (v1 المؤرشفة في `docs/archive/v1/`) كانت تشير إلى جدول مدونات موحد (`posts`). تم استبداله في المعمارية المعتمدة الحالية بمجموعات متخصصة (`articles`, `news`, إلخ) ومجموعة مخصصة للصفحات الثابتة (`pages`).
   - **التسوية المعتمدة:** الاستمرار على المعمارية المعتمدة الحالية وتطوير مجموعة `pages` حصراً.

3. **حسابات القرّاء والزوار:**
   - اقترحت مسودة `MODERNIZATION_PLAN.md` تفعيل حسابات القرّاء عبر الروابط السحرية بالبريد.
   - **التسوية المعتمدة:** التزاماً بضوابط المشروع، حسابات القرّاء اختيارية وتبقى مؤجلة تماماً حتى يتوفر مزود بريد معتمد وسياسة خصوصية مجازة من المركز. المنصة تعمل بكفاءة تامة حالياً عبر الحفظ المحلي في المتصفح (`localStorage`) دون حاجة لحسابات خارجية.

---

## 3. آلية ترحيل المتطلبات إلى الوثائق الجديدة

تم استيعاب كافة المتطلبات المفتوحة من كافة الوثائق السابقة وتوزيعها بدقة هندسية داخل وثائق خطة التحديث في مجلد `docs/modernization/`:
- المتطلبات التحريرية وقائمة المهام -> [`IMPLEMENTATION_TRACKER.md`](./IMPLEMENTATION_TRACKER.md).
- المعمارية ونموذج الصفحات والكتل -> [`05-payload-dashboard-and-page-builder.md`](./05-payload-dashboard-and-page-builder.md).
- معمارية القوائم والمعلومات -> [`04-information-architecture-and-navigation.md`](./04-information-architecture-and-navigation.md).
- قرارات البنية والأدوات المجانية -> [`DECISION_LOG.md`](./DECISION_LOG.md) و[`15-research-references.md`](./15-research-references.md).
- بوابات الإطلاق والموافقات -> [`12-implementation-roadmap.md`](./12-implementation-roadmap.md) و[`14-open-questions-and-center-approvals.md`](./14-open-questions-and-center-approvals.md).
