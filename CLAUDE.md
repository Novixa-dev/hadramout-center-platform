@AGENTS.md

# Claude Code notes

- **Verify, then claim.** Run `npm run check` after code changes; for anything touching routes, headers, config, the proxy or deploy files also run `npm run build && npm run smoke`. Show the output as evidence. Never report a task done without it.
- A git pre-commit hook runs `npm run check` and blocks failing commits (`HC_SKIP_HOOKS=1` skips it; do not use that to push a failing change).
- **Regexes and escapes:** edit with the Edit tool. `node -e`/`sed` through Git Bash strips backslashes (it has produced wrong patterns that still typecheck).
- Windows: Git Bash rewrites arguments starting with `/` (`MSYS_NO_PATHCONV=1`); native libraries need Windows-style paths (`$(pwd -W)`); use `.smoke-data/` (git-ignored) for scratch databases and logs, `%TEMP%` can be cleaned under you.
- The docs are the memory, not the chat: update `docs/planning/PROGRESS.md` (state, next steps), `BACKLOG.md` (status) and `FEATURE_PLAN.md` as work lands.
- Before opening a PR run `/code-review`; for routes that accept input use the `security-reviewer` subagent. Release and move procedures: the `hadramout-release` skill.
- Design changes follow `docs/02-plan/03-design-system.md` and the `frontend-design` skill: tokens in `src/styles/tokens.css`, logical CSS properties only, light and dark both checked.
