import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';

import chalk from 'chalk';

type Framework = 'vue' | 'angular' | 'svelte';

export interface ClaudeInvocationOptions {
  /** Path to React component relative to packages/react/src */
  componentPath: string;
  /** Target framework for conversion */
  targetFramework: Framework;
  /** Working directory (defaults to repo root) */
  workingDir?: string;
  /** Enable auto-retry on validation failure */
  autoRetry?: boolean;
}

export interface ClaudeInvocationResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Get the root directory of the monorepo
 */
function getRepoRoot(): string {
  // Walk up from current directory to find packages/react
  let dir = process.cwd();
  while (dir !== '/') {
    try {
      const packagesDir = join(dir, 'packages');
      // This is a simple check - in production you might want to verify more
      if (dir.includes('auth0-ui-components')) {
        return dir;
      }
    } catch {
      // Continue walking up
    }
    dir = dirname(dir);
  }
  return process.cwd();
}

/**
 * Build the conversion prompt for Claude Code
 */
async function buildConversionPrompt(
  componentPath: string,
  targetFramework: Framework,
  repoRoot: string,
): Promise<string> {
  const componentName = basename(componentPath, '.tsx');
  const reactSourcePath = join(repoRoot, 'packages/react/src', componentPath);

  // Read the React component source
  let reactSource: string;
  try {
    reactSource = await readFile(reactSourcePath, 'utf-8');
  } catch (error) {
    throw new Error(`Could not read React component at ${reactSourcePath}`);
  }

  // Determine output path based on component type
  let outputDir: string;
  if (componentPath.startsWith('blocks/')) {
    outputDir = `packages/${targetFramework}/src/blocks/${componentPath.replace('blocks/', '').replace('.tsx', '')}`;
  } else if (componentPath.startsWith('components/')) {
    outputDir = `packages/${targetFramework}/src/components/${componentPath.replace('components/', '').replace('.tsx', '')}`;
  } else if (componentPath.startsWith('hooks/')) {
    outputDir = `packages/${targetFramework}/src/composables/${componentPath.replace('hooks/', 'use-').replace('.tsx', '.ts').replace('.ts', '')}`;
  } else {
    outputDir = `packages/${targetFramework}/src/${componentPath.replace('.tsx', '')}`;
  }

  const prompt = `
# React → Vue Component Conversion Task

## Source Component
**File:** \`packages/react/src/${componentPath}\`
**Component Name:** ${componentName}

## Target
**Framework:** ${targetFramework}
**Output Path:** \`${outputDir}.vue\` (or appropriate Vue structure)

## Instructions

1. **Read the SKILL.md and references** in \`packages/vue/\` to understand Vue conversion patterns
2. **Convert the React component** to Vue following these rules:
   - Use \`<script setup lang="ts">\` (never Options API)
   - Convert React hooks to Vue composables
   - Convert JSX to Vue template syntax
   - Use \`defineEmits\` for events (not callback props)
   - Use \`reka-ui\` \`Primitive\` for polymorphic components
   - Copy CVA variant strings exactly from React

3. **Create the Vue component** at the appropriate path:
   - For blocks: \`packages/vue/src/blocks/...\`
   - For components: \`packages/vue/src/components/...\`
   - For hooks: \`packages/vue/src/composables/...\` (rename to \`use-*.ts\`)

4. **Validate the conversion:**
   - Run \`cd packages/vue && pnpm type-check\`
   - Fix any TypeScript errors
   - Ensure the component follows Vue conventions

5. **If this is a block component**, also create or update:
   - Any required composables
   - The corresponding types file
   - Update barrel exports (index.ts)

## React Source Code

\`\`\`tsx
${reactSource}
\`\`\`

## Conversion Checklist
- [ ] Uses \`<script setup lang="ts">\`
- [ ] All \`useState\` → \`ref()\`
- [ ] All \`useMemo\` → \`computed()\`
- [ ] All \`useEffect\` → \`watch()\` / \`onMounted()\`
- [ ] All \`useContext\` → \`inject()\`
- [ ] All callback props → \`defineEmits\`
- [ ] JSX conditionals → \`v-if\`
- [ ] JSX lists → \`v-for\`
- [ ] \`className\` → \`class\`
- [ ] CVA strings copied exactly
- [ ] \`data-slot\` attribute preserved
- [ ] Passes \`pnpm type-check\`

Please proceed with the conversion.
`;

  return prompt;
}

/**
 * Launch Claude Code interactively for component conversion
 *
 * This function spawns Claude Code as an interactive subprocess,
 * allowing the user to monitor and guide the conversion in real-time.
 */
