# AGENTS.md — @auth0/universal-components-vue

> Architecture overview and task guide for Vue package development.
>
> **For code patterns and examples, see `SKILL.md` and `references/` folder.**

---

## CRITICAL: Providers Are Mandatory

**⚠️ STOP! Before converting ANY component, you MUST verify or create providers.**

Vue's `provide`/`inject` system **FAILS SILENTLY** without providers. All composables use `inject()` — they will return `undefined` without providers, causing cryptic runtime errors with no useful stack trace.

### Pre-Conversion Verification

**Before starting ANY conversion task, check these files exist:**

```bash
# Run this check FIRST
ls -la packages/vue/src/providers/Auth0ComponentProvider.vue
ls -la packages/vue/src/providers/Auth0ProxyComponentProvider.vue
ls -la packages/vue/src/types/injection-keys.ts
```

**If ANY file is missing → CREATE PROVIDERS FIRST before proceeding.**

### Implementation Order (NON-NEGOTIABLE)

1. `src/types/injection-keys.ts` — Define InjectionKey symbols (CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY)
2. `src/providers/Auth0ComponentProvider.vue` — SPA provider (imports @auth0/auth0-vue)
3. `src/providers/Auth0ProxyComponentProvider.vue` — Proxy provider (NO @auth0/auth0-vue import!)
4. `src/providers/index.ts` — Barrel export for both providers
5. `src/index.ts` — Must export `Auth0ComponentProvider`
6. `src/proxy.ts` — Must export `Auth0ProxyComponentProvider`
7. Then and ONLY then: composables, components, blocks

### Provider Code Location

See `references/providers.md` for complete provider implementations.

**Skip this order → Runtime errors with no useful stack trace.**

---

## Package Identity

