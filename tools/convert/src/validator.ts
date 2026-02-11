import { dirname } from 'path';

import { execa } from 'execa';

type Framework = 'vue' | 'angular' | 'svelte';

interface ValidationResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Get the root directory of the monorepo
 */
function getRepoRoot(): string {
  return process.cwd().split('/tools/')[0] || process.cwd();
}

/**
 * Validate converted output based on framework
 */
export async function validateOutput(
  outputPath: string,
  framework: Framework,
): Promise<ValidationResult> {
  const repoRoot = getRepoRoot();
  const packageDir = `${repoRoot}/packages/${framework}`;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Run TypeScript type checking
  try {
    const tscCommand = framework === 'vue' ? 'vue-tsc' : 'tsc';
    await execa('npx', [tscCommand, '--noEmit', '--skipLibCheck'], {
      cwd: packageDir,
      reject: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Extract TypeScript errors from output
      const stderr = (error as { stderr?: string }).stderr || '';
      const stdout = (error as { stdout?: string }).stdout || '';
      const output = stderr || stdout;

      // Filter for errors related to the converted file
      const relevantErrors = output
        .split('\n')
        .filter((line) => line.includes(outputPath) || line.includes('error TS'))
        .slice(0, 5); // Limit to first 5 errors

      if (relevantErrors.length > 0) {
        errors.push(...relevantErrors);
      } else {
        // Generic type error
        warnings.push('TypeScript type checking had issues (may be unrelated to conversion)');
      }
    }
  }

  // Run ESLint if available
  try {
    const eslintConfig = framework === 'vue' ? 'eslint-plugin-vue' : 'eslint';
    await execa('npx', ['eslint', outputPath, '--max-warnings', '0'], {
      cwd: packageDir,
      reject: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      const stderr = (error as { stderr?: string }).stderr || '';
      const stdout = (error as { stdout?: string }).stdout || '';

      // Check if it's just a "not found" error for eslint config
      if (stderr.includes('ESLint couldn') || stdout.includes('ESLint couldn')) {
        warnings.push('ESLint not configured for this package');
      } else {
        warnings.push('ESLint found some issues');
      }
    }
  }

  // Framework-specific validation
  switch (framework) {
    case 'vue':
      // Check for common Vue anti-patterns
      await validateVueComponent(outputPath, warnings);
      break;
    case 'angular':
      // Check for common Angular issues
      await validateAngularComponent(outputPath, warnings);
      break;
    case 'svelte':
      // Check for common Svelte issues
      await validateSvelteComponent(outputPath, warnings);
      break;
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate Vue-specific patterns
 */
async function validateVueComponent(outputPath: string, warnings: string[]): Promise<void> {
  const { readFile } = await import('fs/promises');

  try {
    const content = await readFile(outputPath, 'utf-8');

    // Check for common Vue anti-patterns
    if (content.includes('ref.value') && content.includes('<template>')) {
      // Check if .value is used in template section
      const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
      if (templateMatch && templateMatch[1].includes('.value')) {
        warnings.push('Avoid using .value in Vue templates (refs are auto-unwrapped)');
      }
    }

    if (content.includes('props.') && !content.includes('defineProps')) {
      warnings.push('Props should be defined using defineProps<T>()');
    }

    // Check for reactive destructuring
    if (content.match(/const\s*\{.*\}\s*=\s*reactive\(/)) {
      warnings.push('Destructuring reactive() loses reactivity - use toRefs() instead');
    }
  } catch {
    // File read error, skip validation
  }
}

/**
 * Validate Angular-specific patterns
 */
async function validateAngularComponent(outputPath: string, warnings: string[]): Promise<void> {
  const { readFile } = await import('fs/promises');

  try {
    const content = await readFile(outputPath, 'utf-8');

    // Check for common Angular issues
    if (!content.includes('standalone: true')) {
      warnings.push('Angular 17+ prefers standalone components');
    }

    if (content.includes('subscribe(') && !content.includes('takeUntilDestroyed')) {
      warnings.push('Subscriptions should use takeUntilDestroyed() or be manually cleaned up');
    }

    if (content.includes('ngOnInit') && !content.includes('implements OnInit')) {
      warnings.push('Class should implement OnInit interface');
    }
  } catch {
    // File read error, skip validation
  }
}

/**
 * Validate Svelte-specific patterns
 */
async function validateSvelteComponent(outputPath: string, warnings: string[]): Promise<void> {
  const { readFile } = await import('fs/promises');

  try {
    const content = await readFile(outputPath, 'utf-8');

    // Check for common Svelte 5 patterns
    if (content.includes('export let') && !content.includes('$props')) {
      warnings.push('Svelte 5 uses $props() rune instead of export let');
    }

    if (content.includes('$:') && content.includes('$derived')) {
      warnings.push('Mixing $: reactive statements with $derived rune - prefer $derived');
    }

    if (content.includes('writable(') && content.includes('$state')) {
      warnings.push('Mixing stores with $state rune - prefer $state for component state');
    }
  } catch {
    // File read error, skip validation
  }
}

/**
 * Run the full build for a framework package
 */
export async function validateBuild(framework: Framework): Promise<ValidationResult> {
  const repoRoot = getRepoRoot();
  const packageDir = `${repoRoot}/packages/${framework}`;

  try {
    await execa('pnpm', ['build'], {
      cwd: packageDir,
      reject: true,
    });

    return { success: true };
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    return {
      success: false,
      errors: [`Build failed: ${stderr.slice(0, 500)}`],
    };
  }
}
