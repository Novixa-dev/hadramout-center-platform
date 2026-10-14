# دليل النشر على الخادم (VPS)

الهدف: تشغيل المنصة على `https://hadramout-center.novixa.dev` (أو نطاق آخر — انظر `02-domain-options.md`) بنشر آلي عبر GitHub Actions.

## 1. المتطلبات
- VPS بنظام Ubuntu 22.04/24.04، **2 vCPU / 2–4 GB RAM / 20 GB SSD** كحد أدنى.
- نطاق فرعي يشير بسجل `A` (و`AAAA` إن وُجد) إلى IP الخادم.
- حساب GitHub بصلاحية على المستودع.

## 2. تجهيز الخادم (مرة واحدة)
```bash
# كمستخدم root
apt update && apt -y upgrade
curl -fsSL https://get.docker.com | sh
adduser --disabled-password --gecos "" deploy && usermod -aG docker deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw allow 443/udp && ufw --force enable
mkdir -p /opt/hadramout/backups && chown -R deploy:deploy /opt/hadramout
```
أنشئ مفتاح SSH مخصصاً للنشر على جهازك (`ssh-keygen -t ed25519 -f hc_deploy`) وأضف المفتاح العام إلى `/home/deploy/.ssh/authorized_keys`.

## 3. ملف البيئة على الخادم
انسخ `deploy/.env.production.example` إلى `/opt/hadramout/.env` واملأه:
- `PAYLOAD_SECRET`: `openssl rand -hex 32` (لا يتغير بعد الإطلاق).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: أول مدير.
- `ANTHROPIC_API_KEY` (أو مزوّد آخر) لتفعيل الترجمة الآلية. بدونه اضبط `TRANSLATION_PROVIDER=none`.

## 4. أسرار GitHub (Settings ← Secrets and variables ← Actions)
| السر | القيمة |
|---|---|
| `VPS_HOST` | عنوان IP أو اسم الخادم |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | المفتاح الخاص (محتوى `hc_deploy`) |
| `VPS_PORT` | اختياري (22) |
| `VPS_PATH` | اختياري (`/opt/hadramout`) |

وأنشئ Environment باسم `production` (يمكن إضافة موافقة يدوية عليه).
في Settings ← Packages اجعل صورة GHCR قابلة للقراءة من الخادم: إما بجعلها عامة، أو نفّذ على الخادم مرة واحدة `docker login ghcr.io` برمز PAT بصلاحية `read:packages`.

## 5. أول نشر
1. ادفع إلى `master` (أو شغّل Deploy يدوياً من تبويب Actions). يبني الـWorkflow الصورة، يدفعها إلى GHCR، ثم يرفع `docker-compose.yml` و`Caddyfile` و`scripts/` ويشغّل `deploy.sh`.
2. على الخادم، مرة واحدة، لاستيراد المحتوى الأولي (1,454 عنصراً) وإنشاء المدير:
```bash
cd /opt/hadramout
docker compose run --rm tools npm run db:seed
```
3. افتح `https://النطاق/admin` وسجّل الدخول.

> الهجرات (migrations) تُطبَّق تلقائياً عند إقلاع التطبيق. `deploy.sh` يأخذ نسخة احتياطية قبل كل نشر، ويتحقق من الصحة (`/api/hc/health`)، ويتراجع آلياً إلى الصورة السابقة عند الفشل.

## 6. التراجع اليدوي
من GitHub ← Actions ← Deploy ← Run workflow، وأدخل وسم صورة سابقة (مثل `sha-1a2b3c4`).

## 7. النسخ الاحتياطي
```bash
crontab -e   # للمستخدم deploy
15 3 * * * /opt/hadramout/scripts/backup.sh daily >> /opt/hadramout/backups/cron.log 2>&1
```
- يحتفظ بآخر 14 نسخة. انسخ المجلد `backups/` دورياً خارج الخادم (rclone/rsync).
- الاستعادة: `./scripts/restore.sh backups/<الملف>.tgz`
- **اختبر الاستعادة مرة على الأقل قبل الإطلاق.**

## 8. التشغيل اليومي
```bash
docker compose ps                 # الحالة
docker compose logs -f app        # السجلات
docker compose restart app        # إعادة تشغيل
curl -s https://النطاق/api/hc/health
```
المراقبة: أضف `https://النطاق/api/hc/health` إلى UptimeRobot أو Better Stack.

## 9. نقطتان للانتباه
- قاعدة البيانات ملف SQLite على قرص واحد ⇒ **نسخة واحدة من التطبيق فقط** (لا توسّع أفقي). يكفي مئات الآلاف من الزيارات شهرياً؛ للانتقال لاحقاً إلى Postgres يلزم تبديل المحوّل وإعادة توليد الهجرات.
- تكلفة الترجمة تُضبط بـ`TRANSLATION_DAILY_CHAR_LIMIT` و`TRANSLATION_MODEL`؛ راقب مجموعة «استهلاك الترجمة» في لوحة الإدارة.
- لم يُختبر Docker محلياً (الخدمة غير مشغلة على جهاز التطوير)؛ **شغّل أول نشر على بيئة تجريبية وراجع السجلات**.