export async function launchClaudeCodeSession(
  options: ClaudeInvocationOptions,
): Promise<ClaudeInvocationResult> {
  const repoRoot = options.workingDir || getRepoRoot();
  const { componentPath, targetFramework } = options;

  console.log(chalk.blue('\n🤖 Launching Claude Code for conversion...\n'));
  console.log(chalk.gray(`Source: packages/react/src/${componentPath}`));
  console.log(chalk.gray(`Target: ${targetFramework}`));
  console.log(chalk.gray(`Working directory: ${repoRoot}\n`));

  try {
    // Build the conversion prompt
    const prompt = await buildConversionPrompt(componentPath, targetFramework, repoRoot);

    // Write prompt to a temp file for reference and for Claude to read
    const { writeFile } = await import('fs/promises');
    const promptPath = join(repoRoot, '.claude-convert-prompt.md');
    await writeFile(promptPath, prompt);
    console.log(chalk.gray(`Prompt saved to: ${promptPath}\n`));

    // Launch Claude Code interactively by piping the prompt via stdin
    // This avoids shell interpretation issues with special characters
    console.log(chalk.yellow('Starting interactive Claude Code session...'));
    console.log(chalk.gray('You can guide the conversion as needed.\n'));
    console.log(chalk.cyan('─'.repeat(60)));

    // Use spawn with pipe for stdin, inherit for stdout/stderr
    const claude = spawn('claude', ['--print'], {
      cwd: repoRoot,
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    // Write the prompt to stdin and close it
    claude.stdin?.write(prompt);
    claude.stdin?.end();

    return new Promise((resolve) => {
      claude.on('close', (code) => {
        console.log(chalk.cyan('─'.repeat(60)));

        if (code === 0) {
          console.log(chalk.green('\n✓ Claude Code session completed successfully\n'));

          // Determine the expected output path
          const componentName = basename(componentPath, '.tsx');
          let outputPath: string;

          if (componentPath.startsWith('blocks/')) {
            const subPath = componentPath.replace('blocks/', '').replace('.tsx', '');
            outputPath = join(
              repoRoot,
              `packages/${targetFramework}/src/blocks`,
              subPath,
              `${componentName}.vue`,
            );
          } else if (componentPath.startsWith('components/ui/')) {
            outputPath = join(
              repoRoot,
              `packages/${targetFramework}/src/components/ui`,
              `${componentName}.vue`,
            );
          } else {
            outputPath = join(
              repoRoot,
              `packages/${targetFramework}/src`,
              componentPath.replace('.tsx', '.vue'),
            );
          }

          resolve({
            success: true,
            outputPath,
          });
        } else {
          console.log(chalk.red(`\n✗ Claude Code session exited with code ${code}\n`));
          resolve({
            success: false,
            error: `Claude Code exited with code ${code}`,
          });
        }
      });

      claude.on('error', (error) => {
        console.log(chalk.red(`\n✗ Failed to launch Claude Code: ${error.message}\n`));
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`\n✗ Error: ${errorMessage}\n`));
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Run Claude Code non-interactively with a prompt
 * Returns when Claude Code completes
 */
export async function runClaudeCodeConversion(
  options: ClaudeInvocationOptions,
): Promise<ClaudeInvocationResult> {
  const repoRoot = options.workingDir || getRepoRoot();
  const { componentPath, targetFramework } = options;

  try {
    const prompt = await buildConversionPrompt(componentPath, targetFramework, repoRoot);

    // Use execa for better control, pipe prompt via stdin
    const { execa } = await import('execa');

    console.log(chalk.blue('\n🤖 Running Claude Code conversion...\n'));

    const result = await execa('claude', ['--print'], {
      cwd: repoRoot,
      input: prompt,
      timeout: 5 * 60 * 1000, // 5 minute timeout
    });

    if (result.exitCode === 0) {
      const componentName = basename(componentPath, '.tsx');
      let outputPath: string;

      if (componentPath.startsWith('blocks/')) {
        const subPath = componentPath.replace('blocks/', '').replace('.tsx', '');
        outputPath = join(
          repoRoot,
          `packages/${targetFramework}/src/blocks`,
          subPath,
          `${componentName}.vue`,
        );
      } else {
        outputPath = join(
          repoRoot,
          `packages/${targetFramework}/src`,
          componentPath.replace('.tsx', '.vue'),
        );
      }

      return {
        success: true,
        outputPath,
      };
    }

    return {
      success: false,
      error: result.stderr || 'Conversion failed',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
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
