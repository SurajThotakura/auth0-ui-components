---
name: auth0-universal-components-vue
description: Vue 3 conversion patterns and code reference
metadata:
  author: Auth0 ProdEx
  version: '2026.2.11'
  source: Vue 3.5+ / Composition API / TypeScript
  base_reference: packages/react (React implementation)
---

# Vue 3 Conversion Skill

> Quick reference for converting React components to Vue. For detailed patterns, see the reference files below.

---

## When to Use This Skill

- Converting React components to Vue
- Building new Vue components
- Implementing composables
- Understanding Vue-specific patterns

---

## Core Principles (Non-Negotiable)

1. **Always `<script setup lang="ts">`** — never Options API
2. **PROVIDERS ARE MANDATORY** — Vue `inject()` fails silently without providers (see below)
3. **Copy CVA strings from React exactly** — including all `theme-default:` prefixes
4. **CSS files are shared with React** — 100% identical, framework-agnostic
5. **Use `reka-ui` for polymorphism** — not Radix or radix-vue
6. **Flat UI component structure** — `ui/Button.vue` not `ui/button/Button.vue`

---

## CRITICAL: Providers Are Required

**⚠️ STOP! Before converting ANY component, verify providers exist.**

Vue's `provide`/`inject` system FAILS SILENTLY without providers. Every composable that calls `inject()` will return `undefined` if providers don't exist, causing cryptic runtime errors.

### Mandatory Provider Files

These files MUST exist before ANY composable or component will work:

```
src/
├── types/injection-keys.ts          ← Define InjectionKey symbols
├── providers/
│   ├── Auth0ComponentProvider.vue   ← SPA provider (uses @auth0/auth0-vue)
│   ├── Auth0ProxyComponentProvider.vue ← Proxy provider (no auth0-vue)
│   └── index.ts                     ← Barrel export
├── index.ts                         ← Must export Auth0ComponentProvider
└── proxy.ts                         ← Must export Auth0ProxyComponentProvider
```

### Provider Verification Checklist

Before proceeding with component conversion:

- [ ] `src/types/injection-keys.ts` exists with `CORE_CLIENT_KEY`, `THEME_KEY`, `SCOPE_MANAGER_KEY`, `TOAST_KEY`
- [ ] `src/providers/Auth0ComponentProvider.vue` exists and calls `provide()` for ALL 4 keys
- [ ] `src/providers/Auth0ProxyComponentProvider.vue` exists (NO `@auth0/auth0-vue` import!)
- [ ] `src/providers/index.ts` exports both providers
- [ ] `src/index.ts` exports `Auth0ComponentProvider`
- [ ] `src/proxy.ts` exports `Auth0ProxyComponentProvider`

### If Providers Don't Exist

**CREATE THEM FIRST.** See `references/providers.md` for complete implementation.

**DO NOT proceed with component conversion until providers are verified.**

---

## Quick Reference — React → Vue

| React                          | Vue                      | Notes                          |
| ------------------------------ | ------------------------ | ------------------------------ |
| `useState(x)`                  | `ref(x)`                 | Access with `.value` in script |
| `useMemo(() => x, [deps])`     | `computed(() => x)`      | Auto-tracks dependencies       |
| `useCallback(fn, [deps])`      | Just define function     | No wrapper needed              |
| `useEffect(() => {}, [])`      | `onMounted(() => {})`    | Mount effect                   |
| `useEffect(() => {}, [x])`     | `watch(x, () => {})`     | Reactive effect                |
| `createContext` + `useContext` | `provide()` + `inject()` | With `InjectionKey<T>`         |
| `<Slot>` from Radix            | `Primitive` from reka-ui | `as`/`as-child` props          |
| `forwardRef`                   | `defineExpose()`         | Expose methods to parent       |
| HOC pattern                    | Wrapper component        | `<WithOrganizationService>`    |
| `react-hook-form`              | `vee-validate`           | With `toTypedSchema(zod)`      |
| `children` prop                | `<slot />`               | Default or named slots         |
| `className`                    | `class`                  | HTML attribute                 |
| `onChange` (input)             | `@input`                 | Or `v-model`                   |
| `onClick`                      | `@click`                 | Vue event syntax               |
| `{cond && <X/>}`               | `<X v-if="cond"/>`       | Conditional rendering          |
| `items.map(...)`               | `v-for`                  | List rendering                 |

---

## Component Folder Conversion

When converting a component that lives in a folder with related files (e.g., `organization-details/`), **ALL files in the folder are automatically included in the conversion prompt**.

### Example: organization-details folder

```
React:                                    Vue:
organization-details/                     organization-details/
├── organization-details.tsx  ──────►     ├── OrganizationDetails.vue
├── branding-details.tsx      ──────►     ├── BrandingDetails.vue
├── settings-details.tsx      ──────►     ├── SettingsDetails.vue
└── index.ts                  ──────►     └── index.ts
```

**The conversion prompt will include:**

- Main component source code
- All related `.tsx` files in the same directory
- Clear instructions to convert ALL files together

**You only need to run one command:**

```bash
pnpm convert run -c components/my-organization/organization-management/organization-details/organization-details.tsx -t vue
```

The CLI detects `branding-details.tsx` and `settings-details.tsx` automatically and includes them in the prompt.

