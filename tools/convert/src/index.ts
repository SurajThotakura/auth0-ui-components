import chalk from 'chalk';
import { program } from 'commander';
import Enquirer from 'enquirer';
import ora from 'ora';

import { generateConversionPrompt, generateIntegrationPrompt } from './claude-invoker.js';
import { createTarball, exampleAppExists } from './example-app-integration.js';
import { validateBuild } from './validator.js';

const SUPPORTED_FRAMEWORKS = ['vue', 'angular', 'svelte'] as const;
type Framework = (typeof SUPPORTED_FRAMEWORKS)[number];

const enquirer = new Enquirer();

program
  .name('convert')
  .description('Convert React components to other UI frameworks')
  .version('1.0.0');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Wait for user confirmation
// ─────────────────────────────────────────────────────────────────────────────
async function waitForConfirmation(message: string): Promise<boolean> {
  const response = (await enquirer.prompt({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: true,
  })) as { confirmed: boolean };
  return response.confirmed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Print step header
// ─────────────────────────────────────────────────────────────────────────────
function printStep(stepNumber: number, totalSteps: number, title: string) {
  console.log(chalk.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.white.bold(`  Step ${stepNumber}/${totalSteps}: ${title}`));
  console.log(chalk.cyan('═'.repeat(60) + '\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Print Claude Code instructions
// ─────────────────────────────────────────────────────────────────────────────
function printClaudeInstructions(repoRoot: string) {
  console.log(chalk.yellow('\n📋 Instructions:\n'));
  console.log(chalk.white('  1. Open a NEW terminal window'));
  console.log(chalk.white('  2. Navigate to the repo and start Claude Code:'));
  console.log(chalk.cyan(`     cd ${repoRoot} && claude\n`));
  console.log(chalk.white('  3. Paste the prompt (already in clipboard): ') + chalk.gray('Cmd+V'));
  console.log(chalk.white('  4. Guide Claude through the task'));
  console.log(chalk.white('  5. Come back here when done\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDED command - Interactive guided workflow
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('run')
  .description('Guided interactive conversion workflow')
  .requiredOption(
    '-c, --component <path>',
    'Path to React component (relative to packages/react/src)',
  )
  .requiredOption('-t, --to <framework>', 'Target framework: vue, angular, svelte')
  .action(async (options: { component: string; to: string }) => {
    const framework = options.to.toLowerCase() as Framework;
    const componentPath = options.component;

    if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
      console.error(
        chalk.red(
          `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
        ),
      );
      process.exit(1);
    }

    if (framework !== 'vue') {
      console.log(
        chalk.yellow(
          `\nNote: Only Vue conversion is fully implemented. ${framework} coming soon.\n`,
        ),
      );
    }

    const repoRoot = process.cwd();
    const totalSteps = 6;

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Guided Conversion\n'));
    console.log(chalk.gray(`Component: ${componentPath}`));
    console.log(chalk.gray(`Target: ${framework}`));
    console.log(chalk.gray(`This wizard will guide you through all ${totalSteps} steps.\n`));

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Generate conversion prompt
    // ─────────────────────────────────────────────────────────────────────────
    printStep(1, totalSteps, 'Prepare Conversion Prompt');

    console.log(chalk.gray('Generating conversion prompt and copying to clipboard...\n'));

    const conversionResult = await generateConversionPrompt({
      componentPath,
      targetFramework: framework,
    });

    if (!conversionResult.success) {
      console.error(chalk.red(`\nError: ${conversionResult.error}\n`));
      process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: User runs Claude Code for conversion
    // ─────────────────────────────────────────────────────────────────────────
    printStep(2, totalSteps, 'Convert with Claude Code');

    printClaudeInstructions(repoRoot);

    const conversionDone = await waitForConfirmation(
      'Have you completed the conversion in Claude Code?',
    );

    if (!conversionDone) {
      console.log(chalk.yellow('\n⚠ Conversion cancelled. Run the command again when ready.\n'));
      process.exit(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Validate & Package
    // ─────────────────────────────────────────────────────────────────────────
    printStep(3, totalSteps, 'Validate & Package');

    let hasErrors = false;

    // Type check
    const typeCheckSpinner = ora('Running type check...').start();
    try {
      const { execa } = await import('execa');
      await execa('pnpm', ['type-check'], {
        cwd: `packages/${framework}`,
        reject: true,
      });
      typeCheckSpinner.succeed('Type check passed');
    } catch (error) {
      typeCheckSpinner.fail('Type check failed');
      const stderr = (error as { stderr?: string }).stderr || '';
      if (stderr) {
        console.log(chalk.red('\nErrors:'));
        console.log(chalk.gray(stderr.slice(0, 1000)));
      }
      hasErrors = true;
    }

    // Build
    const buildSpinner = ora('Running build...').start();
    const buildResult = await validateBuild(framework);

    if (!buildResult.success) {
      buildSpinner.fail('Build failed');
      if (buildResult.errors) {
        console.log(chalk.red('\nBuild errors:'));
        buildResult.errors.forEach((e) => console.log(chalk.gray(`  ${e}`)));
      }
      hasErrors = true;
    } else {
      buildSpinner.succeed('Build passed');
    }

    if (hasErrors) {
      console.log(chalk.red('\n✗ Validation failed.\n'));

      const retry = await waitForConfirmation(
        'Would you like to go back to Claude Code to fix the errors?',
      );

      if (retry) {
        console.log(chalk.yellow('\n📋 Go back to Claude Code and fix the errors.'));
        console.log(chalk.gray('Then run this command again.\n'));
      }
      process.exit(1);
    }

    // Create tarball
    const tarballPath = await createTarball(framework);
    if (tarballPath) {
      console.log(chalk.green(`\n✓ Tarball created: ${tarballPath}`));
    }

    console.log(chalk.green('\n✓ Validation passed!\n'));

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Generate integration prompt
    // ─────────────────────────────────────────────────────────────────────────
    printStep(4, totalSteps, 'Prepare Integration Prompt');

    const appExists = exampleAppExists(framework);

    if (!appExists) {
      console.log(chalk.yellow('⚠ Example app does not exist yet.'));
      console.log(chalk.gray('  The integration prompt will include scaffolding instructions.\n'));
    }

    console.log(chalk.gray('Generating integration prompt and copying to clipboard...\n'));

    const integrationResult = await generateIntegrationPrompt({
      componentPath,
      targetFramework: framework,
      exampleAppExists: appExists,
    });

    if (!integrationResult.success) {
      console.error(chalk.red(`\nError: ${integrationResult.error}\n`));
      process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5: User runs Claude Code for integration
    // ─────────────────────────────────────────────────────────────────────────
    printStep(5, totalSteps, 'Integrate with Claude Code');

    printClaudeInstructions(repoRoot);

    const integrationDone = await waitForConfirmation(
      'Have you completed the integration in Claude Code?',
    );

    if (!integrationDone) {
      console.log(chalk.yellow('\n⚠ Integration cancelled. Run the command again when ready.\n'));
      process.exit(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 6: Preview
    // ─────────────────────────────────────────────────────────────────────────
    printStep(6, totalSteps, 'Preview');

    const componentName = componentPath.split('/').pop()?.replace('.tsx', '') || '';
    const kebabName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    console.log(chalk.green('🎉 Conversion complete!\n'));
    console.log(chalk.white('To preview the component:\n'));
    console.log(chalk.cyan(`  cd examples/${framework} && pnpm dev\n`));
    console.log(chalk.white(`Then open: `) + chalk.cyan(`http://localhost:5173/${kebabName}\n`));

    const startServer = await waitForConfirmation('Would you like to start the dev server now?');

    if (startServer) {
      console.log(chalk.gray('\nStarting dev server...\n'));
      const { execa } = await import('execa');
      try {
        await execa('pnpm', ['dev'], {
          cwd: `examples/${framework}`,
          stdio: 'inherit',
        });
      } catch {
        console.log(chalk.yellow('\nDev server stopped.'));
      }
    }

    console.log(chalk.blue('\n✨ All done! Thanks for using the conversion tool.\n'));
  });

// ─────────────────────────────────────────────────────────────────────────────
// PREPARE command - Generate conversion prompt for Claude Code
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('prepare')
  .description('Generate a conversion prompt for Claude Code (copies to clipboard)')
  .requiredOption(
    '-c, --component <path>',
    'Path to React component (relative to packages/react/src)',
  )
  .requiredOption('-t, --to <framework>', 'Target framework: vue, angular, svelte')
  .action(async (options: { component: string; to: string }) => {
    const framework = options.to.toLowerCase() as Framework;

    if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
      console.error(
        chalk.red(
          `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
        ),
      );
      process.exit(1);
    }

    if (framework !== 'vue') {
      console.log(
        chalk.yellow(
          `\nNote: Only Vue conversion is fully implemented. ${framework} coming soon.\n`,
        ),
      );
    }

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Prepare Conversion\n'));

    const result = await generateConversionPrompt({
      componentPath: options.component,
      targetFramework: framework,
    });

    if (!result.success) {
      console.error(chalk.red(`\nError: ${result.error}\n`));
      process.exit(1);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE command - Run automated validation, build, and tarball creation
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('validate')
  .description('Validate conversion, run build, and create tarball')
  .requiredOption('-t, --to <framework>', 'Target framework: vue, angular, svelte')
  .option('--skip-tarball', 'Skip tarball creation', false)
  .action(async (options: { to: string; skipTarball?: boolean }) => {
    const framework = options.to.toLowerCase() as Framework;

    if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
      console.error(
        chalk.red(
          `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
        ),
      );
      process.exit(1);
    }

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Validate Conversion\n'));
    console.log(chalk.gray(`Framework: ${framework}\n`));

    let hasErrors = false;

    // Step 1: Type check
    const typeCheckSpinner = ora('Running type check...').start();
    try {
      const { execa } = await import('execa');
      await execa('pnpm', ['type-check'], {
        cwd: `packages/${framework}`,
        reject: true,
      });
      typeCheckSpinner.succeed('Type check passed');
    } catch (error) {
      typeCheckSpinner.fail('Type check failed');
      const stderr = (error as { stderr?: string }).stderr || '';
      if (stderr) {
        console.log(chalk.red('\nErrors:'));
        console.log(chalk.gray(stderr.slice(0, 1000)));
      }
      hasErrors = true;
    }

    // Step 2: Build
    const buildSpinner = ora('Running build...').start();
    const buildResult = await validateBuild(framework);

    if (!buildResult.success) {
      buildSpinner.fail('Build failed');
      if (buildResult.errors) {
        console.log(chalk.red('\nBuild errors:'));
        buildResult.errors.forEach((e) => console.log(chalk.gray(`  ${e}`)));
      }
      hasErrors = true;
    } else {
      buildSpinner.succeed('Build passed');
    }

    // Step 3: Create tarball
    if (!options.skipTarball && !hasErrors) {
      const tarballPath = await createTarball(framework);
      if (tarballPath) {
        console.log(chalk.green(`\n✓ Tarball created: ${tarballPath}`));
      }
    }

    // Summary
    console.log(chalk.blue('\n📊 Validation Summary\n'));

    if (hasErrors) {
      console.log(chalk.red('✗ Validation failed - fix errors and re-run\n'));
      process.exit(1);
    } else {
      console.log(chalk.green('✓ All validations passed\n'));
      console.log(chalk.gray('Next step: Integrate into example app:'));
      console.log(chalk.cyan('  pnpm convert integrate -c <component> -t vue\n'));
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATE command - Generate integration prompt for Claude Code
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('integrate')
  .description('Generate an integration prompt for Claude Code (copies to clipboard)')
  .requiredOption(
    '-c, --component <path>',
    'Path to React component (relative to packages/react/src)',
  )
  .requiredOption('-t, --to <framework>', 'Target framework: vue, angular, svelte')
  .action(async (options: { component: string; to: string }) => {
    const framework = options.to.toLowerCase() as Framework;

    if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
      console.error(
        chalk.red(
          `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
        ),
      );
      process.exit(1);
    }

    if (framework !== 'vue') {
      console.log(
        chalk.yellow(
          `\nNote: Only Vue integration is fully implemented. ${framework} coming soon.\n`,
        ),
      );
    }

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Prepare Integration\n'));

    const appExists = exampleAppExists(framework);

    const result = await generateIntegrationPrompt({
      componentPath: options.component,
      targetFramework: framework,
      exampleAppExists: appExists,
    });

    if (!result.success) {
      console.error(chalk.red(`\nError: ${result.error}\n`));
      process.exit(1);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// LIST command - List available components for conversion
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List available components for conversion')
  .option('-f, --filter <type>', 'Filter by type: blocks, components, hooks', '')
  .action(async (options) => {
    console.log(chalk.blue('\n📋 Available Components\n'));

    const types = options.filter ? [options.filter] : ['blocks', 'components', 'hooks'];

    for (const type of types) {
      console.log(chalk.cyan(`\n${type.charAt(0).toUpperCase() + type.slice(1)}:`));
      console.log(chalk.gray(`  Run: pnpm convert run -c ${type}/<name> -t vue`));
    }

    console.log(chalk.gray('\n─────────────────────────────────────────────────────'));
    console.log(chalk.white('\nUsage:'));
    console.log(chalk.cyan('  pnpm convert run -c <component> -t vue'));
    console.log(chalk.gray('  Interactive guided workflow through all steps\n'));
    console.log(chalk.gray('─────────────────────────────────────────────────────'));

    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.gray('  pnpm convert run -c components/ui/button.tsx -t vue'));
    console.log(
      chalk.gray(
        '  pnpm convert run -c blocks/my-organization/organization-management/organization-details-edit.tsx -t vue',
      ),
    );
    console.log();
  });

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW command - Show workflow overview (for reference)
// ─────────────────────────────────────────────────────────────────────────────
program
  .command('workflow')
  .description('Show the complete conversion workflow')
  .action(() => {
    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Conversion Workflow\n'));

    console.log(chalk.white('For an interactive guided experience, use:\n'));
    console.log(chalk.cyan('  pnpm convert run -c <component-path> -t vue\n'));

    console.log(chalk.gray('This will guide you through all 6 steps:'));
    console.log(chalk.gray('  1. Generate conversion prompt → clipboard'));
    console.log(chalk.gray('  2. Run Claude Code for conversion (you paste & guide)'));
    console.log(chalk.gray('  3. Validate & create tarball (automated)'));
    console.log(chalk.gray('  4. Generate integration prompt → clipboard'));
    console.log(chalk.gray('  5. Run Claude Code for integration (you paste & guide)'));
    console.log(chalk.gray('  6. Preview in dev server\n'));

    console.log(chalk.cyan('─'.repeat(60)));
    console.log(chalk.white('\nIndividual commands (advanced):\n'));
    console.log(chalk.gray('  pnpm convert prepare -c <path> -t vue    # Step 1'));
    console.log(chalk.gray('  pnpm convert validate -t vue             # Step 3'));
    console.log(chalk.gray('  pnpm convert integrate -c <path> -t vue  # Step 4'));
    console.log(chalk.cyan('─'.repeat(60) + '\n'));
  });

program.parse();
