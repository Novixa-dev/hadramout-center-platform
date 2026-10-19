# Baseline report

**Purpose:** the verified starting state of the repository for the 2026-10-18/19 audit-and-hardening pass.
**Last updated:** 2026-10-19 · **Related:** [RELEASE_READINESS](RELEASE_READINESS.md) · [IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md) · [PROGRESS](../planning/PROGRESS.md)

## Repository state (before any change)

| Item | Observation |
|---|---|
| Branch | `master`, 10 commits ahead of `origin/master` (redesign v3 fast-forwarded in, not yet pushed or deployed) |
| Uncommitted | Two report files with trailing-whitespace-only edits (kept, committed) |
| Untracked | `.node_modules.recovery-20261018/` — a complete copy of an earlier `node_modules`. Left untouched; now ignored by git, Docker and ESLint |
| Other branches | All ten older `claude/*` branches are already merged into `master` (`git branch --merged master`); none was merged or deleted in this pass |
| Remote | `Novixa-dev/hadramout-center-platform`; `master` deploys to production automatically |

## Environment problems found and resolved

| Problem | Evidence | Resolution |
|---|---|---|
| `node_modules` was half-restored | `next/package.json` missing, `payload` without `.d.ts` → 230 TypeScript errors | `npm ci` from the lockfile (596 packages) |
| ESLint crashed at the repo root | It walked into the recovery folder and loaded a foreign `eslint.config.js` | Folder added to ESLint ignores, `.gitignore`, `.dockerignore` |
| Local `next build` failed | Local `.env` sets `TRANSLATION_PROVIDER=mock`; production-mode config rejects it by design (`src/config.ts:72`). The earlier "Windows build never finished" note is explained by the broken install plus this | Build with `TRANSLATION_PROVIDER=none`. CI/Docker are unaffected (no provider set) |

## Verified baselines (clean install, Node 24.15, Windows 11)

| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| `eslint .` | pass (now also covers `.tsx`) |
| Unit tests | 110 pass at baseline → 119 pass after this pass |
| `next build` (Turbopack, `TRANSLATION_PROVIDER=none`) | pass, `BUILD_ID` produced; 5 Turbopack "dynamic filesystem access" warnings (`og.ts`, `ui-store.ts`, …) remain — tracked in the architecture audit |
| Local production server | starts; applies migrations 3–6 to a copy of the production database in < 1 s total |
| `scripts/seo-audit.mjs` on the local build | 0 errors, 0 warnings on 26 distinct URLs (every route type), sitemap 1,816 URLs |
| `scripts/a11y.mjs` (axe, 12 pages) | no violations (jsdom cannot evaluate contrast; contrast is covered by `tests/unit/contrast.test.ts`) |

## Not measured

Lighthouse and field Core Web Vitals, real-browser keyboard testing, email delivery, Search Console data, anything behind owner credentials (Cloudflare, translation key).