---

## Implementation Order (Strict)

```
1. injection-keys.ts      ← Define symbols FIRST
2. Providers              ← provide() all keys
3. Entry points           ← index.ts, proxy.ts
4. Composables            ← use-*.ts files
5. UI Components          ← Button, Card, etc.
6. Feature Components     ← Domain-specific components
7. Blocks                 ← Entry points with scope gating
8. Build validation       ← pnpm type-check && pnpm build
```

**Skip this order → Runtime errors with no useful stack trace.**

---

## References

Detailed patterns and code examples:

| Reference                                                      | Content                                         |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [references/architecture.md](./references/architecture.md)     | Directory structure, entry points, build config |
| [references/providers.md](./references/providers.md)           | InjectionKey pattern, SPA/Proxy providers       |
| [references/composables.md](./references/composables.md)       | React hooks → Vue composables mapping           |
| [references/components.md](./references/components.md)         | UI primitives, feature components, blocks       |
| [references/forms.md](./references/forms.md)                   | vee-validate + Zod patterns                     |
| [references/data-fetching.md](./references/data-fetching.md)   | TanStack Vue Query patterns                     |
| [references/styling.md](./references/styling.md)               | Tailwind v4, CVA, dark mode, themes             |
| [references/injection-keys.md](./references/injection-keys.md) | InjectionKey definitions and usage              |
| [references/anti-patterns.md](./references/anti-patterns.md)   | Common pitfalls and fixes                       |
| [references/example-app.md](./references/example-app.md)       | Example app scaffolding patterns                |

---

## Dependencies

### Vue-Specific (Replaces React)

| Package                   | Purpose                 | Replaces                |
| ------------------------- | ----------------------- | ----------------------- |
| `vue` (^3.5)              | Framework               | `react`                 |
| `@auth0/auth0-vue` (^2.5) | Auth0 SPA               | `@auth0/auth0-react`    |
| `reka-ui`                 | Headless UI + Primitive | `@radix-ui/react-*`     |
| `@vueuse/core`            | Utilities               | N/A                     |
| `@tanstack/vue-query`     | Data fetching           | `@tanstack/react-query` |
| `vee-validate`            | Forms                   | `react-hook-form`       |
| `@vee-validate/zod`       | Zod adapter             | `@hookform/resolvers`   |
| `lucide-vue-next`         | Icons                   | `lucide-react`          |
| `vue-sonner`              | Toast                   | `sonner`                |

### Shared (Framework-Agnostic)

| Package                            | Purpose                            |
| ---------------------------------- | ---------------------------------- |
| `@auth0/universal-components-core` | Business logic, API, i18n, schemas |
| `zod`                              | Schema validation                  |
| `class-variance-authority`         | Component variants                 |
| `clsx`, `tailwind-merge`           | Class utilities                    |

---

## Quick Commands

```bash
# Build
cd packages/vue && pnpm build

# Type check
cd packages/vue && pnpm type-check

# Test
cd packages/vue && pnpm test

# Dev mode
cd packages/vue && pnpm dev
```

---

## Conversion Checklist

### Step 0: Verify Providers Exist (MANDATORY)

**Before writing ANY code, run these checks:**

```bash
# Check providers exist
ls packages/vue/src/providers/Auth0ComponentProvider.vue
ls packages/vue/src/providers/Auth0ProxyComponentProvider.vue
ls packages/vue/src/types/injection-keys.ts
```

**If ANY file is missing → CREATE PROVIDERS FIRST (see `references/providers.md`)**

### Step 1-N: Component Conversion

- [ ] Uses `<script setup lang="ts">`
- [ ] All `inject()` calls have corresponding `provide()` in providers
- [ ] CVA variant strings match React exactly
- [ ] `data-slot` attribute on root element
- [ ] Uses `Primitive` from `reka-ui` for polymorphic components
- [ ] Events use `defineEmits` (not callback props)
- [ ] Forms use `vee-validate` with `toTypedSchema()`
- [ ] Passes `pnpm type-check`
- [ ] Passes `pnpm build`

---

## What NOT to Duplicate from React

These come from `@auth0/universal-components-core`:

- API clients (`myAccountApiClient`, `myOrganizationApiClient`)
- i18n service (`createI18nService`, translators)
- Schemas (Zod validation schemas)
- Theme utilities (`getComponentStyles`, `applyStyleOverrides`)
- Error utilities (`extractErrorMessage`, `isBusinessError`)
- Scope constants (`*_SCOPES`)
- Auth types (`AuthDetails`, `CoreClientInterface`)

---

## Build Error Troubleshooting

| Error                            | Fix                       |
| -------------------------------- | ------------------------- |
| `inject()` returns `undefined`   | Create providers FIRST    |
| `Cannot find module 'X'`         | Check import paths        |
| `Type 'X' is not assignable`     | Check type definitions    |
| `Cannot find name 'defineProps'` | Add `lang="ts"` to script |
| Module has no exported member    | Use `import type { X }`   |

---

## Git Conventions

- **Scope:** `vue` for all Vue package changes
- **Examples:**
  - `feat(vue): add <ComponentName> block`
  - `fix(vue): correct TextField validation`
  - `test(vue): add <composable> tests`
