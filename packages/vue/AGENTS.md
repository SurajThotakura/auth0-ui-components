# AGENTS.md — @auth0/universal-components-vue

> Architecture overview and task guide for Vue package development.
>
> **For code patterns and examples, see `SKILL.md` and `references/` folder.**

---

## Critical Warning

**Providers MUST be created FIRST before ANY other Vue code.**

Vue's `provide`/`inject` system requires providers to exist before consumers. All composables use `inject()` — they will **fail silently** without providers.

**Implementation order is NON-NEGOTIABLE:**

1. `src/types/injection-keys.ts` — Define InjectionKey symbols
2. `src/providers/Auth0ComponentProvider.vue` — SPA provider
3. `src/providers/Auth0ProxyComponentProvider.vue` — Proxy provider
4. `src/index.ts` + `src/proxy.ts` — Entry points
5. Then and ONLY then: composables, components, blocks

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

### Phase 2: Providers (CRITICAL)

- [ ] `src/types/injection-keys.ts` — All InjectionKey symbols
- [ ] `src/providers/Auth0ComponentProvider.vue` — SPA mode
- [ ] `src/providers/Auth0ProxyComponentProvider.vue` — Proxy mode
- [ ] `src/providers/index.ts` — Barrel export
- [ ] `src/index.ts` — SPA entry point
- [ ] `src/proxy.ts` — Proxy entry point

**Verification:** After this phase, `inject(CORE_CLIENT_KEY)` must NOT return `undefined`.

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
