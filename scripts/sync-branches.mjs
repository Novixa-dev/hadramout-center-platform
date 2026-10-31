#!/usr/bin/env node
/**
 * Fast-forward every claude/* branch (remote and local) to origin/master.
 * Refuses to touch a branch that is not already contained in master.
 * Batches remote branch updates into a single atomic push.
 */
import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
}

try {
  run('git fetch -q --prune origin');
  const master = run('git rev-parse origin/master');
  const remoteClaudeRefs = run('git for-each-ref --format="%(refname:short)" refs/remotes/origin/claude')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const pushSpecs = [];
  let skipped = 0;

  for (const ref of remoteClaudeRefs) {
    const branchName = ref.replace(/^origin\//, '');
    let isAncestor = false;
    try {
      run(`git merge-base --is-ancestor "${ref}" origin/master`);
      isAncestor = true;
    } catch {
      isAncestor = false;
    }

    if (isAncestor) {
      const commit = run(`git rev-parse "${ref}"`);
      if (commit !== master) {
        pushSpecs.push(`master:refs/heads/${branchName}`);
      }
    } else {
      console.log(`SKIP ${branchName}: has commits not in master`);
      skipped = 1;
    }
  }

  if (pushSpecs.length > 0) {
    console.log(`Fast-forwarding ${pushSpecs.length} remote branches to origin/master...`);
    // Push in chunks of 10 to avoid oversized command lines
    for (let i = 0; i < pushSpecs.length; i += 10) {
      const chunk = pushSpecs.slice(i, i + 10);
      run(`git push -q origin ${chunk.join(' ')}`);
    }
    console.log('Remote branches updated successfully.');
  } else {
    console.log('All remote claude/* branches are already up to date with origin/master.');
  }

  // Local branches
  const curBranch = run('git rev-parse --abbrev-ref HEAD');
  const localRefs = run('git for-each-ref --format="%(refname:short)" refs/heads')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const b of localRefs) {
    if (b === curBranch) continue;
    let isAncestor = false;
    try {
      run(`git merge-base --is-ancestor "${b}" origin/master`);
      isAncestor = true;
    } catch {
      isAncestor = false;
    }

    if (isAncestor) {
      run(`git branch -qf "${b}" origin/master`);
    } else {
      console.log(`SKIP local ${b}: not contained in master`);
      skipped = 1;
    }
  }

  run('git fetch -q --prune origin');
  const shortMaster = run('git rev-parse --short origin/master');
  console.log(`master is ${shortMaster}. Branches check complete.`);
  process.exit(skipped);
} catch (err) {
  console.error('Error during branch sync:', err.message);
  process.exit(1);
}
