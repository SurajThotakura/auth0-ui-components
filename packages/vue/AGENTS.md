# AGENTS.md — @auth0/universal-components-vue

> ## ⛔ CRITICAL: READ BEFORE WRITING ANY CODE
>
> **Providers MUST be created FIRST before ANY other Vue code.**
>
> Vue's `provide`/`inject` system requires providers to exist before consumers.
> All composables use `inject()` — they will **fail silently** without providers.
>
> **Implementation order is NON-NEGOTIABLE:**
>
> 1. `src/types/injection-keys.ts` — Define InjectionKey symbols
> 2. `src/providers/Auth0ComponentProvider.vue` — SPA provider
> 3. `src/providers/Auth0ProxyComponentProvider.vue` — Proxy provider
> 4. `src/index.ts` + `src/proxy.ts` — Entry points exporting providers
> 5. Then and ONLY then: composables, components, blocks
>
> **Skip this order → Runtime errors with no useful stack trace.**
>
> See [Providers Section](#providers-critical--create-first) for implementation details.

---

## Identity

- **Package:** `@auth0/universal-components-vue`
- **Purpose:** Vue 3 port of the Auth0 UI component library (MFA, Organization Management, SSO, Domain Management)
- **Runtime:** Node 18+, ESM, TypeScript, Vue 3.5+
- **UI Pattern:** [shadcn-vue](https://www.shadcn-vue.com) (reka-ui + CVA + Tailwind v4)
- **Status:** POC — targeting OrganizationDetailsEdit feature

> This is a POC package. The React package (`packages/react`) follows the React
> [shadcn/ui](https://ui.shadcn.com) pattern. This Vue package follows the equivalent
> [shadcn-vue](https://www.shadcn-vue.com) pattern with `reka-ui` primitives.
>
> The `@auth0/universal-components-core` package is shared — never duplicate its logic.
>
> **For coding patterns, conversion rules, and code examples, see `SKILL.md`.**

---

## Quick Commands

| Task                  | Command                                  |
| --------------------- | ---------------------------------------- |
| Install               | `pnpm install` (from repo root)          |
| Build all             | `pnpm build`                             |
| Build Vue only        | `cd packages/vue && pnpm build`          |
| Test Vue only         | `cd packages/vue && pnpm test`           |
| Test watch            | `cd packages/vue && pnpm test:watch`     |
| Lint                  | `pnpm lint`                              |
| Type check            | `cd packages/vue && pnpm type-check`     |
| Dev mode              | `cd packages/vue && pnpm dev`            |
| Build shadcn registry | `cd packages/vue && pnpm registry:build` |

---

## Architecture (Directory Map)

```
packages/vue/
├── components.json               # shadcn-vue CLI configuration
├── registry.json                 # shadcn-vue registry definition
└── src/
    ├── index.ts                  # Main entry (SPA mode)
    ├── proxy.ts                  # Proxy/RWA entry
    │
    ├── lib/
    │   └── utils.ts              # cn() utility (clsx + tailwind-merge)
    │
    ├── components/
    │   ├── ui/                   # shadcn-vue UI primitives (⚠️ FLAT STRUCTURE)
    │   │   ├── Button.vue        # ✅ Flat file, no subdirectory
    │   │   ├── Card.vue
    │   │   ├── CardHeader.vue
    │   │   ├── CardContent.vue
    │   │   ├── CardFooter.vue
    │   │   ├── Spinner.vue
    │   │   ├── TextField.vue
    │   │   ├── Separator.vue
    │   │   ├── Section.vue
    │   │   ├── Header.vue
    │   │   ├── FormActions.vue
    │   │   ├── ColorPickerInput.vue
    │   │   ├── ImagePreviewField.vue
    │   │   ├── dialog/           # Only complex multi-part components get subdirs
    │   │   │   ├── Dialog.vue
    │   │   │   ├── DialogTrigger.vue
    │   │   │   ├── DialogContent.vue
    │   │   │   └── index.ts
    │   │   └── index.ts          # Single barrel file for ALL UI exports
    │   ├── my-organization/
    │   │   └── organization-management/
    │   │       └── organization-details/
    │   │           ├── OrganizationDetails.vue
    │   │           ├── SettingsDetails.vue
    │   │           ├── BrandingDetails.vue
    │   │           └── index.ts
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
    ├── composables/
    │   ├── use-core-client.ts
    │   ├── use-translator.ts
    │   ├── use-theme.ts
    │   ├── use-scope-manager.ts
    │   ├── use-toast.ts
    │   ├── use-error-handler.ts
    │   ├── index.ts
    │   └── my-organization/
    │       └── organization-management/
    │           └── use-organization-details-edit.ts
    │
    ├── providers/                # ⚠️ MANDATORY — created first
    │   ├── Auth0ComponentProvider.vue     # SPA mode
    │   └── Auth0ProxyComponentProvider.vue  # Proxy/RWA mode
    │
    ├── types/
    │   ├── injection-keys.ts     # InjectionKey symbols
    │   ├── common-types.ts
    │   └── my-organization/
    │       └── organization-management/
    │           ├── organization-details-types.ts
    │           ├── organization-details-edit-types.ts
    │           └── index.ts
    │
    └── styles/                   # ⚠️ SHARED with React package (framework-agnostic CSS)
        ├── globals.css
        ├── font-sizes.css
        ├── light-palette.css
        ├── dark-palette.css
        └── themes/
            ├── default.css
            ├── minimal.css
            └── rounded.css
```

> **⚠️ UI components use FLAT file structure.** `Button.vue` directly in `ui/`, NOT `ui/button/Button.vue`.
> Only complex multi-part components (Dialog, Select with 4+ sub-components) warrant subdirectories.
>
> **⚠️ The entire `styles/` directory is shared with the React package.**
> These files are 100% framework-agnostic CSS — identical in both packages.

---

## Shared vs Vue-Specific Assets

| Asset                                    | Shared? | Notes                                             |
| ---------------------------------------- | ------- | ------------------------------------------------- |
| `styles/*.css` (all files)               | ✅      | Identical CSS files, same build pipeline          |
| `cn()` utility                           | ✅      | Same logic: `clsx` + `tailwind-merge`             |
| CVA variant class strings                | ✅      | Must match React exactly — copy verbatim          |
| `applyTheme()` / `getComponentStyles()`  | ✅      | From `@auth0/universal-components-core`           |
| `StylingOptions` / `ThemeSettings` types | ✅      | From core                                         |
| `postcss.config.mjs`                     | ✅      | Same `@tailwindcss/postcss` plugin                |
| Provider components                      | ❌      | Vue-specific (`provide`/`inject`) — see SKILL.md  |
| Composables                              | ❌      | Vue-specific (replace React hooks) — see SKILL.md |

---

## Injection Keys

All cross-cutting concerns use typed `InjectionKey` symbols defined in
`src/types/injection-keys.ts`:

```ts
import type { InjectionKey, Ref } from 'vue';
import type { CoreClientInterface } from '@auth0/universal-components-core';

export const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');
export const THEME_KEY: InjectionKey<{ isDarkMode: Ref<boolean> }> = Symbol('Theme');
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManager> = Symbol('ScopeManager');
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
```

---

## Providers (⛔ CRITICAL — CREATE FIRST)

> **This is the most important section of this document.**
> Providers MUST exist before ANY composables or components are created.

### Why Providers Must Come First

Vue's `provide`/`inject` is NOT like React Context. Key differences:

| Aspect           | React Context                | Vue provide/inject           |
| ---------------- | ---------------------------- | ---------------------------- |
| Missing provider | Throws error or uses default | Returns `undefined` silently |
| Debug experience | Clear error message          | No error, just `undefined`   |
| Failure mode     | Obvious, immediate           | Silent, delayed, confusing   |

**If you skip providers:**

```ts
// In a composable
const coreClient = inject(CORE_CLIENT_KEY);
// coreClient is undefined — NO ERROR THROWN
// Later: "Cannot read property 'getMyOrganizationApiClient' of undefined"
```

### Provider Implementation

#### 1. Injection Keys (`src/types/injection-keys.ts`)

```ts
import type { InjectionKey, Ref } from 'vue';
import type { CoreClientInterface } from '@auth0/universal-components-core';

export interface ThemeContext {
  isDarkMode: Ref<boolean>;
}

export interface ScopeManagerContext {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => void;
  ensured: { me: string; 'my-org': string };
}

export interface ToastConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
}

export const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');
export const THEME_KEY: InjectionKey<ThemeContext> = Symbol('Theme');
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManagerContext> = Symbol('ScopeManager');
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
```

#### 2. SPA Provider (`src/providers/Auth0ComponentProvider.vue`)

```vue
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'; // ← SPA mode imports this
import type { AuthDetails, BasicAuth0ContextInterface } from '@auth0/universal-components-core';
import { CoreClient, applyTheme } from '@auth0/universal-components-core';
import { provide, ref, computed, onMounted, reactive } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

const props = defineProps<{
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  themeSettings?: { mode: 'light' | 'dark'; theme: string };
}>();

// Get Auth0 context from @auth0/auth0-vue
const auth0 = useAuth0();

// Map to BasicAuth0ContextInterface for core
const auth0Context = computed(
  (): BasicAuth0ContextInterface => ({
    isAuthenticated: auth0.isAuthenticated.value,
    isLoading: auth0.isLoading.value,
    user: auth0.user.value,
    getAccessTokenSilently: (opts) => auth0.getAccessTokenSilently(opts),
  }),
);

// Initialize core client
const coreClient = new CoreClient({
  ...props.authDetails,
  contextInterface: auth0Context.value,
});

// Theme state
const isDarkMode = ref(props.themeSettings?.mode === 'dark');

// Scope manager
const ensuredScopes = reactive({ me: '', 'my-org': '' });
const scopeManager = {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => {
    const current = new Set(ensuredScopes[api].split(' ').filter(Boolean));
    scopes
      .split(' ')
      .filter(Boolean)
      .forEach((s) => current.add(s));
    ensuredScopes[api] = Array.from(current).join(' ');
  },
  ensured: ensuredScopes,
};

// ⚠️ CRITICAL: All provide() calls must happen here
provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode });
provide(SCOPE_MANAGER_KEY, scopeManager);
provide(TOAST_KEY, { position: 'bottom-right', duration: 5000 });

onMounted(() => applyTheme(props.themeSettings));
</script>

<template>
  <slot />
</template>
```

#### 3. Proxy Provider (`src/providers/Auth0ProxyComponentProvider.vue`)

```vue
<script setup lang="ts">
// ⚠️ NO import from @auth0/auth0-vue — proxy handles auth server-side
import type { AuthDetails } from '@auth0/universal-components-core';
import { CoreClient, applyTheme } from '@auth0/universal-components-core';
import { provide, ref, onMounted, reactive } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

const props = defineProps<{
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  themeSettings?: { mode: 'light' | 'dark'; theme: string };
}>();

// Core client WITHOUT auth context (proxy handles tokens)
const coreClient = new CoreClient({
  ...props.authDetails,
  contextInterface: undefined, // ← Key difference from SPA
});

const isDarkMode = ref(props.themeSettings?.mode === 'dark');
const ensuredScopes = reactive({ me: '', 'my-org': '' });

provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode });
provide(SCOPE_MANAGER_KEY, { registerScopes: () => {}, ensured: ensuredScopes });
provide(TOAST_KEY, { position: 'bottom-right', duration: 5000 });

onMounted(() => applyTheme(props.themeSettings));
</script>

<template>
  <slot />
</template>
```

#### 4. Entry Points

**`src/index.ts`** (SPA — includes @auth0/auth0-vue):

```ts
// Providers
export { Auth0ComponentProvider } from './providers';

// Everything else...
export * from './blocks';
export * from './composables';
```

**`src/proxy.ts`** (Proxy — excludes @auth0/auth0-vue):

```ts
// Providers
export { Auth0ProxyComponentProvider } from './providers';

// Everything else...
export * from './blocks';
export * from './composables';
```

### Provider Checklist

Before moving to composables, verify:

- [ ] `src/types/injection-keys.ts` exists with all 4 keys
- [ ] `src/providers/Auth0ComponentProvider.vue` calls `provide()` for all 4 keys
- [ ] `src/providers/Auth0ProxyComponentProvider.vue` calls `provide()` for all 4 keys
- [ ] `src/providers/index.ts` exports both providers
- [ ] `src/index.ts` exports `Auth0ComponentProvider`
- [ ] `src/proxy.ts` exports `Auth0ProxyComponentProvider`
- [ ] Neither proxy file imports `@auth0/auth0-vue`

---

## @auth0/auth0-vue SDK — Architecture Overview

The React package uses `@auth0/auth0-react`; this Vue package uses `@auth0/auth0-vue`.

### Two Modes of Operation

**SPA mode (`index.ts`):**

1. Host app installs Auth0 plugin: `app.use(createAuth0({ domain, clientId, ... }))`
2. `Auth0ComponentProvider.vue` calls `useAuth0()` → gets `Auth0VueClient` with `Ref` properties
3. Maps reactive state to `BasicAuth0ContextInterface` for core client
4. Token flow: `getAccessTokenSilently` → core → API headers

**RWA/Proxy mode (`proxy.ts`):**

1. Uses `Auth0ProxyComponentProvider.vue` — does **NOT** import `@auth0/auth0-vue`
2. Auth handled via proxy URL (e.g., `/api/auth`), not client SDK
3. Core client initialized with `contextInterface: undefined`

> **Tree shaking:** Separate entry points ensure `@auth0/auth0-vue` is not bundled for RWA/Proxy consumers.

### Auth0VueClient API Reference

| Property          | Type                        | Notes            |
| ----------------- | --------------------------- | ---------------- |
| `isLoading`       | `Ref<boolean>`              | SDK initializing |
| `isAuthenticated` | `Ref<boolean>`              | Valid session    |
| `user`            | `Ref<User \| undefined>`    | User profile     |
| `idTokenClaims`   | `Ref<IdToken \| undefined>` | ID token claims  |
| `error`           | `Ref<Error \| null>`        | Last auth error  |

| Method                           | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `loginWithRedirect(opts?)`       | Redirect to Auth0 login                 |
| `loginWithPopup(opts?, config?)` | Login via popup window                  |
| `logout(opts?)`                  | Clear session, redirect                 |
| `getAccessTokenSilently(opts?)`  | Get/refresh access token (used by core) |
| `getAccessTokenWithPopup(opts?)` | Get token via popup                     |
| `checkSession()`                 | Re-check authentication state           |
| `handleRedirectCallback()`       | Process redirect from Auth0             |

| Plugin API                             | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `createAuth0(clientOpts, pluginOpts?)` | Creates Auth0Plugin; `app.use()` it                        |
| `useAuth0()`                           | Returns `Auth0VueClient` via `inject(AUTH0_INJECTION_KEY)` |
| `AUTH0_INJECTION_KEY`                  | `InjectionKey<Auth0VueClient>` for manual inject           |
| `createAuthGuard(app?)`                | Vue Router navigation guard factory                        |
| `authGuard`                            | Simple route guard (uses module-level client ref)          |

> **For implementation code patterns** (SPA provider, proxy provider, app setup, route guards), see SKILL.md "Provider Patterns" and "Auth0 Integration" sections.

---

## Dependencies

### Vue-Specific (replaces React equivalents)

| Package                   | Purpose                                                  | Replaces                          |
| ------------------------- | -------------------------------------------------------- | --------------------------------- |
| `vue` (^3.5)              | Framework                                                | `react`, `react-dom`              |
| `@auth0/auth0-vue` (^2.5) | Auth0 SPA authentication                                 | `@auth0/auth0-react`              |
| `reka-ui`                 | Headless UI primitives + `Primitive` + `useForwardProps` | `@radix-ui/react-*` (11 packages) |
| `@vueuse/core`            | Utility composables (`reactiveOmit`, etc.)               | N/A                               |
| `@tanstack/vue-query`     | Data fetching                                            | `@tanstack/react-query`           |
| `vee-validate`            | Form validation                                          | `react-hook-form`                 |
| `@vee-validate/zod`       | Zod integration for vee-validate                         | `@hookform/resolvers`             |
| `lucide-vue-next`         | Icons                                                    | `lucide-react`                    |
| `vue-sonner`              | Toast notifications                                      | `sonner`                          |

### Shared (framework-agnostic, same as React)

| Package                            | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `@auth0/universal-components-core` | Business logic, API, i18n, schemas, theme |
| `zod`                              | Schema validation                         |
| `class-variance-authority`         | Component variant styling                 |
| `clsx`                             | Conditional class strings                 |
| `tailwind-merge`                   | Tailwind class deduplication              |

### package.json Peer Dependencies

```json
{
  "peerDependencies": {
    "vue": "^3.5.0",
    "@auth0/auth0-vue": "^2.5.0"
  },
  "peerDependenciesMeta": {
    "@auth0/auth0-vue": {
      "optional": true
    }
  }
}
```

> `@auth0/auth0-vue` is optional because Proxy/RWA mode doesn't need it.

---

## What MUST Come From Core (Never Duplicate)

| Concern              | Core Export                                         | Vue Consumption                           |
| -------------------- | --------------------------------------------------- | ----------------------------------------- |
| API services         | `myAccountApiClient`, `myOrganizationApiClient`     | Via `useCoreClient()` composable          |
| i18n                 | `I18nService`, `createTranslator`                   | Via `useTranslator()` composable          |
| Schemas              | `organizationDetailsSchema`, etc.                   | Import directly in composables/components |
| Theme                | `getComponentStyles`, `applyTheme`                  | Via `useTheme()` composable               |
| Auth types           | `AuthDetails`, `CoreClientInterface`, etc.          | Import types directly                     |
| Scopes               | `MY_ORGANIZATION_DETAILS_EDIT_SCOPES`, etc.         | Import constants directly                 |
| Error utilities      | `extractErrorMessage`, `isBusinessError`, etc.      | Import directly in composables            |
| Custom message types | `OrganizationDetailsEditMessages`, etc.             | Import types for props                    |
| Mappers/factories    | `organizationFactory`, `mapOrganizationToApiFormat` | Import in composables                     |
| Icons                | `googleIcon`, `microsoftIcon`, etc.                 | Import SVG strings directly               |

---

## Implementation Order (⚠️ FOLLOW STRICTLY)

### 1. Scaffolding

- [ ] `package.json` — `@auth0/auth0-vue` as optional peer dep, all Vue-specific deps
- [ ] `tsconfig.json` — TypeScript configuration (see below)
- [ ] `src/env.d.ts` — Vue type shims for `.vue` files
- [ ] `tsup.config.ts` — Build configuration
- [ ] `components.json` — shadcn-vue CLI config
- [ ] `src/lib/utils.ts` — `cn()` utility

#### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "importHelpers": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationDir": "dist",
    "sourceMap": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "strict": true,
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/composables/*": ["./src/composables/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__/*"]
}
```

**Key differences from React tsconfig:**

| Option                 | React       | Vue                     | Reason                               |
| ---------------------- | ----------- | ----------------------- | ------------------------------------ |
| `jsx`                  | `react-jsx` | `preserve`              | Vue SFCs handle JSX differently      |
| `jsxImportSource`      | N/A         | `vue`                   | For TSX in Vue components            |
| `moduleResolution`     | `node`      | `bundler`               | Better for Vite/modern bundlers      |
| `verbatimModuleSyntax` | N/A         | `true`                  | Enforces `import type` syntax        |
| `include`              | `["src"]`   | `["src/**/*.vue", ...]` | Must explicitly include `.vue` files |

#### src/env.d.ts (Vue Type Shims)

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

### 2. Providers (⛔ CRITICAL — CREATE FIRST)

> **⛔ STOP: Do NOT skip this step. Do NOT create composables or components first.**
>
> Vue's dependency injection requires providers to call `provide()` before any
> consumer calls `inject()`. If you create composables first, they will:
>
> - Return `undefined` silently (no error thrown)
> - Cause confusing runtime bugs that are hard to trace
> - Waste hours of debugging time

**Required files (create in this exact order):**

1. **`src/types/injection-keys.ts`** — Define all InjectionKey symbols first
2. **`src/providers/Auth0ComponentProvider.vue`** — SPA mode (imports `@auth0/auth0-vue`)
3. **`src/providers/Auth0ProxyComponentProvider.vue`** — Proxy/RWA mode (NO auth SDK import)
4. **`src/providers/index.ts`** — Barrel export for providers
5. **`src/index.ts`** — SPA entry point (exports `Auth0ComponentProvider`)
6. **`src/proxy.ts`** — Proxy entry point (exports `Auth0ProxyComponentProvider`)

**Each provider MUST call `provide()` for ALL of these keys:**

- `CORE_CLIENT_KEY` — CoreClient instance
- `THEME_KEY` — `{ isDarkMode: Ref<boolean> }`
- `SCOPE_MANAGER_KEY` — `{ registerScopes, ensured }`
- `TOAST_KEY` — Toast configuration

**Verification:** After creating providers, you should be able to:

```ts
// In any composable
const coreClient = inject(CORE_CLIENT_KEY); // Returns CoreClient, not undefined
```

> See [Providers Section](#providers-critical--create-first) below for full implementation code.

### 3. Types

- [ ] `types/injection-keys.ts` — All InjectionKey symbols
- [ ] `types/my-organization/organization-management/*.ts` — Component types
- [ ] Props → `defineProps<T>()` compatible
- [ ] Callback props → `defineEmits` events

### 4. Composables

- [ ] `use-core-client.ts`, `use-theme.ts`, `use-translator.ts`, `use-toast.ts`
- [ ] `use-organization-details-edit.ts` — data fetching, mutation
- [ ] Tests in `__tests__/`

> See SKILL.md "Composable Conventions" and "Data Fetching Pattern" for implementation code.

### 5. UI Components (FLAT structure)

- [ ] `components/ui/Button.vue` — Primitive + CVA (NOT `ui/button/Button.vue`)
- [ ] `components/ui/Spinner.vue`
- [ ] `components/ui/Card.vue`, `CardHeader.vue`, `CardContent.vue`, `CardFooter.vue`
- [ ] `components/ui/TextField.vue` — CVA variants
- [ ] `components/ui/Separator.vue`, `Section.vue`, `Header.vue`, `FormActions.vue`
- [ ] `components/ui/ColorPickerInput.vue`, `ImagePreviewField.vue`
- [ ] `components/ui/index.ts` — Single barrel file for all exports
- [ ] Copy exact CVA class strings from React
- [ ] Verify `theme-default:` / `theme-minimal:` / `theme-rounded:` variants match
- [ ] `data-slot` on every root element

> See SKILL.md "UI Component Anatomy" for all patterns (Primitive, plain HTML, reka-ui wrapper).

### 6. Feature Components

- [ ] `components/my-organization/.../OrganizationDetails.vue` — form with vee-validate
- [ ] `components/my-organization/.../SettingsDetails.vue` — name/display_name fields
- [ ] `components/my-organization/.../BrandingDetails.vue` — logo, colors

> See SKILL.md "Component Anatomy — Presentation Component" for pattern.

### 7. Block

- [ ] `blocks/my-organization/.../OrganizationDetailsEdit.vue` — entry point
- [ ] `<WithOrganizationService>` wrapper
- [ ] Loading gate with `<Spinner/>`

> See SKILL.md "Component Anatomy — Block Component" for pattern.

### 8. Build Validation (⚠️ MANDATORY)

- [ ] Run `pnpm type-check` — fix all TypeScript errors
- [ ] Run `pnpm build` — ensure successful compilation
- [ ] Fix any import path errors
- [ ] Fix any type mismatches
- [ ] Ensure no `any` types without justification

### 9. Tests (80% coverage minimum)

- [ ] Mount with providers via `mountWithProviders` helper
- [ ] Mock core client via `provide` override
- [ ] Test loading, error, success states
- [ ] Test user interactions (form submit, cancel)

> See SKILL.md "Testing Patterns" for test helper and conventions.

---

## Build System

### tsup Configuration

- **Entries:** `src/index.ts` (SPA), `src/proxy.ts` (RWA/Proxy)
- **Formats:** ESM + CJS
- **Externals:** `vue`, `vee-validate`, `@auth0/auth0-vue`, `reka-ui`

### CSS Build (Shared with React)

```bash
# Same command as React package — uses shared CSS files
npx @tailwindcss/cli -i ./src/styles/globals.css -o ./dist/styles.css --minify
```

No `tailwind.config.js` — Tailwind v4 is config-free; all tokens via `@theme inline {}` in `globals.css`.

**PostCSS config** (identical to React):

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Exports Map

```json
{
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
```

---

## shadcn-vue Configuration

### components.json

```json
{
  "$schema": "https://shadcn-vue.com/schema.json",
  "style": "new-york",
  "typescript": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "src/components",
    "ui": "src/components/ui",
    "composables": "src/composables",
    "lib": "src/lib",
    "blocks": "src/blocks",
    "utils": "src/lib/utils"
  }
}
```

### registry.json

```json
{
  "$schema": "https://shadcn-vue.com/schema/registry.json",
  "name": "auth0-ui-components-vue",
  "homepage": "https://auth0-ui-components.vercel.app",
  "items": [
    {
      "name": "my-organization/organization-details-edit",
      "type": "registry:block",
      "title": "Organization Details Edit",
      "description": "Block for editing organization details.",
      "registryDependencies": ["button", "card", "text-field"],
      "dependencies": ["@auth0/universal-components-core", "vee-validate", "@vee-validate/zod"],
      "files": [
        {
          "path": "src/blocks/my-organization/organization-management/OrganizationDetailsEdit.vue",
          "type": "registry:block",
          "target": "auth0-ui-components/blocks/my-organization/OrganizationDetailsEdit.vue"
        },
        {
          "path": "src/composables/my-organization/organization-details-edit/use-organization-details-edit.ts",
          "type": "registry:hook",
          "target": "auth0-ui-components/composables/use-organization-details-edit.ts"
        }
      ]
    }
  ]
}
```

**Registry file types:**

| Type                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `registry:block`     | Complex multi-file features                         |
| `registry:component` | Simple components                                   |
| `registry:ui`        | UI primitives (button, card, dialog)                |
| `registry:hook`      | Composables (named `hook` for shadcn compatibility) |
| `registry:lib`       | Utility functions (cn, etc.)                        |
| `registry:file`      | Miscellaneous files                                 |
| `registry:page`      | Page/route components                               |

### Registry Build

```bash
pnpm registry:build     # runs: shadcn-vue build
# Output: public/r/{name}.json
# Install: pnpx shadcn-vue@latest add https://your-domain.com/r/{name}.json
```

---

## Git Conventions

- **Scope:** `vue` for all Vue package changes
- **Examples:**
  - `feat(vue): add OrganizationDetailsEdit block`
  - `test(vue): add composable tests for useOrganizationDetailsEdit`
  - `chore(vue): scaffold package structure`

---

## Anti-Patterns (Quick Reference)

### ⛔ Provider-Related (MOST COMMON MISTAKES)

| Mistake                                        | Symptom                                              | Fix                             |
| ---------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| Creating composables before providers          | `inject()` returns `undefined`, no error             | Create providers FIRST          |
| Creating components before providers           | Runtime error: "Cannot read property X of undefined" | Create providers FIRST          |
| Forgetting a `provide()` call                  | One composable works, another returns `undefined`    | Check all 4 keys are provided   |
| Importing `@auth0/auth0-vue` in proxy provider | Bundle size bloat, breaks tree-shaking               | Use separate entry points       |
| Not exporting provider from entry point        | Consumer can't access provider                       | Check `index.ts` and `proxy.ts` |

**Remember:** Vue's `inject()` returns `undefined` silently when provider is missing.
There is NO error message. You must create providers before anything else.

### Critical (Will Break the Build)

- ❌ Skipping providers and jumping to composables/components → **silent runtime failures**
- ❌ Not running build validation → TypeScript errors go unnoticed
- ❌ Creating subdirectories for simple UI components → use `ui/Button.vue` NOT `ui/button/Button.vue`

### Code Quality

- ❌ Importing from React package source paths
- ❌ Duplicating business logic that exists in core
- ❌ Options API or mixins → always `<script setup>` Composition API
- ❌ `reactive()` for composable return values → use `ref()`
- ❌ `this` anywhere → not available in `<script setup>`
- ❌ Mutating props directly → use `emit` or `defineModel`
- ❌ `v-if` + `v-for` on the same element → use `computed` to filter
- ❌ Raw `<button>` in UI components → use `Primitive` from `reka-ui`
- ❌ Missing `data-slot` on UI component root elements
- ❌ `@radix-ui/react-*` or `radix-vue` → use `reka-ui`
- ❌ `any` without justification / `as` without necessity
- ❌ Default exports for components → named exports from barrel `index.ts`

### File Structure

- ❌ `components/ui/button/index.ts` + `components/ui/button/Button.vue` → over-engineered
- ✅ `components/ui/Button.vue` + `components/ui/index.ts` → correct flat structure
- ❌ Separate barrel files per UI component
- ✅ Single `components/ui/index.ts` barrel for all UI exports

> See SKILL.md "Anti-Pattern Table" for full React→Vue mapping with correct alternatives.

---

## Key Files Reference

| File                                       | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `packages/vue/SKILL.md`                    | Vue coding patterns, React→Vue conversion rules, code examples |
| `packages/vue/AGENTS.md`                   | This file — architecture, commands, task order, config         |
| `packages/vue/components.json`             | shadcn-vue CLI configuration                                   |
| `packages/vue/registry.json`               | shadcn-vue registry definition                                 |
| `packages/vue/src/lib/utils.ts`            | `cn()` utility                                                 |
| `packages/vue/src/types/injection-keys.ts` | All InjectionKey symbols                                       |

**When building new components:** Read SKILL.md first for conversion rules, then follow the checklist in this file.
