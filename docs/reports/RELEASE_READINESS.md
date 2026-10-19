# Release readiness — redesign v3 integration

**Assessment date:** 2026-10-19 (supersedes 2026-10-18)
**Status:** not ready to deploy until CI is green on the PR and the backup/migration rehearsal on the server is done.

| Requirement | Status | Evidence / required action |
|---|---|---|
| Source/type/lint/unit checks | Verified complete | Integrated `npm run check` passed: 110 unit tests, TypeScript, ESLint. |
| New Payload migrations | Rehearsed locally | Migrations 3–6 applied in < 1 s to a copy of the production database, with no errors. Migration 4 merges duplicate categories irreversibly: the deploy now aborts if the pre-deploy backup fails. Still run the rehearsal on the server copy. |
| Legacy URL compatibility | Implemented but not fully verified | Legacy redirect implementation is retained; run a representative redirect matrix against staging/production. |
| SEO and structured data | Verified locally | `scripts/seo-audit.mjs` on the local production build: 0 errors, 0 warnings on every route type. Fixed: magazine citation journal title, invalid video thumbnail URL, citation boilerplate in descriptions. Re-run on the deployed build. |
| Accessibility | Partially verified | axe: no violations on 12 pages (local build). Contrast covered by unit tests. Manual keyboard / screen-reader checks not done. |
| Production build | Verified locally | `next build` passes on a clean install with `TRANSLATION_PROVIDER=none` (the local `.env` value `mock` is rejected in production mode by design). CI/Docker build still the release gate. See [BASELINE_REPORT](BASELINE_REPORT.md). |
| Security controls | Improved, partially verified | Verified: CSP/HSTS/headers on production, XFF cannot be spoofed (edge overwrites it from CF-Connecting-IP), legacy-media proxy has a fixed origin and blocks traversal. Fixed: unbounded public REST reads, GraphQL exposure, health leak. Open: `script-src 'unsafe-inline'`, translation-budget abuse (ARCH-009..011). Full review not completed — see [PROGRESS](../planning/PROGRESS.md). |
| Content accuracy | Blocked | Center must confirm About/leadership content, editorial exceptions, and migrated taxonomy classifications. |
| Cloudflare cache/translation setup | Blocked | Requires owner-managed Cloudflare credentials and configuration. |
| Deployment / rollback | Hardened, not exercised | Backup now includes mirrored images and is mandatory before deploy. Rollback and restore scripts exist but were not exercised in this pass. |

## Go/no-go

**No-go** until CI passes on the PR, `backup.sh` is confirmed on the server, and the post-deploy smoke/a11y/redirect checks pass. Nothing has been deployed; changes are on branch `claude/audit-and-hardening-20261019` for review.
