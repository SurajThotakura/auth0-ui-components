# Vue 3 Conversion Guide

This document provides comprehensive guidance for converting React components to Vue 3 using the Composition API.

## Overview

The Vue package (`@auth0/universal-components-vue`) mirrors the React implementation but uses Vue 3 patterns:

- **Composables** instead of hooks
- **`ref()`/`reactive()`** instead of `useState()`
- **`watch()`/`watchEffect()`** instead of `useEffect()`
- **`inject()`/`provide()`** instead of `useContext()`
- **Vue plugins** instead of React providers

## Pattern Mappings

### State Management

| React                       | Vue 3                                 | Notes                                  |
| --------------------------- | ------------------------------------- | -------------------------------------- |
| `useState(initialValue)`    | `ref(initialValue)`                   | Use `.value` to access/mutate          |
| `useState({...})`           | `reactive({...})`                     | Direct property access, no `.value`    |
| `useReducer(reducer, init)` | `reactive({})` + methods              | Use reactive state with action methods |
| `useMemo(() => x, [deps])`  | `computed(() => x)`                   | Auto-tracks dependencies               |
| `useCallback(fn, [deps])`   | `fn` (plain function)                 | No need to memoize in Vue              |
| `useRef(initialValue)`      | `ref(initialValue)` or `shallowRef()` | Same API for DOM refs and values       |

### Side Effects

| React                                 | Vue 3                   | Notes                                  |
| ------------------------------------- | ----------------------- | -------------------------------------- |
| `useEffect(() => {}, [])`             | `onMounted(() => {})`   | Run once on mount                      |
| `useEffect(() => {}, [dep])`          | `watch(dep, () => {})`  | Watch specific dependency              |
| `useEffect(() => { return cleanup })` | `onUnmounted(() => {})` | Cleanup on unmount                     |
| `useEffect(() => {})` (no deps)       | `watchEffect(() => {})` | Auto-track all reactive deps           |
| `useLayoutEffect()`                   | `onMounted()`           | Vue doesn't distinguish layout effects |

### Context

| React                         | Vue 3                                | Notes                        |
| ----------------------------- | ------------------------------------ | ---------------------------- |
| `createContext(default)`      | `Symbol('Key')` as `InjectionKey<T>` | Type-safe injection keys     |
| `useContext(Context)`         | `inject(Key)`                        | Retrieve provided value      |
| `<Context.Provider value={}>` | `provide(Key, value)`                | Provide value to descendants |

### Event Handling

| React JSX                     | Vue Template                              | Notes                          |
| ----------------------------- | ----------------------------------------- | ------------------------------ |
| `onClick={handler}`           | `@click="handler"`                        | Short for `v-on:click`         |
| `onChange={handler}`          | `@input="handler"` or `@change="handler"` | `@input` for immediate updates |
| `onSubmit={handler}`          | `@submit.prevent="handler"`               | `.prevent` modifier            |
| `onClick={(e) => fn(e, arg)}` | `@click="(e) => fn(e, arg)"`              | Inline handlers work the same  |

### Conditional Rendering

| React JSX                        | Vue Template                         |
| -------------------------------- | ------------------------------------ |
| `{condition && <Component />}`   | `<Component v-if="condition" />`     |
| `{condition ? <A /> : <B />}`    | `<A v-if="condition" /><B v-else />` |
| `{items.length > 0 && <List />}` | `<List v-if="items.length > 0" />`   |

### List Rendering

| React JSX                                     | Vue Template                                     |
| --------------------------------------------- | ------------------------------------------------ |
| `{items.map(item => <Item key={item.id} />)}` | `<Item v-for="item in items" :key="item.id" />`  |
| `{items.map((item, i) => <Item key={i} />)}`  | `<Item v-for="(item, i) in items" :key="i" />`   |
| `{Object.entries(obj).map(...)}`              | `<div v-for="(value, key) in obj" :key="key" />` |

### Props & Events

| React                                      | Vue 3                               |
| ------------------------------------------ | ----------------------------------- |
| `interface Props { onClick?: () => void }` | `defineEmits<{ click: [] }>()`      |
| `props.children`                           | `<slot />` or `slots.default?.()`   |
| `React.FC<Props>`                          | `defineComponent({ props: {...} })` |
| `{...props}` spread                        | `v-bind="$attrs"`                   |

### Refs (DOM Access)

| React                                      | Vue 3                                           |
| ------------------------------------------ | ----------------------------------------------- |
| `const ref = useRef<HTMLDivElement>(null)` | `const ref = ref<HTMLDivElement \| null>(null)` |
| `<div ref={ref}>`                          | `<div ref="ref">` or `<div :ref="ref">`         |
| `ref.current`                              | `ref.value`                                     |

