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

  const componentName = basename(componentPath, '.tsx');
  const reactSourcePath = join(repoRoot, 'packages/react/src', componentPath);

  // Read the React component source
  let reactSource: string;
  try {
    reactSource = await readFile(reactSourcePath, 'utf-8');
  } catch {
    return {
      success: false,
      error: `Could not read React component at ${reactSourcePath}`,
    };
  }

  // Find related files in the same directory
  const relatedFiles = await findRelatedFiles(componentPath, repoRoot);

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

  // Build related files section
  let relatedFilesSection = '';
  if (relatedFiles.length > 0) {
    relatedFilesSection = `

## Related Files in Same Directory

The following files are in the same directory and should also be converted:

${relatedFiles
  .map(
    (file) => `### ${file.name}

\`\`\`tsx
${file.content}
\`\`\`
`,
  )
  .join('\n')}

**Important:** Convert ALL related files together. They are likely imported by the main component.
`;
  }

  const prompt = `# React → Vue Component Conversion Task

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

4. **Also create/update:**
   - Any required composables
   - The corresponding types file
   - Update barrel exports (index.ts)

5. **Validate the conversion:**
   - Run \`cd packages/vue && pnpm type-check\`
   - Fix any TypeScript errors

## React Source Code

\`\`\`tsx
${reactSource}
\`\`\`
${relatedFilesSection}
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
  const displayName = componentName.replace(/([A-Z])/g, ' $1').trim();

  let prompt: string;

  if (!exampleAppExists) {
    // Include scaffolding instructions
    prompt = `# Example App Scaffolding + Component Integration

## Task
Create the Vue example app and integrate the converted ${componentName} component.

## Step 1: Scaffold the Example App

Create \`examples/vue/\` based on the React SPA example at \`examples/react-spa-npm/\`.

**Structure to create:**
\`\`\`
examples/vue/
├── package.json           # Vue deps, link to local Vue package
├── vite.config.ts         # Vue plugin, @ alias
├── tsconfig.json          # Vue-specific tsconfig
├── postcss.config.mjs     # Tailwind v4 postcss
├── index.html
├── .env.example           # Auth0 config template
└── src/
    ├── main.ts            # createApp, router, Auth0, VueQuery
    ├── App.vue            # Auth0ComponentProvider wrapper
    ├── style.css          # Import package styles
    ├── config/
    │   └── env.ts         # Auth0 config from env vars
    ├── router/
    │   └── index.ts       # Vue Router setup
    ├── components/
    │   └── NavBar.vue     # Login/logout, nav links
    └── views/
        └── HomePage.vue   # Landing page
\`\`\`

**Reference:** Look at \`examples/react-spa-npm/\` for:
- Auth0 configuration pattern (domain, clientId, audience)
- Routing structure
- NavBar with login/logout buttons
- Component integration pattern

**Key differences from React:**
- Use \`@auth0/auth0-vue\` instead of \`@auth0/auth0-react\`
- Use \`createAuth0()\` plugin instead of Auth0Provider
- Use \`@auth0/universal-components-vue\` linked to local tarball
- Router must be installed BEFORE Auth0 plugin

## Step 2: Integrate the Component

After scaffolding, integrate ${componentName}:

1. **Create view:** \`src/views/${componentName}Page.vue\`
   \`\`\`vue
   <script setup lang="ts">
   import { ${componentName} } from '@auth0/universal-components-vue';
   </script>

   <template>
     <div class="max-w-3xl">
       <${componentName} />
     </div>
   </template>
   \`\`\`

2. **Add route:** In \`src/router/index.ts\`
   \`\`\`typescript
   {
     path: '/${kebabName}',
     name: '${kebabName}',
     component: () => import('@/views/${componentName}Page.vue'),
     beforeEnter: createAuthGuard(),
   }
   \`\`\`

3. **Add nav link:** In \`src/components/NavBar.vue\`
   \`\`\`vue
   <RouterLink v-if="isAuthenticated" to="/${kebabName}" class="...">
     ${displayName}
   </RouterLink>
   \`\`\`

## Step 3: Test

1. Copy \`.env.example\` to \`.env\` and fill in Auth0 credentials
2. Run \`cd examples/vue && pnpm install && pnpm dev\`
3. Verify component renders at \`http://localhost:5173/${kebabName}\`

Please proceed with scaffolding and integration.
`;
  } else {
    // Just integration instructions
    prompt = `# Example App Integration

## Task
Integrate the converted ${componentName} component into the Vue example app.

## Steps

1. **Create view:** \`examples/vue/src/views/${componentName}Page.vue\`
   \`\`\`vue
   <script setup lang="ts">
   import { ${componentName} } from '@auth0/universal-components-vue';
   </script>

   <template>
     <div class="max-w-3xl">
       <${componentName} />
     </div>
   </template>
   \`\`\`

2. **Add route:** In \`examples/vue/src/router/index.ts\`
   - Import the view component
   - Add route with path \`/${kebabName}\`
   - Use \`createAuthGuard()\` for auth protection

3. **Add nav link:** In \`examples/vue/src/components/NavBar.vue\`
   - Add RouterLink to \`/${kebabName}\`
   - Show only when authenticated

4. **Test:**
   - Run \`cd examples/vue && pnpm dev\`
   - Navigate to \`http://localhost:5173/${kebabName}\`
   - Verify component renders correctly

Please proceed with the integration.
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
