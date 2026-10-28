# Security review

**Purpose:** what protects the platform, what was verified and how, and what is still open. **Scope:** the Next.js + Payload application, its edge configuration in this repository, and the production site as seen from outside (GET/HEAD only). **Last updated:** 2026-10-28
**Not covered:** penetration testing or fuzzing, the Contabo host and its other services (mailcow etc.), Cloudflare account settings (WAF, rules), anything behind the owner's credentials.
**Related:** [CURRENT_STATE_AUDIT](../audit/CURRENT_STATE_AUDIT.md) · [BACKLOG](../planning/BACKLOG.md) · [SYSTEM_ARCHITECTURE](../architecture/SYSTEM_ARCHITECTURE.md)

## 1. Method

| Check | How | Date |
|---|---|---|
| Code review of every route that accepts input or returns data | reading `src/app/api/**`, `src/app/feeds`, `src/proxy.ts`, `src/lib/legacy-media.ts`, collections' `access` rules, `sanitize.ts` | 2026-10-19/20 |
| Live probes | `curl` GET/HEAD against production: headers, `/api/users`, `/api/graphql`, `/.env`, `/.git/config`, REST limits | 2026-10-19/20 |
| Secret hygiene | `git ls-files`, current-tree and full-history search for key patterns (`sk-`, `AKIA`, `ghp_`, private-key blocks, Cloudflare tokens) | 2026-10-20 — nothing found; `.env` is git-ignored |
| Dependency audit | `npm audit --omit=dev` | 2026-10-20 — 12 advisories, none with a runtime path (see §4) |
| Automated review skill | the security-review workflow was started on this branch's changes; its agent was cut off by a usage limit before reporting, so the branch's new code was reviewed by hand instead (§3) | 2026-10-20 |

## 2. Controls present (verified)

| Area | Control | Evidence |
|---|---|---|
| Transport | HSTS 2 years, includeSubDomains, preload | live header |
| Headers | CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, mic, geolocation, payment off), COOP same-origin | live headers, `next.config.ts` |
| Client IP | nginx overwrites `X-Forwarded-For` with the real client address (`real_ip_header CF-Connecting-IP` from Cloudflare ranges only), so rate-limit keys cannot be spoofed | `deploy/nginx/hadramout-center.conf` |
| Public writes | contact, newsletter, reviews: honeypot field, per-client and global rate limits, one review per item per day; stored in collections with `create: () => false` (only server routes write), `read` staff only | `api/hc/*`, `collections/Forms.ts`, `Reviews.ts` |
| Admin auth | 12 h tokens, lock after 5 failed logins for 15 min, `SameSite=Lax`, `Secure` in production; first user can be created only while no user exists | `collections/Users.ts` |
| Roles | admin / editor / reviewer; reviewers cannot touch Arabic source fields | `collections/shared.ts` |
| Public reads | anonymous access limited to `status = published` | `readPublished` |
| REST surface | reads clamped to `limit ≤ 100`, `depth ≤ 2` (a request for 1000 items at depth 3 used to return 1.4 MB); GraphQL and its playground removed | `src/proxy.ts`, live 307/404 |
| Rich text | server-side allow-list sanitiser on every stored body (tags, `http/https/mailto/tel` only, images `http/https`, iframes only YouTube over https, disallowed tags discarded) | `src/lib/sanitize.ts`, `tests/unit/sanitize.test.ts` |
| Legacy media proxy | fixed upstream origin (no SSRF), path allow-list and extension allow-list, traversal blocked, redirects refused, size cap, SVG served sandboxed | `src/lib/legacy-media.ts`, `legacy-media/[...path]/route.ts` |
| Errors | health endpoint no longer reveals user existence or error text; failures are 5xx, not cached 404s; route error boundary | `api/hc/health`, `src/lib/errors.ts` |
| Output encoding | RSS built with escaped text and numeric-only ids; CSV export neutralises spreadsheet formulas and quotes per RFC 4180; JSON-LD serialiser cannot close the script element | `feeds/[lang]/[file]/route.ts`, `src/lib/catalog.ts`, `jsonld.ts` |
| Input validation on new routes | language must be a real code; catalogue type must be an own listed value (inherited keys such as `constructor` rejected, tested); topic/author ids digits only; out-of-range ids are 404 | `suggest/route.ts`, `catalog.ts`, `errors.ts` |
| Offline support | the service worker intercepts only same-origin GET navigations and immutable build files, serves cached copies only when offline and only for pages the reader saved, accepts messages only for same-origin URLs, caps storage | `public/sw.js`, 11 sandbox tests |
| Deploy safety | pre-deploy backup is mandatory (deploy aborts if it fails); health-check rollback | `deploy/scripts/deploy.sh` |
| Secrets | none tracked, none in history; production secrets only in the server `.env` and GitHub Actions secrets | §1 |

