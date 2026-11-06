# منصة مركز حضرموت للدراسات التاريخية والتوثيق والنشر

أرشيف رقمي ومعرفة مفتوحة، **عربي أولاً** ويُترجم تلقائياً إلى نحو 90 لغة. تطوير Novixa — م. عبدالرحمن خالد رضوان.

[![CI](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/ci.yml)
[![Deploy](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/codeql.yml/badge.svg)](https://github.com/Novixa-dev/hadramout-center-platform/actions/workflows/codeql.yml)

| | |
|---|---|
| **الموقع (نسخة المراجعة)** | https://hadramout-center.novixa.dev — غير مفهرس حتى الإطلاق |
| **لوحة التحكم** | `/admin` |
| **التقنية** | Next.js 16 · Payload CMS 3 · SQLite (libSQL) · TypeScript · Node 24 |
| **المحتوى** | 1,454 عنصراً (909 مقالة، 387 خبراً، 52 كتاباً، 40 عدداً، 64 فعالية) + 12 صفحة مؤسسية |

> **للقراءة أولاً:** [الدليل الشامل](docs/manual/index.html) (يُفتح في المتصفح، ونسخة PDF بجانبه) · [وثيقة التسليم](docs/06-handover/HANDOVER.md) · [فهرس الوثائق](docs/00-INDEX.md) · [أين وصل العمل](docs/planning/PROGRESS.md)

## تشغيل محلي
```bash
cp .env.example .env          # عدّل PAYLOAD_SECRET وأضف ADMIN_EMAIL / ADMIN_PASSWORD
npm ci
npm run payload migrate       # إنشاء قاعدة البيانات
npm run db:seed               # المحتوى (1,454 عنصراً) + الصفحات + المدير
npm run dev                   # http://localhost:3000  ·  الإدارة: /admin
```

| الأمر | الغرض |
|---|---|
| `npm run check` | typecheck + lint + اختبارات الوحدة (يعمل تلقائياً قبل كل commit) |
| `npm run knip` | ملفات وحزم وتصديرات غير مستخدمة |
| `TRANSLATION_PROVIDER=none npm run build` | بناء الإنتاج (وضع الإنتاج يرفض `mock`) |
| `DB_DIR=… RUN_E2E=1 npm run smoke` | فحص التشغيل الشامل: المسارات، SEO، التحويلات، متصفح حقيقي |
| `npm run quality` | تقرير جودة المحتوى للمحررين (قراءة فقط) |
| `npm run manual:pdf` | تصدير الدليل الشامل إلى PDF (يتطلب Chrome) |
| `node scripts/cutover-check.mjs <url>` | فحص بعد النشر أو الانتقال إلى نطاق جديد |

## كيف نعمل
- **الدفع إلى `master` ينشر.** قاعدة المالك: لا طلبات دمج لعمل الفريق؛ نتحقق محلياً (`check`، بناء، smoke) ثم fast-forward (لا force)، ونراقب Deploy، ثم نفحص الموقع الحي. التراجع تلقائي عند فشل فحص الصحة.
- **الموقع نسخة معاينة حتى الإطلاق:** `SITE_ENV=production` وحده يجعله قابلاً للفهرسة.
- **لا اختلاق:** كل معلومة مؤسسية لها مصدر موثّق (الموقع القديم أو مواد المركز).
- **قواعد الوكلاء والمساعدين:** [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) · `.agents/rules/`.

## خريطة المستودع
```
src/app          المسارات (الموقع العام، لوحة Payload، API، الخلاصات، البطاقات)
src/collections  نماذج البيانات        src/migrations  ترحيلات قاعدة البيانات
src/components   واجهة React           src/lib         المنطق (بحث، SEO، استشهاد…)
src/i18n         اللغات والترجمة       src/seed        المحتوى الافتراضي وصفحات المركز
src/styles       tokens + CSS          messages/       نصوص الواجهة (ar, en)
scripts/         فحوص التشغيل والتدقيق  deploy/         Docker وسكربتات النشر والنسخ
content/         لقطة الموقع القديم     docs/           الوثائق (انظر الفهرس)
clients-notes-and-files/                ملفات وردت من المركز (تحليلها في docs/client)
```

## الوثائق حسب الحاجة
| أريد… | أذهب إلى |
|---|---|
| فهم المنصة كلها | [الدليل الشامل](docs/manual/index.html) |
| متابعة ملاحظات المركز | [docs/client](docs/client/README.md) |
| إدارة المحتوى والترجمة | [دليل المحرر](docs/06-handover/admin-guide-ar.md) · [الترجمة](docs/06-handover/translation-guide-ar.md) |
| النشر والانتقال والنسخ الاحتياطي | [docs/05-deploy](docs/05-deploy/) |
| الاختبار | [test runbook](docs/04-qa/02-test-runbook.md) |
| الأمان | [SECURITY.md](SECURITY.md) · [المراجعة الأمنية](docs/security/SECURITY_REVIEW.md) |
| الأفكار والخارطة | [IDEAS_AND_ROADMAP](docs/planning/IDEAS_AND_ROADMAP.md) · [ROADMAP](docs/planning/ROADMAP.md) · [BACKLOG](docs/planning/BACKLOG.md) |
