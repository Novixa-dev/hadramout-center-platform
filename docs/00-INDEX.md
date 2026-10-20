# فهرس الوثائق — منصة مركز حضرموت

**الإنتاج:** https://hadramout-center.novixa.dev · **المستودع:** Novixa-dev/hadramout-center-platform

| المجلد | المحتوى |
|---|---|
| `01-audit` | تدقيق المستودع القديم والموقع القديم وأفضل الممارسات |
| `02-plan` | قرار الإطار، الخطة الرئيسية، المعمارية، نظام التصميم، **الترجمة**، كتالوج الميزات، نموذج المحتوى، القرارات |
| `03-tracking` | `TRACKER.md` — الحالة الحالية والمتبقي |
| `04-qa` | دليل الاختبار البشري |
| `05-deploy` | دليل النشر على الخادم، خيارات النطاق والتحويل |
| `06-handover` | دليل المحرر (`admin-guide-ar.md`) ودليل الترجمة (`translation-guide-ar.md`) |
| `07-marketing` | خطة حملة الإطلاق |
| `08-review` | مراجعة الموقع القديم مقابل الجديد وخطة التحسين |
| `09-redesign` | **التصميم v3**: خط الأساس والخطة، التغييرات، مشكلات المحتوى للمراجعة، تقرير الجودة، أفكار مؤجّلة |
| `audit`, `architecture`, `migration`, `research` | **تدقيق 2026-10**: جرد الموقع القديم، المعمارية الفعلية، نموذج البيانات والتصنيف، خطة الترحيل وخريطة التحويلات، مراجعة المنافسين (إنجليزية) |
| `05-deploy` (جديد) | `03-move-to-new-host-and-domain.md` — دليل الانتقال إلى الاستضافة والنطاق الجديدين، و`deploy/standalone-host/` (Caddy) |
| `06-handover` (جديد) | `client-requirements-checklist-ar.md` — ما نحتاجه من المركز + أجندة الاجتماع |
| `research` (جديد) | `CLAUDE_WORKFLOW_BEST_PRACTICES.md` — كيف نعمل مع Claude بأفضل أسلوب (مصادر رسمية) وما اعتمدناه |
| `security` | `SECURITY_REVIEW.md` — الضوابط الموثّقة والبنود المفتوحة |
| `planning`, `reports` | `planning/PROGRESS.md` نقطة المتابعة · `planning/ROADMAP.md` خارطة الطريق · `planning/BACKLOG.md` سجل المهام · `planning/FEATURE_PLAN.md` خطة الميزات ووعودنا · `reports/BASELINE_REPORT.md` خط الأساس · `reports/RELEASE_READINESS.md` جاهزية الإطلاق |
| `archive/v1` | وثائق النسخة الأولى (مرجع تاريخي — لا يُعتمد عليها) |

## أوامر أساسية
```bash
npm ci && cp .env.example .env && npm run db:seed && npm run dev   # محلياً
npm run check        # typecheck + lint + tests
npm run a11y         # axe على 12 صفحة (يتطلب خادماً يعمل)
node scripts/seo-audit.mjs <url>   # فحص SEO/OG/JSON-LD/robots/sitemap لموقع يعمل
npm run import:images
```
قواعد الوكلاء: `AGENTS.md` و`.agents/rules/` · مهارة التصميم: `.claude/skills/frontend-design`.
