# منصة مركز حضرموت للدراسات التاريخية والتوثيق والنشر

منصة معرفية وأرشيفية متعددة اللغات (العربية هي الأصل، ≈90 لغة بالترجمة الآلية) — Next.js 16 + Payload CMS 3 + SQLite.
تطوير **Novixa** — Eng. Abdulrahman Khaled Radwan.

## تشغيل محلي
```bash
cp .env.example .env        # عدّل PAYLOAD_SECRET وأضف ADMIN_EMAIL/ADMIN_PASSWORD
npm ci
npm run db:seed             # يستورد المحتوى (1,454 عنصراً) وينشئ المدير
npm run dev                 # http://localhost:3000  ·  الإدارة: /admin
```
| الأمر | الغرض |
|---|---|
| `npm run check` | typecheck + lint + tests |
| `npm test` | اختبارات الوحدة |
| `npm run build && npm start` | بناء الإنتاج |
| `npm run generate:types` | بعد تغيير المجموعات |

## الوثائق
- الفهرس: `docs/` — التدقيق `01-audit`، الخطة والمعمارية `02-plan`، المتتبع `03-tracking`، الاختبار `04-qa`، **النشر `05-deploy`**، التسليم `06-handover`.
- قواعد العمل للوكلاء: `AGENTS.md` و`.agents/rules/`.

## الترجمة
المحرر يكتب بالعربية فقط. عند طلب زائر لغة أخرى تُنشأ الترجمة تلقائياً (مزوّد يُضبط بـ`TRANSLATION_PROVIDER`: `anthropic` | `google` | `libretranslate` | `mock` | `none`) وتُخزَّن، ولا تُستبدل التعديلات اليدوية.

## النشر
Docker + GitHub Actions (nginx الخاص بـmailcow خلف Cloudflare) — راجع `docs/05-deploy/01-vps-deploy-guide.md`.
