# وثائق خطة التحديث والتطوير الشاملة — مركز حضرموت للدراسات التاريخية والتوثيق والنشر
## Comprehensive Modernization, Audit & Roadmap Documentation Suite

> **المشروع:** منصة مركز حضرموت للدراسات التاريخية والتوثيق والنشر (المكلا، اليمن)  
> **الشريك التقني والتنفيذي:** نوفكسا (Novixa)  
> **الموقع المرجعي للاختبار:** `https://hadramout-center.novixa.dev/ar/`  
> **تاريخ إنجاز المرحلة A (التدقيق والتخطيط):** 31 أكتوبر 2026  
> **حالة المرحلة:** **`STAGE A COMPLETE — WAITING FOR OWNER APPROVAL`**  
> **تنبيه حرج:** لم يتم تعديل أي كود برمجي، أو تبعيات، أو قواعد بيانات، أو صفحات عامة، أو إعدادات نشر، التزاماً ببوابة الموافقة الإلزامية للمرحلة A.

---

## 1. الفهرس العام للمستندات (Documentation Index)

تم إعداد مجموعة الوثائق الفنية والتنفيذية وفق أعلى المعايير الهندسية لتغطي متطلبات كتاب الإنجاز، وتقرير ملاحظات المركز، وتدقيق المستودع والموقع الحي، وجدول المهام القابل للتتبع:

| # | المستند | الوصف ونطاق العمل | الحالة |
|---|---|---|---|
| 00 | [`00-executive-summary.md`](./00-executive-summary.md) | الملخص التنفيذي الشامل: ما تم إنجازه بقوة، الفجوات الحرجة، والاتجاه الموصى به. | مكتمل |
| 01 | [`01-current-state-audit.md`](./01-current-state-audit.md) | تدقيق الحالة الراهنة بالأدلة: المستودع، الموقع الحي، لوحة التحكم، ونموذج البيانات. | مكتمل |
| 02 | [`02-existing-docs-and-decisions-inventory.md`](./02-existing-docs-and-decisions-inventory.md) | جرد الوثائق والقرارات السابقة (ربط وعدم حذف أو تعديل أي وثيقة قائمة). | مكتمل |
| 03 | [`03-requirements-traceability.md`](./03-requirements-traceability.md) | مصفوفة تتبع المتطلبات: كتاب الإنجاز، تقرير الملاحظات، وطلبات المالك. | مكتمل |
| 04 | [`04-information-architecture-and-navigation.md`](./04-information-architecture-and-navigation.md) | معمارية المعلومات والتنقل: القوائم، التذييل، والتسلسل الهرمي للمسارات. | مكتمل |
| 05 | [`05-payload-dashboard-and-page-builder.md`](./05-payload-dashboard-and-page-builder.md) | معمارية لوحة التحكم ومنشئ الصفحات (Page Builder): الكتل، التحقق، والمعاينة. | مكتمل |
| 06 | [`06-localization-translation-and-writing-assistant.md`](./06-localization-translation-and-writing-assistant.md) | سير عمل التعريب والترجمة وأدوات المساعدة التحريرية المجانية والمفتوحة. | مكتمل |
| 07 | [`07-seo-og-and-structured-data.md`](./07-seo-og-and-structured-data.md) | خطة تحسين محركات البحث (SEO)، بطاقات التواصل (OG)، والبيانات المنظمة (JSON-LD). | مكتمل |
| 08 | [`08-design-accessibility-and-performance.md`](./08-design-accessibility-and-performance.md) | الحفاظ على الهوية البصرية، إمكانية الوصول (WCAG 2.2 AA)، والأداء الميداني. | مكتمل |
| 09 | [`09-security-privacy-and-data-migrations.md`](./09-security-privacy-and-data-migrations.md) | الأمن، الخصوصية، الصلاحيات، واستراتيجيات الترحيل والتراجع الآمن. | مكتمل |
| 10 | [`10-content-model-and-digital-archive-roadmap.md`](./10-content-model-and-digital-archive-roadmap.md) | نمذجة المحتوى وخارطة طريق مشروع «الخزانة الحضرمية» المستقل. | مكتمل |
| 11 | [`11-testing-and-quality-strategy.md`](./11-testing-and-quality-strategy.md) | استراتيجية الجودة والاختبارات الشاملة (وحدات، تكامل، تصفح، وتدقيق آلي). | مكتمل |
| 12 | [`12-implementation-roadmap.md`](./12-implementation-roadmap.md) | خارطة الطريق المرحلية (المراحل 0 إلى 7) مع تقديرات الجهد والاعتماديات. | مكتمل |
| 13 | [`13-risk-register.md`](./13-risk-register.md) | سجل المخاطر التشغيلية، التقنية، والمؤسسية مع آليات التخفيف. | مكتمل |
| 14 | [`14-open-questions-and-center-approvals.md`](./14-open-questions-and-center-approvals.md) | الأسئلة المفتوحة والقرارات المحصورة بالمركز والشريك التقني. | مكتمل |
| 15 | [`15-research-references.md`](./15-research-references.md) | المراجع والأدلة التقنية والتوثيقات الرسمية وتراخيص الأدوات. | مكتمل |
| — | [`IMPLEMENTATION_TRACKER.md`](./IMPLEMENTATION_TRACKER.md) | سجل تتبع المهام البرمجية التفصيلي وفق المعيار المطلوب (`CMS-xxx`, `SEO-xxx`...). | جاهز للاعتماد |
| — | [`DECISION_LOG.md`](./DECISION_LOG.md) | سجل القرارات المعمارية الموثقة (Architecture Decision Records - ADR). | محدث |
| — | [`CHANGELOG.md`](./CHANGELOG.md) | سجل التغييرات للمرحلة (Planning Phase Only). | محدث |

---

## 2. قواعد التشغيل الحاكمة للمشروع (Operating Principles)

1. **الحفاظ الصارم على هوية الموقع العام (No Public Redesign):**  
   لا يُسمح بإعادة تصميم الواجهة العامة للموقع؛ بل المحافظة الكاملة على الخطوط، الألوان، نمط الهيدر والفوتر، ونظام الرموز (`tokens`). التحسينات تقتصر على معالجة العيوب المرصودة، وتضمين الأقسام الجديدة المعتمدة دون كسر التجربة البصرية.
2. **تطوير جذري ومنضبط للوحة التحكم (Payload CMS Modernization):**  
   ترقية تجربة المحرر عبر منشئ صفحات مرن ومقيد في آنٍ واحد، ونظام معاينة فورية آمنة، وضوابط نشر، دون الخروج عن معمارية Payload 3 المثبتة.
3. **الأولوية للبرمجيات المفتوحة وذاتية الاستضافة (Open Source & Self-Hostable):**  
   رفض الاعتماد على اشتراكات SaaS المدفوعة أو واجهات الذكاء الاصطناعي الخارجية الإجبارية. أي أداة مقترحة يجب التحقق من ترخيصها، دعمها للغة العربية، وتكلفتها التشغيلية الحقيقية.
4. **الأمانة الأكاديمية والتوثيقية (Scholarly Integrity):**  
   عدم اختراع أي بيانات، أشخاص، لجان، سياسات تحكيم، أو أرقام ردمك/ردمد. كل ما يحتاج تأكيداً مؤسسياً يُوسم صراحة بـ `NEEDS CENTER APPROVAL`.
5. **الفصل التام بين مرحلتي التخطيط والتنفيذ (Approval Gate):**  
   العمل الحالي محصور في المرحلة A. لا تبدأ المرحلة B إلا بعد صدور موافقة كتابية صريحة من المالك.
