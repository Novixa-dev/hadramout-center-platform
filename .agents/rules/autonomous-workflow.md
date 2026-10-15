# Agent Workflow

Plan → Track → Code → Test → Review → Sync.

1. **Plan:** read `docs/02-plan/` and `docs/03-tracking/TRACKER.md`; record decisions in `docs/02-plan/07-decisions.md`.
2. **Track:** update `TRACKER.md` and `CHANGELOG.md` with every functional change.
3. **Code:** follow `engineering-standards.md`; small modules; no dead code.
4. **Test:** `npm run check` (typecheck + lint + unit tests); `npm run build`; verify in a browser at 320 / 375 / 768 / 1280 / 1920 px, light + dark, Arabic + one LTR language.
5. **Review:** read the diff; remove debug artifacts; confirm no secrets.
6. **Sync:** work on a feature branch, open a PR, merge after CI passes. The `main` branch deploys automatically.
