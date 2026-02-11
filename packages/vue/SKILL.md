---
name: auth0-universal-components-vue
description: >
  Vue 3 coding patterns, React-to-Vue conversion rules, shadcn-vue component
  patterns, composable conventions, and code examples for the
  @auth0/universal-components-vue package.
metadata:
  author: Auth0 ProdEx
  version: '2026.2.11'
  source: Vue 3.5+ / Composition API / TypeScript
  base_reference: packages/react (React implementation)
---

# SKILL.md — Vue 3 Conversion Patterns & Code Reference

> For project architecture, commands, task order, and configuration, see `AGENTS.md`.
> This file covers **how to write code** — patterns, rules, and examples.

---

## Preferences (Non-Negotiable)

- **Always** `<script setup lang="ts">` — never Options API
- **Always** Composition API composables — never mixins
- **Prefer** `shallowRef` over `ref` when deep reactivity is not needed
- **Prefer** `computed` over methods for derived state
- **Prefer** `provide`/`inject` over prop drilling for cross-cutting concerns
- **Prefer** named exports over default exports
- **Always** `data-slot="component-name"` on root element of every UI component
- **Always** `Primitive` from `reka-ui` for polymorphic UI components (`as`/`as-child`)
- **Always** CVA variants defined inline in the SFC (for simple components) or in barrel `index.ts` (if shared)
- **Always** `useForwardProps` / `useForwardPropsEmits` from `reka-ui` for primitive wrappers
- **Always** `reactiveOmit` from `@vueuse/core` to separate `class` from delegated props
- **Discourage** Reactive Props Destructure (use `toRef`/`toRefs` if needed)
- **Never** use `any` without explicit justification
- **Never** use `as` type assertion unless no other option

---

## Vue Style Guide Rules (Mandatory)

### Priority A — Essential

| Rule                       | Enforcement                                             |
| -------------------------- | ------------------------------------------------------- |
| Multi-word component names | `OrganizationDetailsEdit` not `Details`                 |
| Detailed prop definitions  | Always use `defineProps<T>()` with TypeScript generics  |
| Keyed `v-for`              | Always `:key` on every `v-for`                          |
| No `v-if` with `v-for`     | Use `computed` to filter, never combine on same element |
| Component-scoped styling   | Always `<style scoped>` or CSS modules                  |

### Priority B — Strongly Recommended

| Rule                            | Enforcement                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| One component per `.vue` file   | No multi-component files                                             |
| PascalCase filenames            | `OrganizationDetailsEdit.vue`                                        |
| Tightly coupled names           | `OrganizationDetailsSettings.vue`, `OrganizationDetailsBranding.vue` |
| Self-closing components         | `<Spinner/>` not `<Spinner></Spinner>`                               |
| PascalCase in SFC templates     | `<OrganizationDetailsEdit/>`                                         |
| camelCase props                 | `greetingText` in `defineProps`, either casing in template           |
| Multi-attribute = multi-line    | One attribute per line when > 2 attributes                           |
| Simple template expressions     | Move complex logic to `computed`                                     |
| Consistent directive shorthands | Always `:` for `v-bind`, `@` for `v-on`, `#` for `v-slot`            |
| Full-word component names       | `StudentDashboardSettings` not `SdSettings`                          |

### Priority C — Recommended

| Rule                         | Enforcement                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| SFC block order              | `<script>` → `<template>` → `<style>`                       |
| Element attribute order      | `v-for` → `v-if` → `ref`/`key` → `v-model` → props → events |
| Empty lines between sections | Separate multi-line props, computeds, watchers              |

---

## React → Vue Conversion Rules

### ❌ Anti-Pattern Table (Never Port These Directly)

