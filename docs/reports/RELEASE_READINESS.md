# Release readiness — redesign v3 integration

**Assessment date:** 2026-10-18  
**Status:** not ready to deploy without CI and staging verification.

| Requirement | Status | Evidence / required action |
|---|---|---|
| Source/type/lint/unit checks | Verified complete | Integrated `npm run check` passed: 110 unit tests, TypeScript, ESLint. |
| New Payload migrations | Implemented but not fully verified | Additive migrations are registered. Apply them first to a backed-up staging database. |
| Legacy URL compatibility | Implemented but not fully verified | Legacy redirect implementation is retained; run a representative redirect matrix against staging/production. |
| SEO and structured data | Implemented but not fully verified | Runtime robots/manifest, route metadata, JSON-LD, sitemap and social cards are in source; re-run `scripts/seo-audit.mjs` on the deployed build. |
| Accessibility | Implemented but not fully verified | New keyboard/ARIA controls and contrast tests exist. Run `npm run a11y` against a running integrated server plus manual keyboard checks. |
| Production build | Incomplete | Local Windows Turbopack and Webpack builds did not reach a final artifact during this assessment; CI must produce and retain a successful build log. |
| Security controls | Implemented but not fully verified | CSP, Payload role rules, honeypots and rate limits are present. Complete deployment configuration review and endpoint smoke tests. |
| Content accuracy | Blocked | Center must confirm About/leadership content, editorial exceptions, and migrated taxonomy classifications. |
| Cloudflare cache/translation setup | Blocked | Requires owner-managed Cloudflare credentials and configuration. |
| Deployment / rollback | Implemented but not fully verified | Existing CI/CD deployment, health check, backup, and rollback scripts are present. Do not deploy until CI and staging checks pass. |

## Go/no-go

**No-go** until the production build passes in CI or a clean Linux container, migrations have been applied to staging from a backup, and the post-deploy smoke/a11y/redirect checks pass. No remote change was made by this integration.
