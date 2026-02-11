import chalk from 'chalk';
import { program } from 'commander';
import ora from 'ora';

import { checkClaudeCodeAvailable, launchClaudeCodeSession } from './claude-invoker.js';
import {
  createTarball,
  exampleAppExists,
  integrateIntoExampleApp,
  scaffoldExampleApp,
} from './example-app-integration.js';
import { checkGitAvailable, createPullRequest } from './git.js';
import { validateBuild, validateOutput } from './validator.js';

const SUPPORTED_FRAMEWORKS = ['vue', 'angular', 'svelte'] as const;
type Framework = (typeof SUPPORTED_FRAMEWORKS)[number];

interface ConvertOptions {
  component: string;
  to: string;
  pr?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  autoValidate?: boolean;
  createTarball?: boolean;
  integrateExample?: boolean;
  interactive?: boolean;
}

program
  .name('convert')
  .description('Convert React components to other UI frameworks')
  .version('1.0.0');

program
  .command('component')
  .description('Convert a React component to another framework')
  .requiredOption(
    '-c, --component <path>',
    'Path to React component (relative to packages/react/src)',
  )
  .requiredOption(
    '-t, --to <frameworks>',
    'Target framework(s): vue, angular, svelte (comma-separated)',
  )
  .option('--pr', 'Create a pull request with the conversion', false)
  .option('--dry-run', 'Show what would be converted without making changes', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--auto-validate', 'Run validation after conversion', true)
  .option('--create-tarball', 'Create .tgz package after conversion', true)
  .option('--integrate-example', 'Integrate into example app', true)
  .option('-i, --interactive', 'Run Claude Code interactively', true)
  .action(async (options: ConvertOptions) => {
    const frameworks = options.to.split(',').map((f) => f.trim().toLowerCase()) as Framework[];

    // Validate frameworks
    for (const framework of frameworks) {
      if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
        console.error(
          chalk.red(
            `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
          ),
        );
        process.exit(1);
      }
    }

    // Currently only Vue is fully implemented
    if (frameworks.some((f) => f !== 'vue')) {
      console.log(
        chalk.yellow(
          '\nNote: Only Vue conversion is fully implemented. Other frameworks coming soon.\n',
        ),
      );
    }

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Framework Converter\n'));
    console.log(chalk.gray(`Source: packages/react/src/${options.component}`));
    console.log(chalk.gray(`Target frameworks: ${frameworks.join(', ')}`));
    console.log(chalk.gray(`Create PR: ${options.pr ? 'yes' : 'no'}`));
    console.log(chalk.gray(`Dry run: ${options.dryRun ? 'yes' : 'no'}`));
    console.log(chalk.gray(`Auto-validate: ${options.autoValidate ? 'yes' : 'no'}`));
    console.log(chalk.gray(`Create tarball: ${options.createTarball ? 'yes' : 'no'}`));
    console.log(chalk.gray(`Integrate example: ${options.integrateExample ? 'yes' : 'no'}\n`));

    // Check prerequisites
    const claudeAvailable = await checkClaudeCodeAvailable();
    if (!claudeAvailable) {
      console.error(chalk.red('Error: Claude Code CLI not found. Please install it first.'));
      console.log(chalk.gray('Visit: https://claude.ai/claude-code\n'));
      process.exit(1);
    }

    const results: {
      framework: Framework;
      success: boolean;
      outputPath?: string;
      error?: string;
    }[] = [];

    for (const framework of frameworks) {
      const spinner = ora(`Converting to ${framework}...`).start();

      try {
        if (options.dryRun) {
          spinner.info(`[Dry run] Would convert ${options.component} to ${framework}`);
          results.push({ framework, success: true });
          continue;
        }

        // ─────────────────────────────────────────────────────────────
        // Step 1: Launch Claude Code for conversion
        // ─────────────────────────────────────────────────────────────
        spinner.text = `Launching Claude Code for ${framework} conversion...`;
        spinner.stop();

        const conversionResult = await launchClaudeCodeSession({
          componentPath: options.component,
          targetFramework: framework,
          autoRetry: true,
        });

        if (!conversionResult.success) {
          results.push({
            framework,
            success: false,
            error: conversionResult.error || 'Conversion failed',
          });
          continue;
        }

        const outputPath = conversionResult.outputPath!;
        console.log(chalk.green(`\n✓ Component converted: ${outputPath}\n`));

        // ─────────────────────────────────────────────────────────────
        // Step 2: Validate the conversion
        // ─────────────────────────────────────────────────────────────
        if (options.autoValidate) {
          const validateSpinner = ora('Validating conversion...').start();

          const validationResult = await validateOutput(outputPath, framework);

          if (!validationResult.success) {
            validateSpinner.fail('Validation failed');
            if (validationResult.errors) {
              console.log(chalk.red('\nErrors:'));
              validationResult.errors.forEach((e) => console.log(chalk.gray(`  ${e}`)));
            }

            results.push({
              framework,
              success: false,
              outputPath,
              error: 'Validation failed',
            });
            continue;
          }

          validateSpinner.succeed('Validation passed');

          if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.log(chalk.yellow('\nWarnings:'));
            validationResult.warnings.forEach((w) => console.log(chalk.gray(`  ${w}`)));
          }

          // Run full build validation
          const buildSpinner = ora('Running build validation...').start();
          const buildResult = await validateBuild(framework);

          if (!buildResult.success) {
            buildSpinner.fail('Build validation failed');
            if (buildResult.errors) {
              console.log(chalk.red('\nBuild errors:'));
              buildResult.errors.forEach((e) => console.log(chalk.gray(`  ${e}`)));
            }
          } else {
            buildSpinner.succeed('Build validation passed');
          }
        }

        // ─────────────────────────────────────────────────────────────
        // Step 3: Create tarball
        // ─────────────────────────────────────────────────────────────
        if (options.createTarball && framework === 'vue') {
          const tarballPath = await createTarball(framework);
          if (tarballPath) {
            console.log(chalk.green(`✓ Tarball created: ${tarballPath}`));
          }
        }

        // ─────────────────────────────────────────────────────────────
        // Step 4: Integrate into example app
        // ─────────────────────────────────────────────────────────────
        if (options.integrateExample && framework === 'vue') {
          const integrationResult = await integrateIntoExampleApp(
            framework,
            options.component,
            outputPath,
          );

          if (integrationResult.success) {
            console.log(chalk.green(`✓ Integrated into example app`));
            console.log(
              chalk.gray(`  Preview: http://localhost:5173${integrationResult.routePath}`),
            );
          } else {
            console.log(chalk.yellow(`Warning: Integration failed: ${integrationResult.error}`));
          }
        }

        results.push({ framework, success: true, outputPath });
      } catch (error) {
        spinner.stop();
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`Failed to convert to ${framework}: ${errorMessage}`));
        results.push({ framework, success: false, error: errorMessage });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────
    console.log(chalk.blue('\n📊 Conversion Summary\n'));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (successful.length > 0) {
      console.log(chalk.green(`✓ Successful: ${successful.map((r) => r.framework).join(', ')}`));
      for (const result of successful) {
        if (result.outputPath) {
          console.log(chalk.gray(`  ${result.framework}: ${result.outputPath}`));
        }
      }
    }

    if (failed.length > 0) {
      console.log(chalk.red(`✗ Failed: ${failed.map((r) => r.framework).join(', ')}`));
      for (const result of failed) {
        console.log(chalk.gray(`  ${result.framework}: ${result.error}`));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Create PR if requested
    // ─────────────────────────────────────────────────────────────
    if (options.pr && successful.length > 0 && !options.dryRun) {
      console.log(chalk.blue('\n📝 Creating Pull Request...\n'));

      const { git, gh } = await checkGitAvailable();
      if (!git || !gh) {
        console.log(chalk.yellow('Warning: git or gh CLI not available, skipping PR creation'));
      } else {
        try {
          const prUrl = await createPullRequest(
            options.component,
            successful.map((r) => r.framework),
            successful.map((r) => r.outputPath!).filter(Boolean),
          );
          console.log(chalk.green(`✓ Pull request created: ${prUrl}`));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(chalk.red(`✗ Failed to create PR: ${errorMessage}`));
        }
      }
    }

    // Exit with error if any conversions failed
    if (failed.length > 0) {
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Convert multiple components at once')
  .requiredOption(
    '-p, --pattern <glob>',
    'Glob pattern for components (e.g., "components/ui/*.tsx")',
  )
  .requiredOption('-t, --to <frameworks>', 'Target framework(s): vue, angular, svelte')
  .option('--pr', 'Create a single pull request with all conversions', false)
  .option('--dry-run', 'Show what would be converted without making changes', false)
  .action(async (options) => {
    console.log(chalk.blue('\n🔄 Batch Conversion\n'));
    console.log(chalk.gray(`Pattern: packages/react/src/${options.pattern}`));
    console.log(chalk.gray(`Target: ${options.to}`));
    console.log(chalk.yellow('\nBatch conversion coming soon!\n'));
    console.log(chalk.gray('For now, convert components one at a time:'));
    console.log(chalk.cyan('  pnpm convert component -c <path> -t vue\n'));
  });

program
  .command('list')
  .description('List available components for conversion')
  .option('-f, --filter <type>', 'Filter by type: blocks, components, hooks', '')
  .action(async (options) => {
    console.log(chalk.blue('\n📋 Available Components\n'));

    const types = options.filter ? [options.filter] : ['blocks', 'components', 'hooks'];

    for (const type of types) {
      console.log(chalk.cyan(`\n${type.charAt(0).toUpperCase() + type.slice(1)}:`));
      console.log(chalk.gray(`  Run: pnpm convert component -c ${type}/<name> -t vue`));
    }

    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.gray('  pnpm convert component -c components/ui/button.tsx -t vue'));
    console.log(
      chalk.gray(
        '  pnpm convert component -c blocks/my-organization/organization-management/organization-details-edit.tsx -t vue',
      ),
    );
    console.log(chalk.gray('\nUse "pnpm convert component --help" for more options.\n'));
  });

program
  .command('scaffold')
  .description('Scaffold an example app for a framework')
  .requiredOption('-f, --framework <framework>', 'Target framework: vue, angular, svelte')
  .action(async (options) => {
    const framework = options.framework.toLowerCase() as Framework;

    if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
      console.error(
        chalk.red(
          `Error: Unsupported framework "${framework}". Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
        ),
      );
      process.exit(1);
    }

    if (exampleAppExists(framework)) {
      console.log(chalk.yellow(`\nExample app for ${framework} already exists.\n`));
      return;
    }

    const result = await scaffoldExampleApp(framework);

    if (result.success) {
      console.log(chalk.green(`\n✓ Example app scaffolded at ${result.exampleAppPath}\n`));
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray(`  1. cd examples/${framework}`));
      console.log(chalk.gray('  2. Copy .env.example to .env and fill in Auth0 credentials'));
      console.log(chalk.gray('  3. pnpm dev'));
    } else {
      console.log(chalk.red(`\n✗ Failed to scaffold: ${result.error}\n`));
      process.exit(1);
    }
  });

program.parse();
