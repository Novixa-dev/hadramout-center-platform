# الانتقال إلى الاستضافة والنطاق الجديدين (دليل التنفيذ)

**الغرض:** نقل المنصة من نسخة المراجعة الحالية (`hadramout-center.novixa.dev` على الخادم المشترك) إلى الاستضافة والنطاق النهائيين، دون فقد محتوى أو روابط أو ظهور في محركات البحث.
**الحالة:** مسودة جاهزة للتنفيذ؛ تعتمد على قرارات المالك في القسم 1. **آخر تحديث:** 2026-10-21
**مرتبط بـ:** [دليل النشر](01-vps-deploy-guide.md) · [خيارات النطاق](02-domain-options.md) · [قائمة الترحيل](../migration/MIGRATION_CHECKLIST.md) · [خريطة التحويلات](../migration/URL_REDIRECT_MAP.md) · [الأمان](../security/SECURITY_REVIEW.md)

## 0. المبدأ

**نسخة المراجعة الحالية آمنة افتراضياً:** `SITE_ENV` غير مضبوط ⇒ وسم `noindex` وترويسة `X-Robots-Tag` على كل استجابة، وشريط «نسخة تجريبية» ظاهر، ولا خريطة موقع في `robots.txt`. **لا يصبح الموقع قابلاً للفهرسة إلا بضبط `SITE_ENV=production` صراحةً على الخادم النهائي** — وهذه آخر خطوة قبل الإطلاق (القسم 5). المرجع: [إرشادات Google عن noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) و[الانتقال لنطاق جديد](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## 1. قرارات مطلوبة من المالك (تحدد المسار)

| القرار | الخيارات | أثره |
|---|---|---|
| **النطاق النهائي** | (أ) `hadramout.center` نفسه (تغيير استضافة فقط) · (ب) نطاق جديد | (أ) لا «تغيير عنوان» في Search Console؛ تُحوَّل سجلات DNS فقط. (ب) يلزم 301 من النطاق القديم وأداة Change of Address، ومن يتحكم بالنطاق القديم |
| **الاستضافة** | VPS مستقل (موصى به) · استضافة مُدارة بحاويات | الخادم المشترك الحالي يحوي mailcow وغيره وتُنشر عليه بصلاحية `root`؛ الأفضل خادم مخصص |
| **Cloudflare** | أمام الموقع (موصى به) · بدونه | يحدد إعدادات الشهادة وعنوان الزائر (القسم 4) |
| **من يدير DNS والبريد** | المركز / نوڤيكسا | سجلات `MX` للبريد يجب ألا تُمس عند تحويل `A/CNAME` |
| **ملفات PDF والصور** | بقاء `files.hadramout.center` أم نقلها | إن كان النطاق النهائي `hadramout.center` فالنطاق الفرعي `files.` يجب أن يبقى يشير إلى مكان الملفات حتى تُنقل ([LEG-001](../planning/BACKLOG.md)) |

**مواصفات مقترحة للخادم (تقدير، تُعاير بعد القياس):** 2 vCPU، 4 GB RAM، 40 GB SSD، Ubuntu LTS، Docker + Compose. سبب 4 GB: عملية واحدة تجمع الموقع والإدارة وتوليد بطاقات المشاركة والبحث النصي، والحاوية الحالية محدودة بـ 1 GB ([ARCH-028](../architecture/SYSTEM_ARCHITECTURE.md)).

## 2. ما يرتبط بالنطاق/الخادم الحالي (جرد)

| الموضع | الارتباط | ماذا يتغير |
|---|---|---|
| `.env` على الخادم | `SITE_URL` (canonical، sitemap، RSS، OG، robots، التحويلات) و`SITE_ENV` | يُضبط على النطاق الجديد |
| `.github/workflows/deploy.yml` | `SITE_URL`، `APP_DIR`، **`HOST_KEY_FINGERPRINT`** (بصمة مفتاح الخادم المثبّتة) | تُحدَّث للخادم الجديد وإلا يفشل النشر عمداً |
| أسرار GitHub | `DEPLOY_HOST` و`DEPLOY_USER` و`DEPLOY_SSH_KEY` | تُستبدل بقيم الخادم الجديد (ويُفضّل مستخدم نشر غير root) |
| `deploy/nginx/*`, `deploy/server-setup.sh` | خاصان بـ nginx الخاص بـ mailcow وبشهادة `*.novixa.dev` | **لا يُستخدمان** على خادم مستقل؛ البديل `deploy/standalone-host/` (Caddy) |
| `deploy/docker-compose.yml` | شبكة خارجية `hadramout-center-edge` | تُنشأ على الخادم الجديد (يفعلها `bootstrap.sh`) |
| CSP في `next.config.ts` | `img-src` يسمح بـ `files.hadramout.center` | يُبقى حتى نقل الملفات ثم يُحذف |
| Cloudflare | قواعد التخزين المؤقت وشهادة الأصل | القسم 4 |
| Google Search Console | غير مسجَّل بعد | القسم 6 |

## 3. المرحلة أ — تجهيز الخادم الجديد (قبل أي تغيير على الموقع)

1. خادم نظيف، تحديثات أمنية تلقائية، جدار ناري (22 و80 و443 فقط)، مستخدم نشر بصلاحية docker دون root، مفتاح SSH جديد.
2. تثبيت Docker وCompose، ثم على الخادم:
   ```bash
   sudo bash deploy/standalone-host/bootstrap.sh        # ينشئ /opt/hadramout-center والشبكة ومجلد Caddy
   ```
3. إنشاء `/opt/hadramout-center/.env` من `deploy/.env.production.example`: **انسخ `PAYLOAD_SECRET` من الخادم الحالي** (تغييره يُخرج الجميع من الجلسات)، واضبط `SITE_URL` على العنوان الجديد (أو عنوان مؤقت للتجربة)، واترك `SITE_ENV=staging`.
4. تشغيل Caddy (شهادة Let's Encrypt تلقائية بعد توجيه DNS):
   ```bash
   cd /opt/caddy && SITE_HOST=example.org ACME_EMAIL=ops@example.org docker compose -f docker-compose.caddy.yml up -d
   ```
5. **عنوان الزائر الحقيقي (مهم):** معدّلات الحد (التواصل، الاشتراك، الترجمة، البحث) تعتمد على `X-Forwarded-For`. بدون Cloudflare يضعه Caddy تلقائياً. **خلف Cloudflare** يجب تفعيل السطرين المعلّقين في `Caddyfile` (`CF-Connecting-IP`) **بشرط** أن يقبل الجدار الناري 80/443 من نطاقات Cloudflare فقط، وإلا يستطيع أي أحد تزويرهما. إن أُهمل هذا فسيراكم كل الزوار تحت عناوين Cloudflare القليلة وتُرفض طلباتهم المشروعة.

## 4. المرحلة ب — نقل البيانات وتجربة كاملة (على عنوان مؤقت، `SITE_ENV=staging`)

| الخطوة | الأمر / الفعل |
|---|---|
| 1. نسخة من الخادم الحالي | `cd /opt/hadramout-center && ./scripts/backup.sh migrate` ← ملف `hadramout-migrate-*.tgz` (قاعدتا البيانات + الوسائط + الترجمات + `legacy-media`) |
| 2. نقلها | `scp` إلى الخادم الجديد |
| 3. استعادتها في الحجم قبل أول نشر | ```docker volume create hadramout-center_hc_data``` ثم ```docker run --rm -v hadramout-center_hc_data:/data -v "$PWD":/restore:ro alpine sh -c "cd /data && tar xzf /restore/hadramout-migrate-*.tgz && cp -f _bk/*.db . && rm -rf _bk && chown -R 1000:1000 /data"``` (هذا ما يفعله `restore.sh`؛ الحجم يُسمّى باسم مجلد المشروع) |
| 4. أول نشر | حدّث الأسرار و`HOST_KEY_FINGERPRINT` و`SITE_URL`/`APP_DIR` في `deploy.yml` ثم شغّل Workflow «Deploy» يدوياً. `deploy.sh` يرى `payload.db` موجودة فلا يزرع قاعدة جديدة |
| 5. تحقق | `node scripts/cutover-check.mjs https://العنوان-المؤقت --expect staging` ثم `node scripts/seo-audit.mjs` و`npm run smoke` |
| 6. تجربة فعلية | دخول `/admin`، مقال جديد، بحث، ترجمة، نموذج التواصل، التنزيلات، الاستعادة من النسخة الاحتياطية على الخادم الجديد |

## 5. المرحلة ج — يوم الإطلاق (بالترتيب)

1. **قبل بيوم:** خفّض TTL لسجلات DNS إلى 300 ثانية. أخبر المركز بتجميد التحرير.
2. على **نسخة المراجعة القديمة**: فعّل `MAINTENANCE_MODE=1` (الإدارة تبقى متاحة) ثم خذ نسخة نهائية `backup.sh final` ← استعدها على الخادم الجديد (خطوات 2–3 أعلاه مع إيقاف التطبيق الجديد أولاً).
3. على الخادم الجديد اضبط في `.env`: `SITE_URL=https://النطاق-النهائي` و`SITE_ENV=production`، ثم **أعد إنشاء الحاوية** (لا مجرد إعادة تشغيل):
   ```bash
   docker compose up -d --force-recreate app
   ```
   السبب: صفحات مثل الرئيسية تُخزَّن على قرص الحاوية بعد أول عرض وتحمل العنوان والبيئة اللذين رُسمت بهما؛ إعادة الإنشاء تبدأ بذاكرة نظيفة (وتبقى المدة القصوى 5 دقائق عبر `revalidate`).
4. حوّل DNS إلى الخادم الجديد (أو غيّر وجهة Cloudflare).
5. **فور ظهور النطاق:** `node scripts/cutover-check.mjs https://النطاق-النهائي` — يجب أن تنجح كل الفحوص (canonical، hreflang، sitemap، robots، رؤوس الفهرسة، التحويلات 301 من الروابط القديمة، البطاقات، الصحة). أي فشل ⇒ لا تُكمل.
6. أعد تشغيل `seo-audit.mjs` وراقب `/api/hc/health` وسجلات الحاوية.
7. **Cloudflare:** SSL = Full (strict)؛ قاعدة تخزين مؤقت تتجاوز `/admin` و`/api/*` و**`/sw.js`** (حالياً Cloudflare يفرض `max-age=14400` على ملف الـservice worker)؛ قاعدة اختيارية لتخزين HTML المجهول مع Purge عند النشر (تحتاج رمز Cache Purge)؛ أوقف Rocket Loader وAuto Minify (يكسران CSP)؛ فعّل Always Use HTTPS.

## 6. المرحلة د — بعد الإطلاق (أول 30 يوماً)

| متى | ماذا |
|---|---|
| يوم الإطلاق | تسجيل **خاصية النطاق** في Search Console (تحقق DNS TXT)، تقديم `sitemap.xml`، فحص صفحات عيّنة بأداة «فحص عنوان URL» |
| النطاق الجديد مختلف عن القديم | في خاصية النطاق القديم: **Change of Address** إلى الجديد؛ 301 دائمة من كل الروابط القديمة (تُبقى سنة على الأقل)؛ لا ترسل كل الروابط القديمة إلى الرئيسية |
| أسبوعياً (4 أسابيع) | تقرير الفهرسة، سجلات 404 (`npm run quality` يسرد أكثر الصفحات المفقودة طلباً) وإضافة تحويلات لها |
| نسخة المراجعة القديمة | أبقِها `noindex` ثم حوّلها 301 إلى النطاق النهائي أو أغلقها بعد اطمئنان المركز |
| دائماً | نسخ احتياطي خارج الخادم ([OPS-1](../planning/BACKLOG.md))، مراقبة وقت التشغيل على `/api/hc/health`، تجربة استعادة |

## 7. خطة التراجع

- حتى يتم التحقق النهائي يبقى الموقع القديم (والخادم الحالي) كما هو؛ التراجع = إعادة DNS (TTL المنخفض يجعله خلال دقائق).
- محتوى حُرِّر على الخادم الجديد بعد التحويل: خذ `backup.sh` منه واستعده على القديم بنفس خطوات المرحلة ب.
- النشر نفسه يتراجع تلقائياً عند فشل فحص الصحة (`deploy.sh`) ويأخذ نسخة قبل كل نشر ويتوقف إن فشلت.

## 8. أخطاء شائعة تحرسها هذه الوثيقة

| الخطأ | الحماية |
|---|---|
| فهرسة نسخة المراجعة قبل الإطلاق | `noindex` افتراضي + اختبارات الدخان |
| بقاء `noindex` بعد الإطلاق | `SITE_ENV=production` خطوة صريحة + `cutover-check.mjs` يفشل إن بقي |
| `Disallow: /` في robots (يُخفي وسم noindex عن الزواحف) | غير مستخدم عمداً + اختبار يحرسه |
| صفحات تحمل العنوان القديم بعد التحويل | إعادة إنشاء الحاوية + فحص الـcanonical/hreflang/sitemap |
| معدّلات الحد تحت عنوان Cloudflare | القسم 3 خطوة 5 |
| فشل النشر بعد تغيير الخادم بسبب بصمة المفتاح | `HOST_KEY_FINGERPRINT` ضمن الجرد |
| روابط PDF/صور تنكسر بإيقاف `files.hadramout.center` | قرار الملفات في القسم 1 |