| React Pattern                        | Why It's Wrong in Vue                    | Vue Equivalent                                             |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| `useState` + `useEffect`             | Vue doesn't re-run setup on every render | `ref()` + `watch()`/`watchEffect()`                        |
| `useMemo(() => expr, [deps])`        | Manual dep tracking is React-specific    | `computed(() => expr)` — auto-tracks deps                  |
| `useCallback(fn, [deps])`            | Functions aren't recreated in Vue setup  | Just define the function — no wrapper                      |
| `React.memo(Component)`              | Vue's reactivity is fine-grained         | Not needed — Vue tracks at property level                  |
| `useRef(null)` for DOM               | Different mental model                   | `const el = ref<HTMLElement>()` + `ref="el"` in template   |
| `{condition && <Component/>}`        | JSX conditional rendering                | `v-if="condition"` on the element                          |
| `items.map(i => <X key={i.id}/>)`    | JSX list rendering                       | `v-for="item in items" :key="item.id"`                     |
| `React.createContext` + `useContext` | React's context system                   | `provide(key, value)` + `inject(key)` with `InjectionKey`  |
| HOC (`withServices(Comp, scopes)`)   | Higher-order components                  | Composable + `provide`/`inject` or wrapper component       |
| `Slot` from `@radix-ui/react-slot`   | React polymorphism                       | `Primitive` from `reka-ui` with `as`/`as-child`            |
| `forwardRef` + ref forwarding        | React ref forwarding                     | `defineExpose()` or `useForwardProps()` from `reka-ui`     |
| `children` prop                      | React's children model                   | `<slot/>` (default) or `<slot name="x"/>` (named)          |
| `className`                          | JSX-specific                             | `class` (standard HTML)                                    |
| `onChange` on inputs                 | React synthetic events                   | `@input` for text inputs, `@change` for selects/checkboxes |
| `dangerouslySetInnerHTML`            | React-specific                           | `v-html` (same security risks apply)                       |
| `useReducer`                         | Complex state reducer                    | `reactive()` with methods or Pinia store                   |
| Lifting state via callbacks          | `onSave`, `onCancel` callback props      | `defineEmits` + `emit('save', data)` or `v-model`          |

### ✅ Correct Conversion Patterns

#### State Management

```tsx
// ❌ React
const [count, setCount] = useState(0);
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// ✅ Vue
const count = ref(0);
watch(count, (val) => {
  document.title = `Count: ${val}`;
});
```

#### Derived State

```tsx
// ❌ React
const doubled = useMemo(() => count * 2, [count]);

// ✅ Vue
const doubled = computed(() => count.value * 2);
```

#### Side Effects

```tsx
// ❌ React
useEffect(() => {
  fetchData();
  return () => cleanup();
}, []);

// ✅ Vue
onMounted(() => fetchData());
onUnmounted(() => cleanup());
// OR for reactive deps:
watchEffect((onCleanup) => {
  fetchData();
  onCleanup(() => cleanup());
});
```

#### Context / Provider

```tsx
// ❌ React
const CoreClientContext = createContext<CoreClientInterface | null>(null);
const useCoreClient = () => useContext(CoreClientContext)!;
<CoreClientContext.Provider value={client}>{children}</CoreClientContext.Provider>;

// ✅ Vue
const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');
// In provider component:
provide(CORE_CLIENT_KEY, client);
// In consumer composable:
const useCoreClient = () => inject(CORE_CLIENT_KEY)!;
```

#### HOC → Composable + Wrapper

```tsx
// ❌ React HOC
export const OrganizationDetailsEdit = withMyOrganizationService(
  OrganizationDetailsEditInternal,
  MY_ORGANIZATION_DETAILS_EDIT_SCOPES
);

// ✅ Vue wrapper component
// WithOrganizationService.vue
<script setup lang="ts">
const props = defineProps<{ scopes: string }>()
const { isReady } = useScopeManager()
useScopeRegistration(props.scopes)
</script>
<template>
  <slot v-if="isReady"/>
  <Spinner v-else/>
</template>

// Usage in block:
<WithOrganizationService :scopes="SCOPES">
  <OrganizationDetailsEditInternal v-bind="$attrs"/>
</WithOrganizationService>
```

#### Form Handling

```tsx
// ❌ React (react-hook-form)
const form = useForm({ resolver: zodResolver(schema), defaultValues });
<FormProvider {...form}><form onSubmit={form.handleSubmit(onSave)}>

// ✅ Vue (vee-validate + @vee-validate/zod)
const { handleSubmit, resetForm, values } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: defaultValues
})
const onSubmit = handleSubmit((values) => onSave(values))
```

#### Toast Notifications

```tsx
// ❌ React (sonner)
import { toast } from '../components/ui/toast';
toast({ type: 'success', message: t('saved') });

// ✅ Vue (vue-sonner or custom)
import { useToast } from '../composables/use-toast';
const { notify } = useToast();
notify({ type: 'success', message: t('saved') });
```

#### Events

