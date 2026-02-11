import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

import chalk from 'chalk';
import { execa } from 'execa';

type Framework = 'vue' | 'angular' | 'svelte';

export interface IntegrationResult {
  success: boolean;
  exampleAppPath?: string;
  viewPath?: string;
  routePath?: string;
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
 * Convert component path to route path
 * e.g., "blocks/my-organization/organization-management/OrganizationDetailsEdit" -> "/organization-details-edit"
 */
function componentPathToRoute(componentPath: string): string {
  const componentName = basename(componentPath, '.tsx').replace('.vue', '');
  // Convert PascalCase to kebab-case
  const kebabName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `/${kebabName}`;
}

/**
 * Convert component path to route name
 * e.g., "OrganizationDetailsEdit" -> "organization-details-edit"
 */
function componentNameToRouteName(componentName: string): string {
  return componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Check if example app exists for the framework
 */
export function exampleAppExists(framework: Framework): boolean {
  const repoRoot = getRepoRoot();
  const exampleAppPath = join(repoRoot, 'examples', framework);
  return existsSync(exampleAppPath);
}

/**
 * Scaffold a new Vue example app based on React SPA structure
 */
export async function scaffoldExampleApp(framework: Framework): Promise<IntegrationResult> {
  if (framework !== 'vue') {
    return {
      success: false,
      error: `Scaffolding for ${framework} is not yet implemented`,
    };
  }

  const repoRoot = getRepoRoot();
  const exampleAppPath = join(repoRoot, 'examples', 'vue');

  console.log(chalk.blue(`\n📦 Scaffolding Vue example app at ${exampleAppPath}...\n`));

  try {
    // Create directory structure
    await mkdir(join(exampleAppPath, 'src', 'views'), { recursive: true });
    await mkdir(join(exampleAppPath, 'src', 'components'), { recursive: true });
    await mkdir(join(exampleAppPath, 'src', 'config'), { recursive: true });
    await mkdir(join(exampleAppPath, 'src', 'router'), { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'vue-spa-example',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vue-tsc && vite build',
        preview: 'vite preview',
        'type-check': 'vue-tsc --noEmit',
      },
      dependencies: {
        vue: '^3.5.0',
        'vue-router': '^4.4.0',
        '@auth0/auth0-vue': '^2.5.0',
        '@auth0/universal-components-vue':
          'file:../../packages/vue/auth0-universal-components-vue-1.0.0-beta.1.tgz',
        '@tanstack/vue-query': '^5.0.0',
      },
      devDependencies: {
        '@vitejs/plugin-vue': '^5.0.0',
        typescript: '^5.4.0',
        vite: '^5.4.0',
        'vue-tsc': '^2.0.0',
        '@tailwindcss/postcss': '^4.0.0',
      },
    };
    await writeFile(join(exampleAppPath, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
`;
    await writeFile(join(exampleAppPath, 'vite.config.ts'), viteConfig);

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'preserve',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
      references: [{ path: './tsconfig.node.json' }],
    };
    await writeFile(join(exampleAppPath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // Create tsconfig.node.json
    const tsconfigNode = {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        strict: true,
      },
      include: ['vite.config.ts'],
    };
    await writeFile(
      join(exampleAppPath, 'tsconfig.node.json'),
      JSON.stringify(tsconfigNode, null, 2),
    );

    // Create postcss.config.mjs
    const postcssConfig = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
    await writeFile(join(exampleAppPath, 'postcss.config.mjs'), postcssConfig);

    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue SPA Example - Auth0 Components</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
    await writeFile(join(exampleAppPath, 'index.html'), indexHtml);

    // Create src/config/env.ts
    const envConfig = `export const config = {
  auth0: {
    domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  },
};
`;
    await writeFile(join(exampleAppPath, 'src', 'config', 'env.ts'), envConfig);

    // Create src/main.ts
    const mainTs = `import { createApp } from 'vue';
import { createAuth0 } from '@auth0/auth0-vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';
import { router } from './router';
import { config } from './config/env';

import './style.css';

const app = createApp(App);

// 1. Router FIRST (required for Auth0)
app.use(router);

// 2. Auth0 plugin
app.use(createAuth0({
  domain: config.auth0.domain,
  clientId: config.auth0.clientId,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: config.auth0.audience,
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
}));

// 3. Vue Query
app.use(VueQueryPlugin);

app.mount('#app');
`;
    await writeFile(join(exampleAppPath, 'src', 'main.ts'), mainTs);

    // Create src/App.vue
    const appVue = `<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { Auth0ComponentProvider } from '@auth0/universal-components-vue';
import { config } from './config/env';
import NavBar from './components/NavBar.vue';

const { isLoading } = useAuth0();
</script>

<template>
  <Auth0ComponentProvider
    :auth-details="{ domain: config.auth0.domain }"
    :theme-settings="{ mode: 'light', theme: 'default' }"
  >
    <div class="min-h-screen bg-background">
      <NavBar />
      <main class="container mx-auto px-4 py-8">
        <div v-if="isLoading" class="flex justify-center p-8">
          Loading...
        </div>
        <RouterView v-else />
      </main>
    </div>
  </Auth0ComponentProvider>
</template>
`;
    await writeFile(join(exampleAppPath, 'src', 'App.vue'), appVue);

    // Create src/style.css
    // IMPORTANT: @source must come AFTER @import statements to avoid CSS parser errors
    const styleCss = `@import 'tailwindcss';
@import '@auth0/universal-components-vue/styles';

/* Tell Tailwind to scan Vue package components for class detection */
/* This MUST come after @import statements */
@source "../node_modules/@auth0/universal-components-vue/src/**/*.vue";

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
`;
    await writeFile(join(exampleAppPath, 'src', 'style.css'), styleCss);

    // Create src/components/NavBar.vue
    const navBarVue = `<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { RouterLink } from 'vue-router';

const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

const handleLogin = () => {
  loginWithRedirect();
};

const handleLogout = () => {
  logout({ logoutParams: { returnTo: window.location.origin } });
};
</script>

<template>
  <nav class="border-b bg-background">
    <div class="container mx-auto flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-6">
        <RouterLink to="/" class="text-lg font-semibold">
          Vue Example
        </RouterLink>

        <!-- Add links to converted components here -->
      </div>

      <div class="flex items-center gap-4">
        <template v-if="isAuthenticated">
          <span class="text-sm text-muted-foreground">
            {{ user?.name || user?.email }}
          </span>
          <button
            class="rounded-lg bg-muted px-4 py-2 text-sm hover:bg-muted/80"
            @click="handleLogout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <button
            class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            @click="handleLogin"
          >
            Login
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
`;
    await writeFile(join(exampleAppPath, 'src', 'components', 'NavBar.vue'), navBarVue);

    // Create src/views/HomePage.vue
    const homePageVue = `<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';

const { isAuthenticated } = useAuth0();
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold mb-4">Vue Example App</h1>
    <p class="text-muted-foreground mb-6">
      This example app demonstrates the Vue implementation of Auth0 UI Components.
    </p>

    <div v-if="isAuthenticated" class="space-y-4">
      <p>You are logged in. Navigate using the links above.</p>
    </div>
    <div v-else class="space-y-4">
      <p>Please log in to access the component demos.</p>
    </div>
  </div>
</template>
`;
    await writeFile(join(exampleAppPath, 'src', 'views', 'HomePage.vue'), homePageVue);

    // Create src/router/index.ts
    const routerIndex = `import { createRouter, createWebHistory } from 'vue-router';
import { createAuthGuard } from '@auth0/auth0-vue';

import HomePage from '@/views/HomePage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    // Add routes for converted components here
  ],
});

export { router };
`;
    await writeFile(join(exampleAppPath, 'src', 'router', 'index.ts'), routerIndex);

    // Create .env.example
    const envExample = `VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api
`;
    await writeFile(join(exampleAppPath, '.env.example'), envExample);

    // Run pnpm install
    console.log(chalk.gray('Installing dependencies...\n'));
    await execa('pnpm', ['install'], {
      cwd: exampleAppPath,
      stdio: 'inherit',
    });

    console.log(chalk.green(`\n✓ Vue example app scaffolded at ${exampleAppPath}\n`));

    return {
      success: true,
      exampleAppPath,
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
 * Integrate a converted component into the example app
 */
export async function integrateIntoExampleApp(
  framework: Framework,
  componentPath: string,
  convertedPath: string,
): Promise<IntegrationResult> {
  if (framework !== 'vue') {
    return {
      success: false,
      error: `Integration for ${framework} is not yet implemented`,
    };
  }

  const repoRoot = getRepoRoot();
  const exampleAppPath = join(repoRoot, 'examples', 'vue');

  // Check if example app exists, scaffold if not
  if (!exampleAppExists(framework)) {
    console.log(chalk.yellow('Example app does not exist, scaffolding...\n'));
    const scaffoldResult = await scaffoldExampleApp(framework);
    if (!scaffoldResult.success) {
      return scaffoldResult;
    }
  }

  const componentName = basename(componentPath, '.tsx').replace('.vue', '');
  const routeName = componentNameToRouteName(componentName);
  const routePath = componentPathToRoute(componentPath);

  console.log(chalk.blue(`\n🔗 Integrating ${componentName} into example app...\n`));

  try {
    // 1. Create view component
    const viewPath = join(exampleAppPath, 'src', 'views', `${componentName}Page.vue`);
    const viewContent = `<script setup lang="ts">
import { ${componentName} } from '@auth0/universal-components-vue';
</script>

<template>
  <div class="max-w-3xl">
    <${componentName} />
  </div>
</template>
`;
    await writeFile(viewPath, viewContent);
    console.log(chalk.gray(`Created view: ${viewPath}`));

    // 2. Update router
    const routerPath = join(exampleAppPath, 'src', 'router', 'index.ts');
    let routerContent = await readFile(routerPath, 'utf-8');

    // Add import if not present
    const importStatement = `import ${componentName}Page from '@/views/${componentName}Page.vue';`;
    if (!routerContent.includes(importStatement)) {
      // Add import after the last import
      const lastImportMatch = routerContent.match(/import .+ from .+;/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        routerContent = routerContent.replace(lastImport, `${lastImport}\n${importStatement}`);
      }
    }

    // Add route if not present
    const routeConfig = `    {
      path: '${routePath}',
      name: '${routeName}',
      component: ${componentName}Page,
      beforeEnter: createAuthGuard(),
    },`;

    if (!routerContent.includes(`path: '${routePath}'`)) {
      // Add route before the closing bracket of routes array
      routerContent = routerContent.replace(
        '// Add routes for converted components here',
        `// Add routes for converted components here\n${routeConfig}`,
      );
    }