## 3. Review of the code added in this pass

No exploitable vulnerability with a clear attack path was found. Candidates considered and why they do not qualify:

| Candidate | Reason it is not a vulnerability |
|---|---|
| REST clamp redirect reflects the query string in `Location` | the target is built from the normalised path (always `/api/…`) and a re-serialised `URLSearchParams` (encoded), so neither another host nor header injection is possible |
| Feed `<atom:link href>` includes the `file` path segment | only names matching `all`, a known section, `topic-<digits>` or `author-<digits>` reach the template; everything else is 404 |
| Catalogue export of draft data | queried with `overrideAccess: false` and `status = published` |
| Catalogue CSV formula injection | leading `= + - @ TAB CR` are prefixed with an apostrophe (unit-tested) |
| `copy` handler builds HTML | reads the already-sanitised article DOM and appends a `textContent` line; nothing is parsed from user input |
| Service worker caching authenticated pages | the public site renders no per-user content; copies are created only for URLs the page itself sends after the reader saved an article; cross-origin and non-HTML responses are refused |
| Maintenance mode exempts `/api` | intended (health check, admin uploads); nothing new is exposed |
| Zero-result search terms stored | staff-only (quality report), capped at 500 distinct per day, never shown publicly; queries could contain whatever a visitor types — the privacy statement should say searches are recorded anonymously |
| Quality report script | local CLI, read-only SQLite, static SQL |

One real defect was found in the new code by this review and fixed: `/api/hc/catalog?type=constructor` passed the type check (plain object lookup) and ended in a 500. It is now a 400 and is guarded in the smoke test. It had no security impact beyond the error.

## 4. Open items