```tsx
// ❌ React — callback props
interface Props {
  onSave: (data: T) => void;
  onCancel: () => void;
}

// ✅ Vue — defineEmits
const emit = defineEmits<{
  save: [data: T];
  cancel: [];
}>();
emit('save', data);
emit('cancel');
```

---

## shadcn-vue UI Component Patterns

### Pattern 1: Primitive Component (polymorphic, with CVA)

```vue
<!-- src/components/ui/Button.vue -->
<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { Primitive } from 'reka-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ...',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground ...',
        outline: 'border border-input bg-background ...',
        ghost: 'hover:bg-muted text-primary bg-transparent',
        destructive: 'bg-destructive text-destructive-foreground ...',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 rounded-2xl px-4 py-2.5',
        xs: 'h-7 rounded-md px-2 py-1.5 text-xs',
        sm: 'h-8 gap-1.5 rounded-xl px-3 py-2 text-xs',
        lg: 'h-12 rounded-3xl px-6 py-3 text-base',
        icon: 'size-7 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
```

### Pattern 2: Plain HTML Wrapper (no reka-ui)

```vue
<!-- src/components/ui/Card.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div
    data-slot="card"
    :class="cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class)"
  >
    <slot />
  </div>
</template>
```

### Pattern 3: Reka-UI Primitive Wrapper (useForwardProps)

```vue
<!-- src/components/ui/dialog/DialogContent.vue -->
<script setup lang="ts">
import type { DialogContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { XIcon } from 'lucide-vue-next';
import { DialogContent, DialogPortal, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<
  DialogContentProps & {
    class?: HTMLAttributes['class'];
  }
>();

const delegatedProps = reactiveOmit(props, 'class');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogPortal>
    <DialogContent
      data-slot="dialog-content"
      v-bind="forwardedProps"
      :class="cn('fixed left-1/2 top-1/2 ...', props.class)"
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
```

### Pattern 4: Forwarding Props AND Emits

```vue
<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui';
import { DialogRoot, useForwardPropsEmits } from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
```

### Barrel Export Pattern

```ts
// src/components/ui/index.ts — Single file for ALL UI exports
export { default as Button } from './Button.vue';
export { default as Spinner } from './Spinner.vue';
export { default as Card } from './Card.vue';
export { default as CardHeader } from './CardHeader.vue';
export { default as CardContent } from './CardContent.vue';
export { default as CardFooter } from './CardFooter.vue';
export { default as TextField } from './TextField.vue';
export { default as Separator } from './Separator.vue';
export { default as Section } from './Section.vue';
export { default as Header } from './Header.vue';
export { default as FormActions } from './FormActions.vue';
```

### data-slot Convention

Every UI component/sub-component must set `data-slot` on its root element. Values match React exactly:

```
data-slot="button"
data-slot="dialog-content"
data-slot="dialog-overlay"
data-slot="select-trigger"
data-slot="card"
data-slot="card-header"
data-slot="switch"
data-slot="switch-thumb"
```

### cn() Utility

```ts
// src/lib/utils.ts — identical to React
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Provider Patterns

### SPA Provider (Auth0ComponentProvider.vue)

```vue
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import type { BasicAuth0ContextInterface } from '@auth0/universal-components-core';
import { useCoreClientInitialization } from '../composables/use-core-client-initialization';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

const props = defineProps<Auth0ComponentProviderProps>();

// Get Auth0 context — parallel to React's useAuth0() from @auth0/auth0-react
const auth0 = useAuth0();

// Map Auth0Vue reactive state to the BasicAuth0ContextInterface expected by core
const auth0ContextInterface: BasicAuth0ContextInterface = {
  isAuthenticated: auth0.isAuthenticated.value,
  isLoading: auth0.isLoading.value,
  user: auth0.user.value,
  getAccessTokenSilently: (opts) => auth0.getAccessTokenSilently(opts),
};

// Initialize core client (same as React)
const coreClient = useCoreClientInitialization({
  authDetails: { ...props.authDetails, contextInterface: auth0ContextInterface },
  i18nOptions: props.i18n,
});

provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode: ref(props.themeSettings?.mode === 'dark') });
provide(SCOPE_MANAGER_KEY, createScopeManager(coreClient));
provide(TOAST_KEY, props.toastSettings);
</script>

<template>
  <slot />
