import { existsSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

import chalk from 'chalk';

type Framework = 'vue' | 'angular' | 'svelte';

interface RelatedFile {
  name: string;
  path: string;
  content: string;
}

export interface PromptGenerationOptions {
  /** Path to React component relative to packages/react/src */
  componentPath: string;
  /** Target framework for conversion */
  targetFramework: Framework;
  /** Working directory (defaults to repo root) */
  workingDir?: string;
}

export interface PromptGenerationResult {
  success: boolean;
  prompt?: string;
  promptPath?: string;
  error?: string;
}

/**
 * Get the root directory of the monorepo
 */
function getRepoRoot(): string {
  let dir = process.cwd();
  while (dir !== '/') {
    if (dir.includes('auth0-ui-components')) {
      return dir;
    }
    dir = dirname(dir);
  }
  return process.cwd();
}

/**
 * Copy text to clipboard using platform-specific commands
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const { execa } = await import('execa');

    if (process.platform === 'darwin') {
      await execa('pbcopy', { input: text });
    } else if (process.platform === 'linux') {
      await execa('xclip', ['-selection', 'clipboard'], { input: text });
    } else if (process.platform === 'win32') {
      await execa('clip', { input: text });
    } else {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Find related files in the same directory as the component
 */
async function findRelatedFiles(componentPath: string, repoRoot: string): Promise<RelatedFile[]> {
  const reactSourcePath = join(repoRoot, 'packages/react/src', componentPath);
  const componentDir = dirname(reactSourcePath);
  const componentFileName = basename(componentPath);

  const relatedFiles: RelatedFile[] = [];

  try {
    const files = await readdir(componentDir);

    for (const file of files) {
      // Skip the main component file itself
      if (file === componentFileName) continue;

      // Only include .tsx files (not index.ts, tests, etc.)
      if (!file.endsWith('.tsx')) continue;

      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      const filePath = join(componentDir, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        relatedFiles.push({
          name: file,
          path: filePath,
          content,
        });
      } catch {
        // Skip files that can't be read
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return relatedFiles;
}

/**
 * Generate the conversion prompt for Claude Code
 */
export async function generateConversionPrompt(
  options: PromptGenerationOptions,
): Promise<PromptGenerationResult> {
  const repoRoot = options.workingDir || getRepoRoot();
  const { componentPath, targetFramework } = options;

  const reactSourcePath = join(repoRoot, 'packages/react/src', componentPath);

  // Verify source file exists
  if (!existsSync(reactSourcePath)) {
    return {
      success: false,
      error: `React component not found at ${reactSourcePath}`,
    };
  }

  // Find related files in the same directory
  const relatedFiles = await findRelatedFiles(componentPath, repoRoot);

  // Determine output directory (folder containing the component)
  const componentDir = dirname(componentPath);
  let outputDir: string;
  if (componentPath.startsWith('blocks/')) {
    outputDir = `packages/${targetFramework}/src/${componentDir}`;
  } else if (componentPath.startsWith('components/')) {
    outputDir = `packages/${targetFramework}/src/${componentDir}`;
  } else if (componentPath.startsWith('hooks/')) {
    outputDir = `packages/${targetFramework}/src/composables`;
  } else {
    outputDir = `packages/${targetFramework}/src/${componentDir}`;
  }

  // Build related files section (just paths, Claude can read them)
  let relatedFilesSection = '';
  if (relatedFiles.length > 0) {
    relatedFilesSection = `
**Related files to convert:** ${relatedFiles.map((f) => f.name).join(', ')}
`;
  }

  const prompt = `Convert React component to Vue.

**Source:** \`packages/react/src/${componentPath}\`${relatedFilesSection}
**Output:** \`${outputDir}/\`

## Pre-flight Checklist (MUST verify before converting)

Check these files exist. If ANY is missing, create it first using \`packages/vue/references/\` as guide:

1. \`packages/vue/package.json\` → see \`references/architecture.md\`
2. \`packages/vue/tsconfig.json\` → see \`references/architecture.md\`
3. \`packages/vue/src/types/injection-keys.ts\` → see \`references/injection-keys.md\`
4. \`packages/vue/src/providers/Auth0ComponentProvider.vue\` → see \`references/providers.md\`
5. \`packages/vue/src/providers/Auth0ProxyComponentProvider.vue\` → see \`references/providers.md\`
6. \`packages/vue/src/lib/utils.ts\` (cn utility) → see \`references/architecture.md\`
7. \`packages/vue/src/styles/\` directory → copy from \`packages/react/src/styles/\`

## Conversion Steps

1. Read \`packages/vue/SKILL.md\` for patterns
2. Convert all source files to Vue
3. Update barrel exports (index.ts)
4. Run \`cd packages/vue && pnpm type-check\` and fix errors
`;

  // Save prompt to file
  const promptPath = join(repoRoot, '.claude-convert-prompt.md');
  try {
    await writeFile(promptPath, prompt);
  } catch {
    // Non-critical, continue anyway
  }

  // Copy to clipboard
  const copied = await copyToClipboard(prompt);

  console.log(chalk.blue('\n📋 Conversion Prompt Generated\n'));
  console.log(chalk.gray(`Source: packages/react/src/${componentPath}`));
  console.log(chalk.gray(`Target: ${targetFramework}`));
  if (relatedFiles.length > 0) {
    console.log(chalk.gray(`Related files: ${relatedFiles.map((f) => f.name).join(', ')}`));
  }
  console.log(chalk.gray(`Prompt saved to: ${promptPath}`));

  if (copied) {
    console.log(chalk.green('✓ Prompt copied to clipboard\n'));
  } else {
    console.log(chalk.yellow('⚠ Could not copy to clipboard (manual copy from file)\n'));
  }

  console.log(chalk.cyan('─'.repeat(60)));
  console.log(chalk.white('\nNext steps:'));
  console.log(chalk.gray('  1. Open Claude Code in the repo:'));
  console.log(chalk.cyan(`     cd ${repoRoot} && claude\n`));
  console.log(chalk.gray('  2. Paste the prompt (already in clipboard)'));
  console.log(chalk.gray('  3. Guide the conversion as needed'));
  console.log(chalk.gray('  4. After completion, run validation:'));
  console.log(chalk.cyan('     pnpm convert validate -t vue\n'));
  console.log(chalk.cyan('─'.repeat(60)));

  return {
    success: true,
    prompt,
    promptPath,
  };
}

/**
 * Generate the integration prompt for Claude Code
 */
export async function generateIntegrationPrompt(
  options: PromptGenerationOptions & { exampleAppExists: boolean },
): Promise<PromptGenerationResult> {
  const repoRoot = options.workingDir || getRepoRoot();
  const { componentPath, targetFramework, exampleAppExists } = options;

  const componentName = basename(componentPath, '.tsx');
  const kebabName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  let prompt: string;

  if (!exampleAppExists) {
    prompt = `Scaffold Vue example app and integrate component.

1. Create \`examples/vue/\` based on \`examples/react-spa-npm/\` (Vue equivalents)
2. Read \`packages/vue/SKILL.md\` "Example App Setup" section for patterns
3. Add view for ${componentName} at route \`/${kebabName}\`
4. Add nav link in NavBar.vue
5. Test: \`cd examples/vue && pnpm dev\` → http://localhost:5173/${kebabName}
`;
  } else {
    prompt = `Integrate component into Vue example app.

**Component:** ${componentName}
**Route:** \`/${kebabName}\`

1. Create \`examples/vue/src/views/${componentName}Page.vue\`
2. Add route in \`examples/vue/src/router/index.ts\`
3. Add nav link in \`examples/vue/src/components/NavBar.vue\`
4. Test: \`cd examples/vue && pnpm dev\` → http://localhost:5173/${kebabName}
`;
  }

  // Save prompt to file
  const promptPath = join(repoRoot, '.claude-integrate-prompt.md');
  try {
    await writeFile(promptPath, prompt);
  } catch {
    // Non-critical
  }

  // Copy to clipboard
  const copied = await copyToClipboard(prompt);

  console.log(chalk.blue('\n📋 Integration Prompt Generated\n'));
  console.log(chalk.gray(`Component: ${componentName}`));
  console.log(chalk.gray(`Example app exists: ${exampleAppExists ? 'yes' : 'no (will scaffold)'}`));
  console.log(chalk.gray(`Prompt saved to: ${promptPath}`));

  if (copied) {
    console.log(chalk.green('✓ Prompt copied to clipboard\n'));
  } else {
    console.log(chalk.yellow('⚠ Could not copy to clipboard (manual copy from file)\n'));
  }

  console.log(chalk.cyan('─'.repeat(60)));
  console.log(chalk.white('\nNext steps:'));
  console.log(chalk.gray('  1. Open Claude Code in the repo:'));
  console.log(chalk.cyan(`     cd ${repoRoot} && claude\n`));
  console.log(chalk.gray('  2. Paste the prompt (already in clipboard)'));
  console.log(chalk.gray('  3. Guide the integration as needed'));
  console.log(chalk.gray('  4. Start the dev server:'));
  console.log(chalk.cyan(`     cd examples/vue && pnpm dev\n`));
  console.log(chalk.gray(`  5. Preview at: http://localhost:5173/${kebabName}`));
  console.log(chalk.cyan('─'.repeat(60)));

  return {
    success: true,
    prompt,
    promptPath,
  };
}

/**
 * Check if Claude Code CLI is available
 */
export async function checkClaudeCodeAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('claude', ['--version']);
    return true;
  } catch {
    return false;
  }
}
