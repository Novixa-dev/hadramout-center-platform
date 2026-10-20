# AGENTS.md — Hadhramout Center Platform (v2)

Digital archive and knowledge platform for the **Hadhramout Center for Historical Studies, Documentation and Publishing** (Mukalla, Yemen). Built by Novixa.

**Stack:** Next.js 16 + Payload CMS 3 + SQLite (libSQL), TypeScript, Node 24. Arabic-first, auto-translated to any language.
**Start here:** `docs/00-INDEX.md` · rules in `.agents/rules/`.

```bash
npm install
cp .env.example .env     # set PAYLOAD_SECRET etc.
npm run payload migrate  # create the database
npm run db:seed          # content snapshot + admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev              # http://localhost:3000  (admin at /admin)
npm run check            # typecheck + lint + unit tests
npm run quality                  # read-only editorial report from the databases (DATA_DIR / DATABASE_URL)
npm run build && npm run smoke   # runtime tier: probes the built standalone server (needs a seeded DB: DB_DIR=...); CI runs it on a fresh snapshot seed
```

Layout: `src/app` (routes) · `src/collections` · `src/i18n` (languages, translation engine) · `src/lib` · `src/components` · `src/styles` · `messages/` (UI strings) · `content/` (legacy snapshot) · `docs/`.

## Pitfalls (verified)
- **Merging to `master` deploys to production.** Work on a branch, open a PR, merge only after CI is green.
- **Local `next build`:** run with `TRANSLATION_PROVIDER=none` — production mode rejects the `.env.example` value `mock` (`src/config.ts`).
- **A broken `node_modules`** shows up as hundreds of `TS7016`/"Cannot find module 'next'" errors: run `npm ci`; never commit recovery copies (`.node_modules.recovery-*` is git/docker/eslint-ignored).
- **`/api/*` reads are capped** (`limit<=100`, `depth<=2`, via `src/proxy.ts`); paginate in scripts. GraphQL is disabled.
- **Not found vs failure:** only Payload 404/403 means "no such page" (`src/lib/errors.ts`); do not catch-all into `null`.
- **Backups must include `legacy-media`**; `deploy.sh` aborts if the pre-deploy backup fails.
- Current state, audits and next steps: `docs/planning/PROGRESS.md`.