</template>
```

### Proxy Provider (No @auth0/auth0-vue)

```vue
<!-- Auth0ProxyComponentProvider.vue -->
<script setup lang="ts">
// NO import from @auth0/auth0-vue — proxy handles auth server-side
const coreClient = useCoreClientInitialization({
  authDetails: { ...props.authDetails, contextInterface: undefined },
  i18nOptions: props.i18n,
});
provide(CORE_CLIENT_KEY, coreClient);
</script>

<template>
  <slot />
</template>
```

### Provider Architecture Diagram

```
React Provider Tree:             Vue Equivalent:
─────────────────               ──────────────
Auth0Provider (@auth0/auth0-react)   app.use(createAuth0({...}))  ← plugin
└─ Auth0ComponentProvider          └─ Auth0ComponentProvider.vue
   ├─ CoreClientProvider              provide(CORE_CLIENT_KEY, coreClient)
   ├─ ThemeProvider                   provide(THEME_KEY, themeState)
   ├─ QueryClientProvider             app.use(VueQueryPlugin)  ← plugin
   ├─ ScopeManagerProvider            provide(SCOPE_MANAGER_KEY, scopeManager)
   └─ ToastProvider                   provide(TOAST_KEY, toastConfig)

RWA/Proxy mode:
└─ Auth0ProxyComponentProvider.vue (no @auth0/auth0-vue import)
   ├─ provide(CORE_CLIENT_KEY, coreClient)   contextInterface: undefined
   ├─ provide(THEME_KEY, themeState)
   ├─ provide(SCOPE_MANAGER_KEY, scopeManager)
   └─ provide(TOAST_KEY, toastConfig)
```

### Example App Setup (SPA)

```ts
// examples/vue-spa/src/main.ts
import { createApp } from 'vue'
import { createAuth0 } from '@auth0/auth0-vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const app = createApp(App)

// Install router BEFORE Auth0 plugin (required order)
app.use(createRouter({ history: createWebHistory(), routes: [...] }))
app.use(createAuth0({
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }
}))

app.mount('#app')
```

### Route Protection

```ts
import { createRouter, createWebHistory } from 'vue-router';
import { createAuthGuard } from '@auth0/auth0-vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    {
      path: '/dashboard',
      component: Dashboard,
      beforeEnter: createAuthGuard(),
    },
  ],
});
```

### React vs Vue SDK Comparison

| React (`@auth0/auth0-react`)              | Vue (`@auth0/auth0-vue`)                           |
| ----------------------------------------- | -------------------------------------------------- |
| `<Auth0Provider domain={d} clientId={c}>` | `app.use(createAuth0({ domain: d, clientId: c }))` |
| `useAuth0()` returns plain objects        | `useAuth0()` returns `Ref` properties              |
| Context via `React.createContext`         | Context via `InjectionKey` + `provide`/`inject`    |
| `auth0Context.isAuthenticated` (boolean)  | `auth0.isAuthenticated.value` (`Ref<boolean>`)     |
| Wrap tree: `<Auth0Provider>` component    | Plugin pattern: `app.use(createAuth0(...))`        |
| External: `react`, `react-dom`            | External: `vue`, `vue-router` (optional)           |

---

## Composable Conventions

### Naming

- All composables start with `use`: `useCoreClient`, `useTranslator`, `useTheme`
- File naming: `use-core-client.ts`, `use-translator.ts`

### Structure Template

```ts
// composables/use-feature.ts
import { ref, computed, watch, onMounted } from 'vue';
import type { Ref } from 'vue';

interface UseFeatureOptions {
  someParam: string;
  onSuccess?: () => void;
}

interface UseFeatureReturn {
  data: Ref<Data | undefined>;
  isLoading: Ref<boolean>;
  save: (payload: SavePayload) => Promise<void>;
}

export function useFeature(options: UseFeatureOptions): UseFeatureReturn {
  const data = ref<Data>();
  const isLoading = ref(true);

  // ... reactive logic, watchers, lifecycle hooks

  return { data, isLoading, save };
}
```

### Best Practices

| Rule                                                           | Reason                                         |
| -------------------------------------------------------------- | ---------------------------------------------- |
| Always return `ref`s, not `reactive`                           | Allows destructuring without losing reactivity |
| Accept `MaybeRefOrGetter<T>` for flexible inputs               | Use `toValue()` to normalize                   |
| Use `shallowRef` for complex objects not needing deep tracking | Performance                                    |
| Register cleanup in `onUnmounted` or `onWatcherCleanup`        | Prevent memory leaks                           |
| Composables can call other composables                         | Composition pattern                            |
| Only call composables in `<script setup>` or `setup()`         | Vue restriction for instance binding           |

---

## Data Fetching Pattern (TanStack Vue Query)

```ts
// composables/use-organization-details-edit.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

