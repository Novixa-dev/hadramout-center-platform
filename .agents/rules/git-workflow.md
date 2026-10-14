# Git Workflow

- Branch from `master` (`feat/…`, `fix/…`); open a PR; CI must pass; merge deploys.
- Conventional Commits: `feat|fix|docs|style|refactor|perf|test|chore(scope): imperative summary`.
- Never commit `.env*`, `data/`, `.cache/`, database files or API keys.
- Never force-push shared branches.