## Component Conversion Template

### React Component (Before)

```tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCoreClient } from '../hooks/use-core-client';
import { useTranslator } from '../hooks/use-translator';
import { useTheme } from '../hooks/use-theme';

interface MyComponentProps {
  title: string;
  onAction?: (result: string) => void;
  customMessages?: Record<string, string>;
}

export function MyComponent({ title, onAction, customMessages }: MyComponentProps) {
  const { coreClient } = useCoreClient();
  const { t } = useTranslator('namespace', customMessages);
  const { isDarkMode } = useTheme();

  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await coreClient?.someService.getData();
        setData(result ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [coreClient]);

  const filteredData = useMemo(() => {
    return data.filter((item) => item.length > 0);
  }, [data]);

  const handleClick = useCallback(() => {
    onAction?.(data[0]);
  }, [data, onAction]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <h1>{t('title')}</h1>
      <p>{title}</p>
      {filteredData.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      <button onClick={handleClick}>{t('action')}</button>
    </div>
  );
}
```

### Vue Component (After)

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useCoreClient } from '../composables/use-core-client';
import { useTranslator } from '../composables/use-translator';
import { useTheme } from '../composables/use-theme';

// Props definition
interface Props {
  title: string;
  customMessages?: Record<string, string>;
}

const props = defineProps<Props>();

// Events definition
const emit = defineEmits<{
  action: [result: string];
}>();

// Composables
const coreClient = useCoreClient();
const { t } = useTranslator('namespace', props.customMessages);
const { isDarkMode } = useTheme();

// Reactive state
const data = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed properties (equivalent to useMemo)
const filteredData = computed(() => {
  return data.value.filter((item) => item.length > 0);
});

// Methods (no need for useCallback in Vue)
function handleClick() {
  emit('action', data.value[0]);
}

// Lifecycle / side effects
async function fetchData() {
  isLoading.value = true;
  try {
    const result = await coreClient.value?.someService.getData();
    data.value = result ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
}

// Run on mount (equivalent to useEffect with [])
onMounted(() => {
  fetchData();
});

// Watch for changes (equivalent to useEffect with deps)
watch(
  () => coreClient.value,
  () => {
    if (coreClient.value) {
      fetchData();
    }
  },
);
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else :class="{ dark: isDarkMode }">
    <h1>{{ t('title') }}</h1>
    <p>{{ props.title }}</p>
    <div v-for="(item, index) in filteredData" :key="index">
      {{ item }}
    </div>
    <button @click="handleClick">{{ t('action') }}</button>
  </div>
</template>
```

## Hook to Composable Conversion

### React Hook Pattern

```tsx
export function useMyHook(param: string) {
  const { coreClient } = useCoreClient();
  const [state, setState] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  const doSomething = useCallback(async () => {
    setLoading(true);
    const result = await coreClient?.service.action(param);
    setState(result);
    setLoading(false);
  }, [coreClient, param]);

  useEffect(() => {
    doSomething();
  }, [doSomething]);

  return { state, loading, doSomething };
}
```

### Vue Composable Pattern

```ts
export function useMyComposable(param: string) {
  const coreClient = useCoreClient();
  const state = ref<Data | null>(null);
  const loading = ref(false);

  async function doSomething() {
    loading.value = true;
    const result = await coreClient.value?.service.action(param);
    state.value = result ?? null;
    loading.value = false;
  }

  // Watch param changes and re-fetch
  watch(
    () => param,
    () => doSomething(),
    { immediate: true },
  );

  return { state, loading, doSomething };
}
```

## Provider to Plugin Conversion

### React Provider Pattern

```tsx
const MyContext = createContext<ContextValue | null>(null);

export function MyProvider({ children, config }: Props) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Initialize
  }, [config]);

  return <MyContext.Provider value={{ state, setState }}>{children}</MyContext.Provider>;
}

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('Must be used within MyProvider');
  return context;
};
```

### Vue Plugin Pattern

```ts
import type { InjectionKey, Plugin, Ref } from 'vue';

interface ContextValue {
  state: Ref<State>;
  setState: (value: State) => void;
}

export const MyContextKey: InjectionKey<ContextValue> = Symbol('MyContext');

export const MyPlugin: Plugin = {
  install(app, options) {
    const state = ref(initialState);

    // Initialize based on options

    app.provide(MyContextKey, {
      state,
      setState: (value) => {
        state.value = value;
      },
    });
  },
};

export function useMyContext() {
  const context = inject(MyContextKey);
  if (!context) throw new Error('Must install MyPlugin');
  return context;
}
```

## Anti-Patterns to Avoid

### 1. Don't Mutate Props

```vue
<!-- BAD -->
<script setup>
const props = defineProps<{ items: string[] }>();
props.items.push('new'); // Never mutate props!
</script>