| ID | Severity | Item | Recommendation | Status |
|---|---|---|---|---|
| SEC-001 | medium | CSP allows `script-src 'unsafe-inline'` (needed by Next's inline bootstrap and the theme initialiser) | nonce-based CSP; requires dynamic rendering of every page, so measure the cost first | open (BACKLOG SEC-1) |
| SEC-002 | low | Public Payload REST still exposes internal fields of published documents (`translationMeta`, `legacyUrl`, `source`, `edited`) | a minimal public projection. **Not** a plain field-level `access.read`: the site's own reads in `src/lib/data.ts` run with `overrideAccess: false` as a visitor and need `translationMeta` (translation banner, indexability), so that change would break pages | open (re-checked 2026-10-28) |
| SEC-003 | low | Any signed-in staff role (including reviewer) can read all users and their emails | restrict `read` on users to admins and the user themself | **done 2026-10-27** — verified through the Payload local API: an editor lists only their own account and gets "not found" for others; admins see all |
| SEC-010 | medium | The "translation reviewer" role could change non-localized fields: publish/unpublish (`status`), `featured`, dates, authors, category, files | every non-localized field of the content collections is read-only for reviewers (`lockForReviewers`) | **done 2026-10-27** — 4 unit tests; local-API check: status, featured and the Arabic title unchanged, the English title fixed |
| SEC-011 | medium | `/admin` and `/api` had no anti-framing header (the public CSP excludes them on purpose, nothing replaced it): another site could frame the signed-in admin and trick a click (clickjacking) | `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'` on both | **done 2026-10-28** — `next.config.ts`; smoke asserts both headers on `/admin/login`, `/admin`, `/api/news`; `admin-e2e` asserts them in the browser |
| SEC-012 | low | No email adapter is configured, yet Payload's `POST /api/users/forgot-password` stays active: anyone can make it store reset tokens and log staff addresses (the default adapter logs recipient and subject only, not the token), and the UI promised an email | the admin's "forgot password" screen explains the real procedure (an admin sets a temporary password) and the endpoint is refused; when a mail provider is added, set `MAIL_PROVIDER` and remove the custom screen | **done 2026-10-28** — the screen explains the procedure; a `beforeOperation` hook on users refuses the operation (any path spelling — Payload matches case-insensitively, found by the security subagent) and `src/proxy.ts` answers 403 early, until `MAIL_PROVIDER` is set (smoke-tested incl. `/Forgot-Password`) |
| SEC-013 | medium | Media uploads accepted `image/*`, which includes SVG; an SVG can carry script and is served from the site's own origin (`/api/media/file/…`), so an editor account could plant a file that acts with an administrator's session when opened (privilege escalation editor → admin) | raster formats and PDF only | **done 2026-10-28** — `Media.ts` mime list; `admin-e2e` uploads a PNG (accepted, served) and an SVG (refused). No SVG existed in the media library |
| SEC-014 | low | Config CSP headers replace route-level ones (Next keeps the first value): `/legacy-media/*` lost its `sandbox` CSP to the public one, and the new `/api` header would have dropped Payload's `script-src 'none'` on uploaded files | `legacy-media` excluded from the public CSP rule; `/api/media/file/*` gets `script-src 'none'; frame-src 'none'` plus the anti-framing directives | **done 2026-10-28** — smoke asserts the file CSP |
| SEC-016 | medium | First CodeQL scan (2026-10-29, `security-extended`): 24 alerts | **fixed in code:** `sanitizeText` decoded `&amp;` first, so the literal text `&lt;b&gt;` came out as a tag (#8); sitemap `esc` did not escape quotes inside `href`/`hreflang` (#10–12); BibTeX escaping was duplicated, one copy left `\` unescaped (#14, #15 — now one single-pass `bibEsc`, backslash → `\textbackslash{}`); `ui-store` turned any `lang` into a file path (#5–7; every caller validates against the registry, now the store itself refuses anything that is not a language tag) and checked existence before reading (#21, #25 — a resolved-path containment check plus one file descriptor for the freshness check and the read). Regression tests for each; after the re-scan 0 alerts remain in runtime code, 13 open = exactly the dismiss list below. **To dismiss (triaged, not exploitable):** #1–3 (QA script, escaped origin, fixed language list), #4, #9, #16 (read-only QA crawler of the site's own HTML), #13 (constant host list), #17, #19 (one-off importer: plain fields escaped on render; emoji replacement is not a security check), #18 (sending text to the translation API is the feature), #22–24 (legacy media mirror, paths validated by `resolveLegacyPath`, sandbox CSP), #20 (test file; `tests/` is now excluded from analysis) | **done 2026-10-29** (code fixes); dismissals need a repository admin in Security → Code scanning |
| SEC-004 | medium | Admin has no second factor | Cloudflare Access in front of `/admin` (no code change), or TOTP | owner decision (FEATURE_PLAN §5) |
| SEC-005 | medium | The deploy workflow connects as `root` to a VPS shared with other services | a dedicated deploy user limited to this project's docker compose | open, needs the owner |
| SEC-006 | low | Anonymous traffic can consume the daily translation budget (bounded by the daily character cap and the 600/hour bucket) | signed short-lived token from the page render; reserve budget for editors | open (ARCH-011) |
| SEC-007 | medium | Backups live on the same server | copy off-server and rehearse a restore | blocked on destination (OPS-1) |
| SEC-008 | info | Production advisories (2026-10-29: 14 = 0 critical, 3 high, 5 moderate, 6 low). The critical `dompurify` (admin code editor) and the moderate `fast-uri` are fixed through `overrides`. The 3 high are one issue, `happy-dom` ≤21.0.3 under Payload's `@lexical/headless` 0.50 (pinned by `@payloadcms/richtext-lexical` 3.92.x; the fix needs happy-dom 21, a major that Lexical 0.50 does not accept). It concerns scripts executed inside happy-dom; the site uses it only server-side for editor HTML conversion of staff content, never for visitor input | update Payload when it moves to Lexical ≥0.53; Dependabot groups the Payload packages | **audit gate in CI 2026-10-29** (`npm audit --omit=dev --audit-level=critical`); `happy-dom` accepted until Payload updates |
| SEC-015 | medium | CI supply chain: actions referenced by movable tags, default token permissions on CI/Lighthouse, checkout tokens persisted in the workspace, workflow inputs expanded into shell (template injection in the deploy's rollback `tag`) | pin every action to a commit SHA, least-privilege `permissions`, `persist-credentials: false`, inputs via `env` with validation; lint the workflows in CI | **done 2026-10-29** — zizmor 33 → 0 findings, actionlint clean; `workflows` job in CI; CodeQL (JS/TS + Actions) on the public repository. Repository settings: secret scanning and push protection, Dependabot alerts and security updates, private vulnerability reporting (`SECURITY.md`) enabled; `master` refuses force-pushes and deletion and requires linear history (fast-forward pushes, as the release procedure already does) |
| SEC-009 | low | The privacy statement should mention anonymous search-term and 404-path logging and the contact/review/newsletter data kept in the database | wording to be approved by the Center | open |

## 5. How to re-verify

```bash
npm run check && npm run build && npm run smoke          # includes REST clamp, GraphQL 404, catalogue type, health body, headers behaviour
node scripts/seo-audit.mjs https://hadramout-center.novixa.dev
curl -sI https://hadramout-center.novixa.dev/ar | grep -i -E 'strict-transport|content-security|x-content-type'
npm audit --omit=dev
git log --all -p -G'(sk-|AKIA|ghp_|PRIVATE KEY)' | head      # expect nothing
```
