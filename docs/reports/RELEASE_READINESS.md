# Release readiness

**Assessment date:** 2026-10-27 (supersedes 2026-10-19) · **Detail:** [REVIEW_2026-10-27](REVIEW_2026-10-27.md) · gates: [ROADMAP](../planning/ROADMAP.md)

## Verdict

| Question | Answer |
|---|---|
| Ready for the Center's review on staging? | **Yes.** Live checks are green: cutover-check 39 ok / 0 failed, SEO audit 0 errors, sitemap sweep 0 errors, 56/56 browser journeys. |
| Ready for public launch? | **No.** Open gates need the Center or the owner, not engineering. |

## Launch gates (2026-10-27)

| Gate | State | Who |
|---|---|---|
| G1 approved About/leadership/legal wording | OPEN | Center |
| G2 fresh content (events stop at 2024-11) | OPEN | Center + editors |
| G3 data quality (uncategorised articles, book metadata) | OPEN | Center + editors |
| G4 files independent of the legacy host (63 PDFs, images) | OPEN | owner decision, then engineering |
| G5 technical health | lab MET; field data after launch | engineering |
| G6 accessibility | axe automated MET; manual keyboard/screen-reader pass missing | engineering + a tester |
| G7 security (2FA, deploy user, off-server backups) | OPEN — code items SEC-003/010 closed 2026-10-27 | owner |
| G8 infrastructure rehearsed on the new host | BLOCKED on host decision | engineering |
| G9 SEO cutover | 301 matrix DONE (1,454 ids, in CI); Search Console waits for the domain | engineering + owner |
| G10 operations (uptime monitor, off-server backup, editor training) | OPEN | owner + engineering |
| G11 communications | DRAFTED | Center |

## Engineering evidence

| Requirement | Evidence |
|---|---|
| Static + unit | `npm run check`: tsc, ESLint, 172 tests |
| Build + runtime | `npm run build && npm run smoke`: route/header/regression checks, SEO audit, redirect matrix, staging mode |
| Browser | `e2e.mjs`: 55/55 local production build, 56/56 live |
| Security | [SECURITY_REVIEW](../security/SECURITY_REVIEW.md); subagent review of the 2026-10-27 routing/card changes: no exploitable issues |
| Deploy safety | backup before every deploy (aborts on failure), health-checked rollback, post-deploy verification workflow |

How to run every tier: [test runbook](../04-qa/02-test-runbook.md).