- **Package:** `@auth0/universal-components-vue`
- **Purpose:** Vue 3 port of Auth0 UI component library
- **Runtime:** Node 18+, ESM, TypeScript, Vue 3.5+
- **UI Pattern:** [shadcn-vue](https://www.shadcn-vue.com)
- **Status:** POC — targeting OrganizationDetailsEdit feature

---

## Quick Commands

| Task           | Command                              |
| -------------- | ------------------------------------ |
| Install        | `pnpm install` (from repo root)      |
| Build all      | `pnpm build`                         |
| Build Vue only | `cd packages/vue && pnpm build`      |
| Type check     | `cd packages/vue && pnpm type-check` |
| Test           | `cd packages/vue && pnpm test`       |
| Test watch     | `cd packages/vue && pnpm test:watch` |
| Lint           | `pnpm lint`                          |
| Dev mode       | `cd packages/vue && pnpm dev`        |

---

## Directory Map

```
packages/vue/
├── SKILL.md              # Conversion patterns (quick reference)
├── AGENTS.md             # This file (architecture, tasks)
├── references/           # Detailed code examples
│   ├── architecture.md
│   ├── providers.md
│   ├── composables.md
│   ├── components.md
│   ├── forms.md
│   ├── data-fetching.md
│   ├── styling.md
│   ├── injection-keys.md
│   ├── anti-patterns.md
│   └── example-app.md
│
├── components.json       # shadcn-vue CLI config
├── registry.json         # shadcn-vue registry
│
└── src/
    ├── index.ts          # SPA entry (imports @auth0/auth0-vue)
    ├── proxy.ts          # Proxy entry (no @auth0/auth0-vue)
    ├── env.d.ts          # Vue type shims
    │
    ├── lib/
    │   └── utils.ts      # cn() utility
    │
    ├── providers/        # ⚠️ CREATE FIRST
    │   ├── Auth0ComponentProvider.vue
    │   ├── Auth0ProxyComponentProvider.vue
    │   └── index.ts
    │
    ├── composables/
    │   ├── use-core-client.ts
    │   ├── use-translator.ts
    │   ├── use-theme.ts
    │   ├── use-scope-manager.ts
    │   ├── use-toast.ts
    │   ├── index.ts
    │   └── my-organization/
    │
    ├── components/
    │   ├── ui/           # FLAT structure
    │   │   ├── Button.vue
    │   │   ├── Card.vue
    │   │   ├── TextField.vue
    │   │   ├── Spinner.vue
    │   │   └── index.ts
    │   ├── my-organization/
    │   ├── WithOrganizationService.vue
    │   └── WithAccountService.vue
    │
    ├── blocks/
    │   └── my-organization/
    │       └── organization-management/
    │
    ├── types/
    │   ├── injection-keys.ts
    │   └── my-organization/
    │
    └── styles/           # SHARED with React
        ├── globals.css
        └── themes/
```

---

## Implementation Phases

### Phase 1: Scaffolding

- [ ] `package.json` — Vue dependencies, peer deps
- [ ] `tsconfig.json` — Vue TypeScript config
- [ ] `src/env.d.ts` — Vue type shims
- [ ] `tsup.config.ts` — Build config
- [ ] `src/lib/utils.ts` — `cn()` utility

### Phase 2: Providers (CRITICAL — BLOCKING)

**⚠️ DO NOT SKIP THIS PHASE. Components will fail silently without providers.**

- [ ] `src/types/injection-keys.ts` — All InjectionKey symbols (CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY)
- [ ] `src/providers/Auth0ComponentProvider.vue` — SPA mode (imports @auth0/auth0-vue)
- [ ] `src/providers/Auth0ProxyComponentProvider.vue` — Proxy mode (NO @auth0/auth0-vue!)
- [ ] `src/providers/index.ts` — Barrel export for both providers
- [ ] `src/index.ts` — SPA entry point (exports Auth0ComponentProvider)
- [ ] `src/proxy.ts` — Proxy entry point (exports Auth0ProxyComponentProvider)

**Verification Steps:**

1. Run `ls -la packages/vue/src/providers/` — must show both .vue files
2. Run `grep "provide(CORE_CLIENT_KEY" packages/vue/src/providers/*.vue` — must find matches
3. After this phase, `inject(CORE_CLIENT_KEY)` must NOT return `undefined`

**If verification fails → FIX PROVIDERS before proceeding to Phase 3.**

### Phase 3: Composables

- [ ] `use-core-client.ts`
- [ ] `use-translator.ts`
- [ ] `use-theme.ts`
- [ ] `use-scope-manager.ts`
- [ ] `use-toast.ts`
- [ ] Feature composables (e.g., `use-organization-details-edit.ts`)

### Phase 4: UI Components

- [ ] `Button.vue` — Primitive + CVA
- [ ] `Spinner.vue`
- [ ] `Card.vue`, `CardHeader.vue`, `CardContent.vue`, `CardFooter.vue`
- [ ] `TextField.vue` — with adornments
- [ ] `FormActions.vue`
- [ ] `Separator.vue`, `Section.vue`, `Header.vue`
- [ ] `components/ui/index.ts` — single barrel export

### Phase 5: Feature Components

- [ ] `OrganizationDetails.vue`
- [ ] `SettingsDetails.vue`
- [ ] `BrandingDetails.vue`
- [ ] `WithOrganizationService.vue`

### Phase 6: Blocks

- [ ] `OrganizationDetailsEdit.vue` — entry point with scope gating

### Phase 7: Validation

- [ ] `pnpm type-check` — fix all errors
- [ ] `pnpm build` — successful compilation
- [ ] `pnpm test` — 80% coverage

---

## Conversion Checklist

For each converted component:

- [ ] Uses `<script setup lang="ts">`
- [ ] CVA variant strings match React exactly
- [ ] `data-slot` attribute on root element
- [ ] Uses `Primitive` from `reka-ui` for polymorphic components
- [ ] Uses `defineEmits` for events (not callback props)
- [ ] Uses `vee-validate` for forms
- [ ] Passes type-check and build

---

## UI Consistency Checklist

Before merging any Vue component:

- [ ] **ImagePreviewField**: Has preview area with empty/invalid/loaded states
- [ ] **ColorPickerInput**: Color swatch inside input field
- [ ] **FormActions**: Discard button uses `invisible` (not `hidden`)
- [ ] **All text**: Matches React i18n keys
- [ ] **All spacing**: Matches React Tailwind classes
- [ ] **All colors**: Uses same CSS variables

---

## What MUST Come from Core

| Concern         | Core Export                                     | Never Duplicate |
| --------------- | ----------------------------------------------- | --------------- |
| API services    | `myAccountApiClient`, `myOrganizationApiClient` | ✓               |
| i18n            | `I18nService`, `createTranslator`               | ✓               |
| Schemas         | `organizationDetailsSchema`, etc.               | ✓               |
| Theme           | `getComponentStyles`, `applyStyleOverrides`     | ✓               |
| Auth types      | `AuthDetails`, `CoreClientInterface`            | ✓               |
| Scopes          | `*_SCOPES` constants                            | ✓               |
| Error utilities | `extractErrorMessage`, `isBusinessError`        | ✓               |

---

## Shared vs Vue-Specific

| Asset               | Shared? | Notes                       |
| ------------------- | ------- | --------------------------- |
| `styles/*.css`      | ✅      | Copy from React, identical  |
| `cn()` utility      | ✅      | Same: clsx + tailwind-merge |
| CVA variant strings | ✅      | Copy from React exactly     |
| PostCSS config      | ✅      | Same plugin                 |
| Provider components | ❌      | Vue provide/inject          |
| Composables         | ❌      | Vue Composition API         |

---

## Dependencies Quick Reference

### Vue-Specific

| Package               | Replaces                |
| --------------------- | ----------------------- |
| `vue` (^3.5)          | `react`                 |
| `@auth0/auth0-vue`    | `@auth0/auth0-react`    |
| `reka-ui`             | `@radix-ui/react-*`     |
| `@tanstack/vue-query` | `@tanstack/react-query` |
| `vee-validate`        | `react-hook-form`       |
| `@vee-validate/zod`   | `@hookform/resolvers`   |
| `lucide-vue-next`     | `lucide-react`          |
| `vue-sonner`          | `sonner`                |

### Shared

- `@auth0/universal-components-core`
- `zod`
- `class-variance-authority`
- `clsx`, `tailwind-merge`

---

## Git Conventions

- **Scope:** `vue` for all Vue package changes
- **Format:** `type(vue): description`

**Examples:**

- `feat(vue): add OrganizationDetailsEdit block`
- `fix(vue): correct TextField validation state`
- `test(vue): add useOrganizationDetailsEdit tests`
- `chore(vue): update dependencies`

---

## Anti-Patterns Quick Reference

| Wrong                  | Right            |
| ---------------------- | ---------------- |
| Options API            | `<script setup>` |
| Mixins                 | Composables      |
| `this.x`               | `x.value`        |
| `reactive()` return    | `ref()` return   |
| `@radix-ui/*`          | `reka-ui`        |
| `ui/button/Button.vue` | `ui/Button.vue`  |
| Callback props         | `defineEmits`    |
| `react-hook-form`      | `vee-validate`   |

---

## Key Files Reference

| File                          | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `SKILL.md`                    | Conversion patterns, quick reference |
| `AGENTS.md`                   | This file — architecture, tasks      |
| `references/*.md`             | Detailed code examples               |
| `src/types/injection-keys.ts` | All InjectionKey symbols             |
| `src/lib/utils.ts`            | `cn()` utility                       |

**For code patterns, see `SKILL.md` and `references/` folder.**

---

## Example App Setup (vue-spa-npm) — MANDATORY

When setting up the Vue example app at `examples/vue-spa-npm/`, these patterns are **NON-NEGOTIABLE**:

### Auth0 Vue SDK Workarounds

The `@auth0/auth0-vue` SDK has limitations. Apply these fixes:

#### 1. Auth0ComponentProvider Configuration

**ALWAYS configure the provider exactly like this:**

```vue
<!-- src/App.vue -->
<Auth0ComponentProvider
  :auth-details="{
    domain: 'devex.ca.auth0.com',
  }"
  :i18n="{ currentLanguage: 'en' }"
  :theme-settings="{
    theme: 'default',
    mode: 'light',
  }"
>
  <!-- app content -->
</Auth0ComponentProvider>
```

**Critical points:**

- `:auth-details` with `domain` is REQUIRED
- `:i18n` must be hardcoded to `'en'` — NOT a computed value
- Do NOT use `useI18n()` for the provider's i18n prop

#### 2. Use Mock Data (Not Live API)

Use `OrganizationDetails` component with mock data instead of `OrganizationDetailsEdit`:

```vue
<!-- src/views/OrganizationManagementPage.vue -->
<script setup lang="ts">
import type { OrganizationPrivate } from '@auth0/universal-components-core';
import { OrganizationDetails } from '@auth0/universal-components-vue';
import type { OrganizationDetailsFormActions } from '@auth0/universal-components-vue';
import { ref } from 'vue';

const mockOrganization = ref<OrganizationPrivate>({
  id: 'org_a11y123456789',
  name: 'a11y-corp',
  display_name: 'A11y Corporation',
  branding: {
    logo_url: 'https://cdn.auth0.com/avatars/au.png',
    colors: {
      primary: '#EB5424',
      page_background: '#000000',
    },
  },
});

const formActions: OrganizationDetailsFormActions = {
  isLoading: false,
  showPrevious: true,
  showUnsavedChanges: true,
  align: 'right',
  previousAction: {
    disabled: false,
    onClick: () => console.log('Cancel clicked'),
  },
  nextAction: {
    disabled: false,
    onClick: async (data: OrganizationPrivate) => {
      console.log('Save clicked', data);
      mockOrganization.value = { ...mockOrganization.value, ...data };
      return true;
    },
  },
};
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="mx-auto max-w-4xl">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Organization Details</h2>
      <OrganizationDetails
        :organization="mockOrganization"
        :form-actions="formActions"
        :read-only="false"
      />
    </div>
  </div>
</template>
```

#### 3. Required Dependencies

The example app `package.json` MUST include `@auth0/universal-components-core`:

```json
{
  "dependencies": {
    "@auth0/auth0-vue": "^2.5.0",
    "@auth0/universal-components-core": "workspace:*",
    "@auth0/universal-components-vue": "workspace:*",
    "@tanstack/vue-query": "^5.90.21",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "vue-sonner": "^2.0.0"
  }
}
```

### Example App Verification Checklist

**Run these checks before considering the example app complete:**

- [ ] `App.vue` has `Auth0ComponentProvider` with `:auth-details="{ domain: 'devex.ca.auth0.com' }"`
- [ ] `App.vue` has `:i18n="{ currentLanguage: 'en' }"` (hardcoded string, NOT computed)
- [ ] `App.vue` does NOT import `useI18n` or use `computed` for i18n
- [ ] `OrganizationManagementPage.vue` uses `OrganizationDetails` (NOT `OrganizationDetailsEdit`)
- [ ] `OrganizationManagementPage.vue` has mock data with proper types
- [ ] `package.json` includes `@auth0/universal-components-core` as dependency
- [ ] Type imports: `import type { OrganizationPrivate } from '@auth0/universal-components-core'`
- [ ] Type imports: `import type { OrganizationDetailsFormActions } from '@auth0/universal-components-vue'`
- [ ] `pnpm type-check` passes in example app directory

### Common Example App Errors

| Error                                                   | Cause                   | Fix                                          |
| ------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| `Cannot find module '@auth0/universal-components-core'` | Missing dependency      | Add to `package.json` dependencies           |
| Type mismatch on `formActions`                          | Missing type annotation | Add `: OrganizationDetailsFormActions`       |
| Type mismatch on `mockOrganization`                     | Missing generic         | Use `ref<OrganizationPrivate>(...)`          |
| Provider props type error                               | Using computed for i18n | Hardcode `:i18n="{ currentLanguage: 'en' }"` |
