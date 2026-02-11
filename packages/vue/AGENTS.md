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
    │   └── <feature>/          # Feature-specific composables
    │
    ├── components/
    │   ├── ui/                 # FLAT structure
    │   │   ├── Button.vue
    │   │   ├── Card.vue
    │   │   ├── TextField.vue
    │   │   └── index.ts
    │   ├── <feature>/          # Feature components
    │   ├── WithOrganizationService.vue
    │   └── WithAccountService.vue
    │
    ├── blocks/
    │   └── <feature>/          # Entry points with scope gating
    │
    ├── types/
    │   ├── injection-keys.ts
    │   └── <feature>/          # Feature-specific types
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

- [ ] Core composables (`use-core-client.ts`, `use-translator.ts`, `use-theme.ts`, etc.)
- [ ] Feature-specific composables as needed

### Phase 4: UI Components

- [ ] Convert UI primitives from React (`Button`, `Card`, `TextField`, etc.)
- [ ] Single barrel export in `components/ui/index.ts`

### Phase 5: Feature Components

- [ ] Convert feature components from React source
- [ ] Service wrappers (`WithOrganizationService.vue`, etc.)

### Phase 6: Blocks

- [ ] Convert block entry points with scope gating

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

## CRITICAL: React Parity Verification

**⚠️ MANDATORY: After converting ANY component, you MUST verify parity with React.**

### Verification Steps (Required Before PR)

```bash
# 1. Compare component counts
ls packages/react/src/components/ui/ | wc -l
ls packages/vue/src/components/ui/ | wc -l

# 2. For each Vue component, verify React counterpart exists and matches
# Example for TextField:
diff <(grep -E "^(const|interface|export)" packages/react/src/components/ui/text-field.tsx) \
     <(grep -E "^(const|interface|export)" packages/vue/src/components/ui/TextField.vue)
```

### Parity Checklist (Check ALL Items)

| Item                          | How to Verify                                                |
| ----------------------------- | ------------------------------------------------------------ |
| **All props exist**           | Compare `interface Props` (React) with `defineProps<>` (Vue) |
| **CVA strings identical**     | Diff the CVA variant strings character-by-character          |
| **All subcomponents exist**   | If React has `Card` + `CardHeader`, Vue must have both       |
| **Conditional classes match** | Check all `cn()` calls have same conditionals                |
| **Event handlers converted**  | React `onClick` → Vue `@click` or `defineEmits`              |
| **Adornment/slot handling**   | React `startAdornment` prop → Vue `#startAdornment` slot     |
| **HTML attributes present**   | `data-slot`, `aria-*`, `type`, `disabled` all present        |

### Known Parity Issues (Fixed)

These were common issues found during conversion - verify they don't regress:

1. **TextField.vue**: Missing `pl-[5px]`/`pr-[5px]` padding for adornments
2. **Card.vue**: Missing subcomponents (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, `CardAction`, `CardDescription`)
3. **ColorPickerInput.vue**: Missing clickable color swatch button
4. **ImagePreviewField.vue**: Missing `imgSizes`, `imgWidth`, `imgHeight`, `srcset` props
5. **FormActions.vue**: Missing `onClick` handler for non-submit next button

### Verification Commands

```bash
# Quick visual diff of a component
vimdiff packages/react/src/components/ui/text-field.tsx packages/vue/src/components/ui/TextField.vue

# Check all React UI components exist in Vue
for f in packages/react/src/components/ui/*.tsx; do
  base=$(basename "$f" .tsx)
  vue_file="packages/vue/src/components/ui/${base^}.vue"
  if [ ! -f "$vue_file" ]; then
    echo "MISSING: $vue_file"
  fi
done
```

---

## UI Consistency Checklist

Before merging any Vue component:

- [ ] Visual appearance matches React exactly
- [ ] All text matches React i18n keys
- [ ] All spacing matches React Tailwind classes
- [ ] All colors use same CSS variables
- [ ] Interactive states (hover, focus, disabled) match React
- [ ] **React parity verification completed (see above)**

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

**For example app setup, see `references/example-app.md`.**