const queryKeys = {
  details: (orgId: string) => ['organization', orgId, 'details'] as const,
};

export function useOrganizationDetailsEdit(options: Options) {
  const coreClient = useCoreClient();
  const queryClient = useQueryClient();

  // Read
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.details(options.orgId),
    queryFn: () => coreClient.getMyOrganizationApiClient().organizationDetails.get(),
  });

  // Write
  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      coreClient.getMyOrganizationApiClient().organizationDetails.update(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.details(options.orgId), result);
    },
  });

  return { data, isLoading, error, isSaving, save: mutateAsync };
}
```

> **Key difference from React:** TanStack Vue Query returns `Ref` values, not plain
> values. Access with `.value` in script, auto-unwrapped in templates.

---

## Component Anatomy

### Block Component (entry point, scope-gated)

```vue
<!-- blocks/my-organization/organization-management/OrganizationDetailsEdit.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { getComponentStyles } from '@auth0/universal-components-core';
import { useOrganizationDetailsEdit } from '../../../composables/my-organization/organization-details-edit/use-organization-details-edit';
import { useTranslator } from '../../../composables/use-translator';
import { useTheme } from '../../../composables/use-theme';
import { Spinner } from '../../../components/ui';
import OrganizationDetails from '../../../components/my-organization/organization-details-edit/OrganizationDetails.vue';
import WithOrganizationService from '../../../components/WithOrganizationService.vue';
import type { OrganizationDetailsEditProps } from '../../../types/my-organization/organization-details-edit/organization-details-edit-types';

const props = withDefaults(defineProps<OrganizationDetailsEditProps>(), {
  customMessages: () => ({}),
  styling: () => ({ variables: { common: {}, light: {}, dark: {} }, classes: {} }),
  readOnly: false,
  showBranding: false,
});

const { t } = useTranslator(
  'organization_management.organization_details_edit',
  props.customMessages,
);
const { isDarkMode } = useTheme();
const { data, isLoading, isSaving, save, cancel } = useOrganizationDetailsEdit({
  /* options */
});

const currentStyles = computed(() => getComponentStyles(props.styling, isDarkMode.value));
</script>

<template>
  <WithOrganizationService :scopes="SCOPES">
    <div v-if="isLoading" class="flex items-center justify-center p-8">
      <Spinner />
    </div>
    <OrganizationDetails
      v-else-if="data"
      :data="data"
      :is-saving="isSaving"
      :read-only="readOnly"
      :styles="currentStyles"
      @save="save"
      @cancel="cancel"
    />
  </WithOrganizationService>
</template>
```

### Presentation Component (form, UI)

```vue
<!-- components/my-organization/organization-details-edit/OrganizationDetails.vue -->
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const props = defineProps<{
  data: OrganizationData;
  isSaving: boolean;
  readOnly: boolean;
  styles: MergedStyles;
}>();

const emit = defineEmits<{
  save: [payload: UpdatePayload];
  cancel: [];
}>();

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: props.data,
});

const onSubmit = handleSubmit((values) => emit('save', values));
const onCancel = () => {
  resetForm();
  emit('cancel');
};
</script>

<template>
  <form @submit.prevent="onSubmit">
    <!-- form fields using TextField, ColorPickerInput, etc. -->
    <FormActions :is-loading="isSaving" :read-only="readOnly" @cancel="onCancel" />
  </form>
</template>

<style scoped>
/* component-scoped styles */
</style>
```

---

## CSS & Theme System

### Theme Activation

Themes are controlled via HTML attributes set by `applyTheme()` from core:

```html
<html data-theme="default">
  <!-- default/minimal/rounded -->
  <html data-theme="minimal" class="dark">
    <!-- dark mode via .dark class -->
  </html>
</html>
```

The Vue provider must call `applyTheme()` on mount:

```ts
import { applyTheme } from '@auth0/universal-components-core';

