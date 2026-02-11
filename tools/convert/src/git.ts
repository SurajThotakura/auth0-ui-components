import { basename } from 'path';

import { execa } from 'execa';

type Framework = 'vue' | 'angular' | 'svelte';

/**
 * Get the root directory of the monorepo
 */
function getRepoRoot(): string {
  return process.cwd().split('/tools/')[0] || process.cwd();
}

/**
 * Create a branch name for the conversion
 */
function createBranchName(componentName: string, frameworks: Framework[]): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const frameworkStr = frameworks.join('-');
  const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `feat/convert-${cleanName}-to-${frameworkStr}-${timestamp}`;
}

/**
 * Get the commit message for the conversion
 */
function getCommitMessage(componentName: string, frameworks: Framework[]): string {
  const frameworkStr = frameworks.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(', ');
  return `feat(${frameworks.join(',')}): convert ${componentName} from React

Automated conversion using Claude Code framework conversion pipeline.

Converted to: ${frameworkStr}

Co-Authored-By: Claude <noreply@anthropic.com>`;
}

/**
 * Get the PR title and body
 */
function getPRContent(
  componentName: string,
  frameworks: Framework[],
  files: string[],
): { title: string; body: string } {
  const frameworkStr = frameworks.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(', ');

  const title = `feat: Convert ${componentName} to ${frameworkStr}`;

  const body = `## Summary

Automated conversion of \`${componentName}\` from React to ${frameworkStr} using the Claude Code framework conversion pipeline.

## Converted Files

${files.map((f) => `- \`${f}\``).join('\n')}

## Frameworks

${frameworks.map((f) => `- [x] ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

## Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] Component renders correctly
- [ ] All props work as expected
- [ ] All events fire correctly
- [ ] Styling matches React version
- [ ] Integration with core package works

## Test Plan

1. Import the converted component
2. Verify it renders with the same props as React version
3. Test all interactive features
4. Verify theme/dark mode works
5. Check translations work

---

🤖 Generated with [Claude Code](https://claude.ai/claude-code) Framework Conversion Pipeline`;

  return { title, body };
}

/**
 * Create a pull request with the converted files
 */
export async function createPullRequest(
  componentPath: string,
  frameworks: Framework[],
  outputPaths: string[],
): Promise<string> {
  const repoRoot = getRepoRoot();
  const componentName = basename(componentPath, '.tsx');

  // Get current branch
  const { stdout: currentBranch } = await execa('git', ['branch', '--show-current'], {
    cwd: repoRoot,
  });

  // Create new branch
  const branchName = createBranchName(componentName, frameworks);

  // Check if we have changes
  const { stdout: status } = await execa('git', ['status', '--porcelain'], {
    cwd: repoRoot,
  });

  if (!status.trim()) {
    throw new Error('No changes to commit');
  }

  // Create and checkout new branch
  await execa('git', ['checkout', '-b', branchName], {
    cwd: repoRoot,
  });

  // Stage converted files
  for (const file of outputPaths) {
    await execa('git', ['add', file], {
      cwd: repoRoot,
    });
  }

  // Commit
  const commitMessage = getCommitMessage(componentName, frameworks);
  await execa('git', ['commit', '-m', commitMessage], {
    cwd: repoRoot,
  });

  // Push to remote
  await execa('git', ['push', '-u', 'origin', branchName], {
    cwd: repoRoot,
  });

  // Create PR using gh CLI
  const { title, body } = getPRContent(
    componentName,
    frameworks,
    outputPaths.map((p) => p.replace(repoRoot + '/', '')),
  );

  const { stdout: prUrl } = await execa(
    'gh',
    ['pr', 'create', '--title', title, '--body', body, '--base', 'main'],
    {
      cwd: repoRoot,
    },
  );

  return prUrl.trim();
}

/**
 * Check if git and gh are available
 */
export async function checkGitAvailable(): Promise<{ git: boolean; gh: boolean }> {
  let git = false;
  let gh = false;

  try {
    await execa('git', ['--version']);
    git = true;
  } catch {
    // git not available
  }

  try {
    await execa('gh', ['--version']);
    gh = true;
  } catch {
    // gh not available
  }

  return { git, gh };
}
