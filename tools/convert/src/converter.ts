import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join, basename, extname } from 'path';

import chalk from 'chalk';
import { execa } from 'execa';

type Framework = 'vue' | 'angular' | 'svelte';

interface ConvertOptions {
  verbose?: boolean;
}

/**
 * Get the root directory of the monorepo
 */
function getRepoRoot(): string {
  // Assuming the tool is run from anywhere in the monorepo
  return process.cwd().split('/tools/')[0] || process.cwd();
}

/**
 * Get the source path for a React component
 */
function getSourcePath(componentPath: string): string {
  const repoRoot = getRepoRoot();
  return join(repoRoot, 'packages/react/src', componentPath);
}

/**
 * Get the target path for a converted component
 */
function getTargetPath(componentPath: string, framework: Framework): string {
  const repoRoot = getRepoRoot();
  const ext = extname(componentPath);
  const baseName = basename(componentPath, ext);

  // Determine the target extension based on framework and file type
  let targetExt = '.ts';
  if (framework === 'vue' && componentPath.includes('components/')) {
    // Vue components can be .vue or .ts (for renderless)
    // For now, use .ts for consistency with our Button implementation
    targetExt = '.ts';
  } else if (framework === 'svelte') {
    targetExt = '.svelte';
  } else if (framework === 'angular') {
    targetExt = '.component.ts';
  }

  // Replace /react/ with /<framework>/ in the path
  const targetPath = componentPath
    .replace(/\.tsx?$/, targetExt)
    .replace(/hooks\//, 'composables/') // Vue terminology
    .replace(/providers\//, 'plugins/'); // Vue terminology

  return join(repoRoot, 'packages', framework, 'src', targetPath);
}

/**
 * Read the framework-specific SKILLS.md for conversion guidance
 */
async function getFrameworkSkills(framework: Framework): Promise<string> {
  const repoRoot = getRepoRoot();
  const skillsPath = join(repoRoot, 'packages', framework, 'SKILLS.md');

  try {
    return await readFile(skillsPath, 'utf-8');
  } catch {
    console.warn(chalk.yellow(`Warning: No SKILLS.md found for ${framework}`));
    return '';
  }
}

/**
 * Read the mapping rules reference
 */
async function getMappingRules(): Promise<string> {
  const repoRoot = getRepoRoot();
  const mappingPath = join(repoRoot, '.github/skills/framework-conversion/mapping-rules.md');

  try {
    return await readFile(mappingPath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Build the conversion prompt for Claude Code
 */
function buildConversionPrompt(
  sourceCode: string,
  sourcePath: string,
  targetPath: string,
  framework: Framework,
  skills: string,
  mappingRules: string,
): string {
  return `You are converting a React component to ${framework.toUpperCase()}.

## Source File
Path: ${sourcePath}

\`\`\`tsx
${sourceCode}
\`\`\`

## Target
Path: ${targetPath}
Framework: ${framework === 'vue' ? 'Vue 3 Composition API' : framework === 'angular' ? 'Angular 17+ Standalone' : 'Svelte 5'}

## Framework Conversion Guide
${skills}

## Quick Reference - Mapping Rules
${mappingRules}

## Instructions
1. Convert the React component to ${framework} following the patterns in the conversion guide
2. Preserve all functionality, props, events, and styling
3. Use framework-idiomatic patterns (composables for Vue, services for Angular, stores for Svelte)
4. Keep TypeScript types strict
5. Keep Tailwind CSS classes unchanged
6. Ensure the component integrates with @auth0/universal-components-core

## Output
Provide ONLY the converted code. No explanations or markdown code blocks - just the raw code that should be written to the target file.`;
}

/**
 * Convert a React component to the target framework using Claude Code
 */
export async function convertComponent(
  componentPath: string,
  framework: Framework,
  options: ConvertOptions = {},
): Promise<string> {
  const sourcePath = getSourcePath(componentPath);
  const targetPath = getTargetPath(componentPath, framework);

  if (options.verbose) {
    console.log(chalk.gray(`Source: ${sourcePath}`));
    console.log(chalk.gray(`Target: ${targetPath}`));
  }

  // Read source file
  let sourceCode: string;
  try {
    sourceCode = await readFile(sourcePath, 'utf-8');
  } catch (error) {
    throw new Error(`Could not read source file: ${sourcePath}`);
  }

  // Read framework skills and mapping rules
  const [skills, mappingRules] = await Promise.all([
    getFrameworkSkills(framework),
    getMappingRules(),
  ]);

  // Build the conversion prompt
  const prompt = buildConversionPrompt(
    sourceCode,
    sourcePath,
    targetPath,
    framework,
    skills,
    mappingRules,
  );

  if (options.verbose) {
    console.log(chalk.gray('\nConversion prompt length:', prompt.length, 'characters'));
  }

  // Invoke Claude Code for conversion
  let convertedCode: string;
  try {
    // Use claude command directly with the prompt
    const result = await execa('claude', ['-p', prompt, '--no-input'], {
      timeout: 120000, // 2 minute timeout
      reject: false,
    });

    if (result.exitCode !== 0) {
      throw new Error(`Claude Code failed: ${result.stderr || result.stdout}`);
    }

    convertedCode = result.stdout.trim();

    // Clean up the output - remove markdown code blocks if present
    convertedCode = convertedCode.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(
        'Claude Code CLI not found. Please install it: npm install -g @anthropic-ai/claude-code',
      );
    }
    throw error;
  }

  // Ensure target directory exists
  await mkdir(dirname(targetPath), { recursive: true });

  // Write converted code to target file
  await writeFile(targetPath, convertedCode, 'utf-8');

  return targetPath;
}

/**
 * Get the relative path from repo root
 */
export function getRelativePath(absolutePath: string): string {
  const repoRoot = getRepoRoot();
  return absolutePath.replace(repoRoot + '/', '');
}
