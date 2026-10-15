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
```

Layout: `src/app` (routes) · `src/collections` · `src/i18n` (languages, translation engine) · `src/lib` · `src/components` · `src/styles` · `messages/` (UI strings) · `content/` (legacy snapshot) · `docs/`.