    await writeFile(routerPath, routerContent);
    console.log(chalk.gray(`Updated router: ${routerPath}`));

    // 3. Update NavBar with link
    const navBarPath = join(exampleAppPath, 'src', 'components', 'NavBar.vue');
    let navBarContent = await readFile(navBarPath, 'utf-8');

    const navLink = `        <RouterLink
            v-if="isAuthenticated"
            to="${routePath}"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            ${componentName.replace(/([A-Z])/g, ' $1').trim()}
          </RouterLink>`;

    if (!navBarContent.includes(`to="${routePath}"`)) {
      navBarContent = navBarContent.replace(
        '<!-- Add links to converted components here -->',
        `<!-- Add links to converted components here -->\n${navLink}`,
      );
    }

    await writeFile(navBarPath, navBarContent);
    console.log(chalk.gray(`Updated NavBar: ${navBarPath}`));

    // 4. Run type-check
    console.log(chalk.gray('\nRunning type-check...\n'));
    try {
      await execa('pnpm', ['type-check'], {
        cwd: exampleAppPath,
        stdio: 'inherit',
      });
    } catch {
      console.log(chalk.yellow('Type-check had warnings (may be unrelated to integration)'));
    }

    console.log(chalk.green(`\n✓ Component integrated into example app`));
    console.log(chalk.gray(`  View: ${viewPath}`));
    console.log(chalk.gray(`  Route: ${routePath}`));
    console.log(chalk.gray(`  Preview: http://localhost:5173${routePath}\n`));

    return {
      success: true,
      exampleAppPath,
      viewPath,
      routePath,
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
 * Create a tarball of the Vue package
 */
export async function createTarball(framework: Framework): Promise<string | null> {
  if (framework !== 'vue') {
    console.log(chalk.yellow(`Tarball creation for ${framework} not yet implemented`));
    return null;
  }

  const repoRoot = getRepoRoot();
  const packageDir = join(repoRoot, 'packages', framework);

  console.log(chalk.blue('\n📦 Creating tarball...\n'));

  try {
    // Build first
    console.log(chalk.gray('Building package...\n'));
    await execa('pnpm', ['build'], {
      cwd: packageDir,
      stdio: 'inherit',
    });

    // Pack
    console.log(chalk.gray('\nCreating tarball...\n'));
    const { stdout } = await execa('pnpm', ['pack'], {
      cwd: packageDir,
    });

    const tarballName = stdout.trim();
    const tarballPath = join(packageDir, tarballName);

    console.log(chalk.green(`✓ Tarball created: ${tarballPath}\n`));

    return tarballPath;
  } catch (error) {
    console.log(chalk.red(`Failed to create tarball: ${error}`));
    return null;
  }
}
