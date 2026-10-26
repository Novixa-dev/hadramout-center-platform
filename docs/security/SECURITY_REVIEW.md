# Security review

**Purpose:** what protects the platform, what was verified and how, and what is still open. **Scope:** the Next.js + Payload application, its edge configuration in this repository, and the production site as seen from outside (GET/HEAD only). **Last updated:** 2026-10-20
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
| SEC-002 | low | Public Payload REST still exposes internal fields of published documents (`translationMeta`, `legacyUrl`, `source`, `edited`) | field-level `access.read` for staff only, or a minimal public projection | open |
| SEC-003 | low | Any signed-in staff role (including reviewer) can read all users and their emails | restrict `read` on users to admins and the user themself | **done 2026-10-27** — verified through the Payload local API: an editor lists only their own account and gets "not found" for others; admins see all |
| SEC-010 | medium | The "translation reviewer" role could change non-localized fields: publish/unpublish (`status`), `featured`, dates, authors, category, files | every non-localized field of the content collections is read-only for reviewers (`lockForReviewers`) | **done 2026-10-27** — 4 unit tests; local-API check: status, featured and the Arabic title unchanged, the English title fixed |
| SEC-004 | medium | Admin has no second factor | Cloudflare Access in front of `/admin` (no code change), or TOTP | owner decision (FEATURE_PLAN §5) |
| SEC-005 | medium | The deploy workflow connects as `root` to a VPS shared with other services | a dedicated deploy user limited to this project's docker compose | open, needs the owner |
| SEC-006 | low | Anonymous traffic can consume the daily translation budget (bounded by the daily character cap and the 600/hour bucket) | signed short-lived token from the page render; reserve budget for editors | open (ARCH-011) |
| SEC-007 | medium | Backups live on the same server | copy off-server and rehearse a restore | blocked on destination (OPS-1) |
| SEC-008 | info | 12 production advisories remain, all in build/dev tooling or editor peers, no runtime path | re-run `npm audit` after each Payload release; add an audit step and automated update PRs to CI | partly done (OPS-3) |
| SEC-009 | low | The privacy statement should mention anonymous search-term and 404-path logging and the contact/review/newsletter data kept in the database | wording to be approved by the Center | open |

## 5. How to re-verify

```bash
npm run check && npm run build && npm run smoke          # includes REST clamp, GraphQL 404, catalogue type, health body, headers behaviour
node scripts/seo-audit.mjs https://hadramout-center.novixa.dev
curl -sI https://hadramout-center.novixa.dev/ar | grep -i -E 'strict-transport|content-security|x-content-type'
npm audit --omit=dev
git log --all -p -G'(sk-|AKIA|ghp_|PRIVATE KEY)' | head      # expect nothing
```
