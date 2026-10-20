/**
 * Maintenance mode: while the flag is on, every public page answers 503 with Retry-After (search engines treat this as
 * "come back later", not as removed content). The admin, the API (health checks, uploads), and static assets keep working
 * so editors can still sign in and the deploy health check still passes.
 */
const EXEMPT = /^\/(admin|api|_next|brand|icons|fonts)(\/|$)|^\/(favicon\.ico|robots\.txt)$/;

export const isMaintenanceExempt = (pathname: string): boolean => EXEMPT.test(pathname);

export const RETRY_AFTER_SECONDS = 600;

/** Self-contained page (no external CSS/JS/fonts), Arabic first with an English line. Dark like the site's default theme. */
export const MAINTENANCE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0e1815">
<title>الموقع قيد الصيانة | مركز حضرموت</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0e1815; color: #ece8df; font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif; line-height: 1.8; text-align: center; padding: 1.5rem; }
  main { max-width: 34rem; }
  h1 { font-size: clamp(1.5rem, 4vw, 2.1rem); margin: 0 0 .5rem; color: #e0b96a; }
  p { margin: .4rem 0; color: #cfd5cd; }
  .en { direction: ltr; color: #a8b1aa; font-size: .95rem; margin-top: 1.25rem; }
</style>
</head>
<body>
<main>
  <h1>الموقع قيد الصيانة</h1>
  <p>نُجري تحديثاً قصيراً على منصة مركز حضرموت للدراسات التاريخية والتوثيق والنشر، وسنعود خلال دقائق.</p>
  <p class="en" lang="en">Hadhramout Center is briefly down for maintenance. Please check back in a few minutes.</p>
</main>
</body>
</html>`;
