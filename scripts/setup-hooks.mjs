#!/usr/bin/env node
/**
 * Points git at the versioned hooks in .githooks (runs from the npm `prepare` script).
 * Silent no-op where hooks make no sense: CI, Docker builds (no .git), or a checkout that is not a git work tree.
 */
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

if (process.env.CI || !existsSync('.git') || !existsSync('.githooks')) process.exit(0);
try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  /* git not available: nothing to configure */
}