<!-- GOOD -->
<script setup>
const props = defineProps<{ items: string[] }>();
const localItems = ref([...props.items]);
localItems.value.push('new');
</script>
```

### 2. Don't Use Refs in v-for Without Keys

```vue
<!-- BAD -->
<div v-for="item in items" ref="itemRefs">{{ item }}</div>

<!-- GOOD -->
<div v-for="item in items" :key="item.id" :ref="(el) => setItemRef(item.id, el)">
  {{ item }}
</div>
```

### 3. Don't Access ref.value in Template

```vue
<!-- BAD (in template) -->
<div>{{ count.value }}</div>

<!-- GOOD (in template - auto-unwrapped) -->
<div>{{ count }}</div>
```

### 4. Don't Forget to Handle Nullable Injection

```ts
// BAD
const context = inject(SomeKey); // Could be undefined!
context.doSomething(); // Runtime error

// GOOD
const context = inject(SomeKey);
if (!context) throw new Error('Missing provider');
context.doSomething();
```

### 5. Don't Use Reactive for Primitives

```ts
// BAD
const count = reactive({ value: 0 }); // Overcomplicated

// GOOD
const count = ref(0);
```

### 6. Don't Destructure Reactive Objects

```ts
// BAD - loses reactivity
const state = reactive({ count: 0, name: '' });
const { count } = state; // count is now a plain number

// GOOD - use toRefs if needed
const { count, name } = toRefs(state);
```

## TanStack Query Conversion

### React Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetchItems(),
  });

  const mutation = useMutation({
    mutationFn: (newItem) => createItem(newItem),
    onSuccess: () => queryClient.invalidateQueries(['items']),
  });
}
```

### Vue Query

```vue
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

const queryClient = useQueryClient();

const { data, isLoading, error } = useQuery({
  queryKey: ['items'],
  queryFn: () => fetchItems(),
});

const mutation = useMutation({
  mutationFn: (newItem: Item) => createItem(newItem),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
});
</script>
```

## Form Handling Conversion

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function MyForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {formState.errors.name && <span>{formState.errors.name.message}</span>}
    </form>
  );
}
```

### VeeValidate (Vue Alternative)

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema),
});

const [name, nameAttrs] = defineField('name');

const onSubmit = handleSubmit((values) => {
  // Handle submission
});
</script>

<template>
  <form @submit="onSubmit">
    <input v-model="name" v-bind="nameAttrs" />
    <span v-if="errors.name">{{ errors.name }}</span>
  </form>
</template>
```

## TypeScript Considerations

### Props with Defaults

```vue
<script setup lang="ts">
// With defaults
interface Props {
  title?: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  count: 0,
});
</script>
```

### Generic Components

```vue
<script setup lang="ts" generic="T extends { id: string }">
interface Props {
  items: T[];
  selected?: T;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [item: T];
}>();
</script>
```

## Testing Conversion

### React Testing Library

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('renders and handles click', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### Vue Testing Library

```ts
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

test('renders and handles click', async () => {
  const handleClick = vi.fn();
  render(Button, {
    props: { onClick: handleClick },
    slots: { default: 'Click me' },
  });

  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

## File Structure Mapping

```
React                           Vue
─────                           ───
src/hooks/use-*.ts         →   src/composables/use-*.ts
src/providers/*.tsx        →   src/plugins/*.ts
src/components/*.tsx       →   src/components/*.vue or *.ts
src/blocks/*.tsx           →   src/blocks/*.vue
src/types/*.ts             →   src/types/*.ts (mostly reusable)
src/hoc/with-*.tsx         →   src/composables/with-*.ts (use composables instead)
```

## Checklist for Conversion

- [ ] Convert `useState` → `ref()` or `reactive()`
- [ ] Convert `useEffect` → `onMounted`, `watch`, or `watchEffect`
- [ ] Convert `useMemo` → `computed()`
- [ ] Convert `useCallback` → plain function
- [ ] Convert `useContext` → `inject()` with proper key
- [ ] Convert `createContext` → `InjectionKey<T>`
- [ ] Convert props interface → `defineProps<T>()`
- [ ] Convert callback props → `defineEmits<T>()`
- [ ] Convert `children` → `<slot />`
- [ ] Convert className → class (or :class for dynamic)
- [ ] Convert event handlers → @ syntax
- [ ] Convert conditional rendering → v-if/v-else
- [ ] Convert list rendering → v-for with :key
- [ ] Convert refs → template refs with ref()
- [ ] Add proper TypeScript types for all reactive values
- [ ] Test component renders correctly
- [ ] Test all user interactions work
