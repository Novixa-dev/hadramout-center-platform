# Engineering Standards (v2)

**Stack:** Next.js 16 (App Router, React Server Components) + Payload CMS 3 + SQLite, TypeScript strict, Node 24.
Decision record: `docs/02-plan/00-framework-decision.md`.

1. **Arabic is the source language.** Editors enter Arabic only. Every other language is machine-translated, stored in Payload localized fields, and marked `auto | reviewed | manual` in `translationMeta`. Manual edits are never overwritten.
2. **No invented institutional data.** Anything without a source (legacy site, Center staff) is `draft`. Verified by review, not by trust.
3. **Rich text is sanitized HTML** (`src/lib/sanitize.ts`) everywhere it enters the database. Never `dangerouslySetInnerHTML` unsanitized input.
4. **RTL first, logical CSS properties only** (`margin-inline`, `inset-inline-start`). No `left/right` in layout CSS.
5. **Performance budget:** HTML ≤ 40 KB gz, first-load JS ≤ 110 KB gz, one critical font, images via `next/image` (WebP/AVIF). Server Components by default; client components only for small islands.
6. **Accessibility:** WCAG 2.2 AA, 44 px targets, visible focus, skip links, correct `lang`/`dir` on mixed-language text.
7. **SEO:** real URLs `/{lang}/…`, canonical + hreflang only for *complete* translations, `noindex` for partial/fallback pages, JSON-LD and Google Scholar `citation_*` tags.
8. **Security:** CSP and security headers, rate limits on every public write endpoint, honeypot, no secrets in git, roles enforced in Payload access control.
9. **Cost guard:** translation is triggered by user action (never by crawlers), capped by `TRANSLATION_DAILY_CHAR_LIMIT`.
10. **Schema changes need a Payload migration** (`npm run payload migrate:create <name>`); never rely on dev push.
