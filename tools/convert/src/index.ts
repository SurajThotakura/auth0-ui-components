import chalk from 'chalk';
import { program } from 'commander';
import ora from 'ora';

import { convertComponent } from './converter.js';
import { createPullRequest } from './git.js';
import { validateOutput } from './validator.js';

const SUPPORTED_FRAMEWORKS = ['vue', 'angular', 'svelte'] as const;
type Framework = (typeof SUPPORTED_FRAMEWORKS)[number];

interface ConvertOptions {
  component: string;
  to: string;
  pr?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
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

    console.log(chalk.blue('\n🔄 Auth0 Universal Components - Framework Converter\n'));
    console.log(chalk.gray(`Source: packages/react/src/${options.component}`));
    console.log(chalk.gray(`Target frameworks: ${frameworks.join(', ')}`));
    console.log(chalk.gray(`Create PR: ${options.pr ? 'yes' : 'no'}`));
    console.log(chalk.gray(`Dry run: ${options.dryRun ? 'yes' : 'no'}\n`));

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

        // Perform conversion
        const outputPath = await convertComponent(options.component, framework, {
          verbose: options.verbose,
        });

        // Validate output
        spinner.text = `Validating ${framework} output...`;
        const validation = await validateOutput(outputPath, framework);

        if (!validation.success) {
          spinner.warn(`Converted to ${framework} with warnings`);
          console.log(chalk.yellow(`  Warnings: ${validation.warnings?.join(', ')}`));
        } else {
          spinner.succeed(`Converted to ${framework}: ${outputPath}`);
        }

        results.push({ framework, success: true, outputPath });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        spinner.fail(`Failed to convert to ${framework}: ${errorMessage}`);
        results.push({ framework, success: false, error: errorMessage });
      }
    }

    // Summary
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

    // Create PR if requested
    if (options.pr && successful.length > 0 && !options.dryRun) {
      console.log(chalk.blue('\n📝 Creating Pull Request...\n'));

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
    console.log(chalk.yellow('\nBatch conversion is coming soon!\n'));
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

    console.log(chalk.gray('\nUse "pnpm convert component --help" for more options.\n'));
  });

program.parse();
