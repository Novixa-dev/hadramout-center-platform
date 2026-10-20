# Working with Claude for a site like this — what the official guidance says and what we adopted

**Purpose:** record how to get professional results from Claude Code on this project, from primary sources, and map each practice to what is in the repository. **Last updated:** 2026-10-21
**Method:** the pages below were fetched on 2026-10-21 and summarised; community articles from the same search were treated as secondary and only used to find the primary sources.
**Related:** [CLAUDE.md](../../CLAUDE.md) · [AGENTS.md](../../AGENTS.md) · [.claude/agents](../../.claude/agents) · [hadramout-release skill](../../.claude/skills/hadramout-release/SKILL.md)

## 1. Sources

| Source | Type | What we took from it |
|---|---|---|
| [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) | Anthropic official | verification loop, explore→plan→implement, concise CLAUDE.md, hooks vs advice, subagents, adversarial review, context management, failure patterns |
| [Prompting for frontend aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) | Anthropic cookbook | avoid generic "AI slop" defaults; guide typography, colour, motion and backgrounds individually; commit to one theme |
| [Site move with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) | Google Search Central | preparation, 301 mapping, no chains, keep redirects ≥ 1 year, Change of Address, monitoring, common mistakes |
| [Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) | Google Search Central | `noindex` (meta or `X-Robots-Tag`) works only if the page is not blocked by robots.txt; robots.txt `noindex` is unsupported |

## 2. Practices and where they live in this repository

| Practice (source) | State | Evidence |
|---|---|---|
| **Give Claude a check it can run; show evidence, not assertions** (best practices) | Adopted | `npm run check`, `npm run smoke` (dozens of assertions incl. staging and production modes, REST cap, redirects), `scripts/seo-audit.mjs`, `scripts/cutover-check.mjs`, CI runs all on a freshly seeded database |
| **Deterministic gates instead of advice — use hooks for what must happen every time** (best practices) | Adopted | `.githooks/pre-commit` runs `npm run check` and blocks failing commits (tested: a deliberately broken file produced no commit); enabled by `npm install` via `scripts/setup-hooks.mjs`; skipped in CI/Docker |
| **Explore first, then plan, then code; skip planning for one-sentence diffs** | Adopted as habit | planning docs before building (`docs/planning/*`), PRs per workstream |
| **Short CLAUDE.md with only what Claude cannot infer; prune it** | Adopted | `CLAUDE.md` is short (about a dozen lines) and imports `AGENTS.md` (`@AGENTS.md`); it records the traps we actually hit (Git Bash strips backslashes, `%TEMP%` cleanup, Windows paths) |
| **Skills for knowledge needed only sometimes; `disable-model-invocation` for side-effect workflows** | Adopted | `.claude/skills/hadramout-release` (release, deploy verification, move procedure); design skills already present (`frontend-design`, `ui-ux-pro-max`, `design-review`, …) |
| **Subagents for isolated review; read-only tools first** | Adopted | `.claude/agents/security-reviewer.md` and `arabic-ux-reviewer.md` (tools: Read, Grep, Glob) |
| **Independent review in a fresh context (adversarial review)** | Adopted | `/code-review` before each PR; the review agent is told to report only findings that affect correctness or requirements, to avoid over-engineering |
| **Manage context: `/clear` between tasks, subagents for investigation, record state outside the chat** | Adopted | state lives in `docs/planning/PROGRESS.md`, `BACKLOG.md`, `FEATURE_PLAN.md`; scratch work in git-ignored `.smoke-data/` |
| **Avoid the "trust-then-verify gap"** | Adopted | every defect found by an audit gets a test or a smoke assertion before the fix is declared done |
| **Frontend: guide typography, colour, motion, backgrounds; reference a design direction; call out defaults to avoid** (cookbook) | Already the project's approach | committed identity (teal + gold on warm paper), IBM Plex Sans Arabic + Naskh instead of default system fonts, tokens in `src/styles/tokens.css`, design-system document, dark/light both tested, contrast ratios asserted in tests |
| **Staging: use `noindex`, do not `Disallow` it** (Google) | Adopted | `SITE_ENV` default = staging → header + meta noindex, robots.txt allows crawling but advertises no sitemap; smoke test fails if `Disallow: /` appears |
| **Site move: map every old URL, 301 not client redirects, no chains, keep ≥ 1 year, change one thing at a time, monitor** (Google) | In the runbook | `docs/05-deploy/03-move-to-new-host-and-domain.md`, `docs/migration/URL_REDIRECT_MAP.md`, `cutover-check.mjs` |

## 3. Not adopted (and why)

| Idea | Reason |
|---|---|
| A Stop hook that runs the full smoke suite every turn | too slow locally (needs a build and a seeded database); CI runs it on every PR instead |
| Auto mode / agent teams / `/batch` fan-out | useful for large uniform migrations; this project's work is varied and each change needs review, so sequential PRs with CI are safer |
| Third-party skill marketplaces | unvetted code would run with the developer's permissions; the project already has the design and review skills it needs, and the review roles are written locally |
| Persisting a very long CLAUDE.md of design rules | the guidance warns that long files get ignored; design rules stay in the design-system document and the `frontend-design` skill |

## 4. Suggested prompts for recurring work

- **Feature:** "Read `docs/planning/FEATURE_PLAN.md` item F-xx and the files it names. Plan first (list files and the check that will prove it works), then implement, then run `npm run check && npm run build && npm run smoke` and show the output."
- **Defect from an audit:** "Reproduce finding X-nnn with a failing test or smoke assertion first, fix the root cause, show the test passing, update BACKLOG."
- **Design change:** "Follow the design system and tokens; check light and dark, RTL, 360 px and 1366 px with screenshots; run the `arabic-ux-reviewer` subagent on the diff."
- **Before a PR:** "Run `/code-review`, then the `security-reviewer` subagent if any route, header or deploy file changed; fix real findings only."