onMounted(() => {
  applyTheme({
    mode: props.themeSettings.mode, // 'light' | 'dark'
    theme: props.themeSettings.theme, // 'default' | 'minimal' | 'rounded'
  });
});
```

### @custom-variant (Theme-Specific Tailwind Classes)

Each theme registers a Tailwind v4 custom variant that scopes classes:

```css
/* In themes/default.css */
@custom-variant theme-default {
  &:where([data-theme='default'] *) {
    @slot;
  }
}
```

Vue components MUST use the exact same variant prefixes:

```vue
<Primitive
  :class="
    cn(
      buttonVariants({ variant, size }),
      'theme-default:before:bg-gradient-to-t',
      'theme-default:active:scale-[0.99]',
      props.class,
    )
  "
></Primitive>
```

### CSS Architecture

```
globals.css
├── @import 'tailwindcss'           ← Tailwind v4 base (config-free)
├── @import './font-sizes.css'      ← Semantic font size tokens
├── @import './themes/default.css'  ← Default theme + light/dark palettes
│       ├── @import '../light-palette.css'  ← OKLCH 12-step color scales (:root)
│       └── @import '../dark-palette.css'   ← Inverted OKLCH scales (.dark)
├── @import './themes/minimal.css'  ← Minimal (flat) theme
└── @import './themes/rounded.css'  ← Rounded (pill) theme

@layer base { ... }                 ← Global resets, transitions
@theme inline { ... }               ← Registers CSS vars as Tailwind tokens
```

### Color System — OKLCH Palettes

Colors use OKLCH (perceptually uniform). Two palette files define raw primitives with 12-step scales:

| Scale                  | Steps 1-3      | Step 9           | Steps 10-12 |
| ---------------------- | -------------- | ---------------- | ----------- |
| `neutral` (achromatic) | Lightest tints | Mid saturated    | Near black  |
| `carbon` (~84°)        | Light tints    | Brand base       | Dark shades |
| `blue` (~269°)         | Light tints    | Saturated blue   | Dark shades |
| `red` (~30°)           | Light tints    | Saturated red    | Dark shades |
| `green` (~152°)        | Light tints    | Saturated green  | Dark shades |
| `indigo` (~288°)       | Light tints    | Saturated indigo | Dark shades |
| `orange` (~46°)        | Light tints    | Saturated orange | Dark shades |
| `yellow` (~96°)        | Light tints    | Saturated yellow | Dark shades |

- **Light mode:** `:root` — `--color-neutral-min` = white, `-max` = black
- **Dark mode:** `.dark` — inverted lightness, `-min` = black, `-max` = white

### @theme inline {} (Design Token Registration)

```css
@theme inline {
  --color-background: var(--background, var(--color-neutral-min));
  --color-primary: var(--primary, var(--color-carbon-9));
  --color-destructive: var(--destructive, var(--color-red-3));
  --shadow-bevel-md: ...;
  --shadow-button-resting: ...;
  --radius-md: ...;
  --font-size-page-header: ...;
}
```

### Three Themes — Visual Differences

| Token    | Default                             | Minimal                   | Rounded                      |
| -------- | ----------------------------------- | ------------------------- | ---------------------------- |
| Shadows  | Rich multi-layer bevel              | Almost all `none` (flat)  | Mostly `none`                |
| Radii    | Conservative (xs: 2px → 9xl: 56px)  | Slightly larger (xs: 4px) | Much larger (xs: 8px → pill) |
| Primary  | `carbon-12` (darker)                | `carbon-9` (lighter)      | `carbon-12` (darker)         |
| Input bg | `neutral-min` (white)               | `neutral-3` (grey)        | `neutral-min` (white)        |
| Buttons  | Gradient `::before`, borders, scale | Flat, no effects          | Flat, no effects             |

### Visual Consistency Rules

1. **Copy exact Tailwind class strings** from React (including all `theme-*:` variants)
2. **Same CVA variant definitions** — `buttonVariants`, `textFieldVariants`, etc. must be identical
3. **Same `data-slot` attributes** — CSS selectors may target these
4. **Same `cn()` utility** — `clsx` + `tailwind-merge`
5. **Same CSS custom property references** — `var(--color-primary)`, `var(--shadow-bevel-md)`, etc.
6. **Never create Vue-specific theme overrides** — changes go in shared CSS files

---

## Testing Patterns

### Framework & Conventions

| Convention          | Details                                                |
| ------------------- | ------------------------------------------------------ |
| Framework           | Vitest + `@vue/test-utils`                             |
| Environment         | jsdom                                                  |
| File pattern        | `__tests__/*.test.ts` co-located with source           |
| Describe/it pattern | `describe('when X')` → `it('should Y')`                |
| Coverage            | 80% threshold (branches, functions, lines, statements) |
| Async               | `flushPromises()` from `@vue/test-utils`               |
| Query priority      | `getByRole`, `getByText` (testing-library philosophy)  |

### Test Helper

```ts
// internals/test-utils.ts
import { mount } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY } from '../src/types/injection-keys';

export function mountWithProviders(component, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return mount(component, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      provide: {
        [CORE_CLIENT_KEY as symbol]: createMockCoreClient(),
        [THEME_KEY as symbol]: { isDarkMode: ref(false) },
        ...options.provide,
      },
    },
    ...options,
  });
}
```

---

## File Naming Conventions

| Type           | Convention              | Example                                 |
| -------------- | ----------------------- | --------------------------------------- |
| SFC components | PascalCase `.vue`       | `OrganizationDetailsEdit.vue`           |
| Composables    | kebab-case `use-*.ts`   | `use-organization-details-edit.ts`      |
| Type files     | kebab-case `*-types.ts` | `organization-details-edit-types.ts`    |
| Test files     | kebab-case `*.test.ts`  | `use-organization-details-edit.test.ts` |
| Utility files  | kebab-case `.ts`        | `injection-keys.ts`                     |
| Index files    | `index.ts`              | barrel exports only                     |

---

## Quick Reference — defineProps / defineEmits / defineModel

```vue
<script setup lang="ts">
// Props with defaults
const props = withDefaults(
  defineProps<{
    title: string;
    count?: number;
    readOnly?: boolean;
  }>(),
  {
    count: 0,
    readOnly: false,
  },
);

// Events with typed payloads
const emit = defineEmits<{
  save: [payload: SavePayload];
  cancel: [];
  'update:modelValue': [value: string];
}>();

// Two-way binding (v-model)
const model = defineModel<string>();

// Expose to parent via template ref
defineExpose({
  reset: () => {
    /* ... */
  },
});
</script>
```

---

## Key Vue Imports Reference

```ts
// Reactivity
import { ref, shallowRef, computed, reactive, readonly, toRef, toRefs, toValue } from 'vue';

