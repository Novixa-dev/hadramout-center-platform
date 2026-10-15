# خيارات النطاق والتحويل من الموقع القديم

## أسماء مقترحة (مرتبة حسب التوصية)
| # | الاسم | الاستخدام |
|---|---|---|
| 1 | `hadramout-center.novixa.dev` | **مرحلة التجربة** (المطلوب حالياً) |
| 2 | `new.hadramout.center` | معاينة العميل بنطاقه الرسمي قبل التحويل |
| 3 | `beta.hadramout.center` | بديل للمعاينة |
| 4 | `hadramout.center` | **الإنتاج النهائي** بعد الاعتماد |
| 5 | `staging.hadramout-center.novixa.dev` | بيئة اختبار داخلية لنوفكسا |
| 6 | `archive.hadramout.center` | يُترك للنسخة القديمة (قراءة فقط) بعد التحويل |

## خطة التحويل (cutover)
1. نشر على `hadramout-center.novixa.dev` واعتماد المركز (راجع `docs/04-qa/01-human-test-guide.md`).
2. خفض TTL لسجلات `hadramout.center` إلى 300 ثانية قبل 48 ساعة.
3. ضبط `SITE_URL` في `.env` على `hadramout.center` وإضافة كتلة nginx وشهادة Cloudflare للنطاق الجديد (راجع `deploy/nginx` و`server-setup.sh`) ثم إعادة النشر.
4. تغيير سجل `A` إلى IP الخادم الجديد.
5. التحقق: الصفحة الرئيسية، `/admin`، خريطة الموقع `/sitemap.xml`، وروابط قديمة مثل `/articles/9597` (تُحوَّل 301 إلى العنوان الجديد).
6. تقديم `sitemap.xml` في Google Search Console، ومراقبة تقرير التغطية أسبوعين.
7. الاحتفاظ بالخادم القديم أسبوعين للرجوع.

سجلات DNS المطلوبة: `A  hadramout-center  →  IP` (وللجذر `@`، و`www` كـCNAME).
