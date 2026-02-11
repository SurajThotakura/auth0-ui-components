# Vue Package Architecture

> Directory structure, entry points, and build configuration for `@auth0/universal-components-vue`.

---

## Package Identity

- **Name:** `@auth0/universal-components-vue`
- **Runtime:** Node 18+, ESM, TypeScript
- **Framework:** Vue 3.5+ with Composition API
- **UI Pattern:** [shadcn-vue](https://www.shadcn-vue.com) (reka-ui + CVA + Tailwind v4)

---

## Directory Structure

```
packages/vue/
├── package.json              # Vue-specific dependencies
├── tsconfig.json             # TypeScript configuration
├── tsup.config.ts            # Build configuration
├── components.json           # shadcn-vue CLI configuration
├── registry.json             # shadcn-vue registry definition
│
└── src/
    ├── index.ts              # SPA entry point (imports @auth0/auth0-vue)
    ├── proxy.ts              # Proxy/RWA entry point (no @auth0/auth0-vue)
    ├── env.d.ts              # Vue type shims for .vue files
    │
    ├── lib/
    │   └── utils.ts          # cn() utility (clsx + tailwind-merge)
    │
    ├── providers/            # ⚠️ CRITICAL — Create first
    │   ├── Auth0ComponentProvider.vue
    │   ├── Auth0ProxyComponentProvider.vue
    │   └── index.ts
    │
    ├── composables/          # Vue composition functions
    │   ├── use-core-client.ts
    │   ├── use-translator.ts
    │   ├── use-theme.ts
    │   ├── use-scope-manager.ts
    │   ├── use-toast.ts
    │   ├── index.ts
    │   └── my-organization/
    │       └── organization-management/
    │           └── use-organization-details-edit.ts
    │
    ├── components/
    │   ├── ui/               # ⚠️ FLAT structure (not nested)
    │   │   ├── Button.vue
    │   │   ├── Card.vue
    │   │   ├── CardHeader.vue
    │   │   ├── CardContent.vue
    │   │   ├── CardFooter.vue
    │   │   ├── Spinner.vue
    │   │   ├── TextField.vue
    │   │   ├── FormActions.vue
    │   │   ├── Section.vue
    │   │   ├── Separator.vue
    │   │   ├── Header.vue
    │   │   ├── dialog/       # Only multi-part components get subdirs
    │   │   │   ├── Dialog.vue
    │   │   │   ├── DialogTrigger.vue
    │   │   │   ├── DialogContent.vue
    │   │   │   └── index.ts
    │   │   └── index.ts      # Single barrel file for ALL UI exports
    │   │
    │   ├── my-organization/
    │   │   └── organization-management/
    │   │       └── organization-details/
    │   │           ├── OrganizationDetails.vue
    │   │           ├── SettingsDetails.vue
    │   │           ├── BrandingDetails.vue
    │   │           └── index.ts
    │   │
    │   ├── WithOrganizationService.vue
    │   └── WithAccountService.vue
    │
    ├── blocks/
    │   ├── index.ts
    │   └── my-organization/
    │       └── organization-management/
    │           ├── OrganizationDetailsEdit.vue
    │           └── index.ts
    │
    ├── types/
    │   ├── injection-keys.ts # InjectionKey symbols
    │   └── my-organization/
    │       └── organization-management/
    │           ├── organization-details-types.ts
    │           ├── organization-details-edit-types.ts
    │           └── index.ts
    │
    └── styles/               # ⚠️ SHARED with React (copy from packages/react/src/styles/)
        ├── globals.css
        ├── font-sizes.css
        ├── light-palette.css
        ├── dark-palette.css
        └── themes/
            ├── default.css
            ├── minimal.css
            └── rounded.css
```

---

## Important Structure Rules

### UI Components: FLAT Structure

```
✅ Correct:
components/ui/
├── Button.vue
├── Card.vue
├── Spinner.vue
└── index.ts

❌ Wrong:
components/ui/
├── button/
│   ├── Button.vue
│   └── index.ts
├── card/
│   └── Card.vue
```

**Exception:** Only multi-part components (Dialog, Select with 4+ sub-components) warrant subdirectories.

### Styles: SHARED with React

The entire `styles/` directory is **copied from React** — these are 100% framework-agnostic CSS files:

```bash
# Copy styles from React package
cp -r packages/react/src/styles packages/vue/src/styles
```

---

## Utility Functions

### cn() utility (`src/lib/utils.ts`)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Entry Points

### SPA Mode (`src/index.ts`)

```typescript
// Providers
export { default as Auth0ComponentProvider } from './providers/Auth0ComponentProvider.vue';

// Blocks
export * from './blocks';

// Components
export * from './components/ui';

// Composables
export * from './composables';

// Types
export type * from './types';
```

**Note:** This entry imports `@auth0/auth0-vue` (via the provider).

### Proxy Mode (`src/proxy.ts`)

```typescript
// Providers
export { default as Auth0ProxyComponentProvider } from './providers/Auth0ProxyComponentProvider.vue';

// Same exports as index.ts...
export * from './blocks';
export * from './components/ui';
export * from './composables';
export type * from './types';
```

**Note:** This entry does NOT import `@auth0/auth0-vue` for tree-shaking.

---

## Package Configuration (package.json)

```json
{
  "name": "@auth0/universal-components-vue",
  "version": "1.0.0-beta.1",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./proxy": {
      "types": "./dist/proxy.d.ts",
      "import": "./dist/proxy.mjs",
      "require": "./dist/proxy.js"
    },
    "./styles": "./src/styles/globals.css"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "@auth0/universal-components-core": "workspace:*",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "reka-ui": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "peerDependencies": {
    "@auth0/auth0-vue": "^2.5.0",
    "@tanstack/vue-query": "^5.0.0",
    "@vee-validate/zod": "^4.15.0",
    "vee-validate": "^4.15.0",
    "vue": "^3.5.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vitest": "^2.0.0",
    "vue-tsc": "^2.0.0"
  }
}
```

---

## TypeScript Configuration (tsconfig.json)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "strict": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/composables/*": ["./src/composables/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Vue Type Shims (`src/env.d.ts`)

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

---

## Build Configuration (tsup)

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    proxy: 'src/proxy.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [
    'vue',
    '@auth0/auth0-vue',
    'reka-ui',
    '@vueuse/core',
    'vee-validate',
    '@vee-validate/zod',
    '@tanstack/vue-query',
  ],
});
```

---

## Package Exports

```json
{
  "name": "@auth0/universal-components-vue",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./proxy": {
      "types": "./dist/proxy.d.ts",
      "import": "./dist/proxy.mjs",
      "require": "./dist/proxy.js"
    },
    "./styles": "./dist/styles.css"
  }
}
```

---

## Commands

| Task       | Command                              |
| ---------- | ------------------------------------ |
| Install    | `pnpm install` (from repo root)      |
| Build      | `cd packages/vue && pnpm build`      |
| Type check | `cd packages/vue && pnpm type-check` |
| Test       | `cd packages/vue && pnpm test`       |
| Dev mode   | `cd packages/vue && pnpm dev`        |

---

## Shared vs Vue-Specific Assets

| Asset               | Shared? | Notes                              |
| ------------------- | ------- | ---------------------------------- |
| `styles/*.css`      | ✅      | Identical CSS files                |
| `cn()` utility      | ✅      | Same logic: clsx + tailwind-merge  |
| CVA variant strings | ✅      | Copy from React exactly            |
| PostCSS config      | ✅      | Same `@tailwindcss/postcss` plugin |
| Provider components | ❌      | Vue-specific (provide/inject)      |
| Composables         | ❌      | Vue-specific (replace React hooks) |