// Watchers
import { watch, watchEffect, watchPostEffect, onWatcherCleanup } from 'vue';

// Lifecycle
import { onMounted, onUnmounted, onBeforeMount, onBeforeUnmount } from 'vue';

// Dependency injection
import { provide, inject, type InjectionKey } from 'vue';

// Utilities
import { nextTick, defineComponent, defineAsyncComponent } from 'vue';

// Component macros (auto-imported in <script setup>)
// defineProps, defineEmits, defineModel, defineExpose, defineOptions, defineSlots, withDefaults
```

---

## Build Error Troubleshooting

| Error                                                | Cause                           | Fix                                            |
| ---------------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| `Cannot find module 'X'`                             | Missing import or wrong path    | Check import paths, ensure file exists         |
| `Property 'X' does not exist on type 'Y'`            | Wrong type or missing property  | Check type definition, add missing property    |
| `Type 'X' is not assignable to type 'Y'`             | Type mismatch                   | Use correct type, add type assertion if needed |
| `'X' refers to a value, but is being used as a type` | Importing value instead of type | Use `import type { X }`                        |
| `Module '"vue"' has no exported member 'X'`          | Wrong Vue import                | Check Vue 3 API, may need different import     |
| `Cannot find name 'defineProps'`                     | Missing `lang="ts"` in script   | Ensure `<script setup lang="ts">`              |
| `Argument of type 'X' is not assignable...`          | Function parameter mismatch     | Check function signature                       |

**If build fails:**

1. Read the error message carefully — TypeScript errors are usually descriptive
2. Check the file and line number indicated
3. Verify imports are correct (especially `type` vs value imports)
4. Ensure all dependencies are installed (`pnpm install`)
5. Check that provider components exist if composables depend on them
6. Fix errors one at a time, re-running `pnpm type-check` after each fix
