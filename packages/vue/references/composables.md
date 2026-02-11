# Vue Composables

> React hooks → Vue composables conversion patterns.

---

## Composable Conventions

### Naming

- All composables start with `use`: `useCoreClient`, `useTranslator`, `useTheme`
- File naming: `use-core-client.ts`, `use-translator.ts` (kebab-case)

### Structure Template

```typescript
// composables/use-feature.ts
import { ref, computed, watch, onMounted, type Ref } from 'vue';
import { inject } from 'vue';
import { CORE_CLIENT_KEY } from '../types/injection-keys';

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
  const coreClient = inject(CORE_CLIENT_KEY);

  const data = ref<Data>();
  const isLoading = ref(true);

  // Reactive logic...

  return { data, isLoading, save };
}
```

---

## Core Composables

### useCoreClient

```typescript
// composables/use-core-client.ts
import { inject, type Ref } from 'vue';
import type { CoreClientInterface } from '@auth0/universal-components-core';
import { CORE_CLIENT_KEY } from '../types/injection-keys';

export function useCoreClient(): { coreClient: Ref<CoreClientInterface | null> } {
  const coreClient = inject(CORE_CLIENT_KEY);

  if (coreClient === undefined) {
    throw new Error('useCoreClient must be used within Auth0ComponentProvider');
  }

  return { coreClient };
}
```

### useTranslator

```typescript
// composables/use-translator.ts
import { computed } from 'vue';
import { useCoreClient } from './use-core-client';

export function useTranslator(namespace: string, customMessages?: Record<string, unknown>) {
  const { coreClient } = useCoreClient();

  const t = computed(() => {
    if (!coreClient.value) return () => '';
    return coreClient.value.i18nService.translator(namespace, customMessages);
  });

  return { t };
}
```

### useTheme

```typescript
// composables/use-theme.ts
import { inject } from 'vue';
import { THEME_KEY } from '../types/injection-keys';

export function useTheme() {
  const theme = inject(THEME_KEY);

  if (!theme) {
    throw new Error('useTheme must be used within Auth0ComponentProvider');
  }

  return {
    isDarkMode: theme.isDarkMode,
  };
}
```

### useScopeManager

```typescript
// composables/use-scope-manager.ts
import { inject } from 'vue';
import { SCOPE_MANAGER_KEY } from '../types/injection-keys';

export function useScopeManager() {
  const scopeManager = inject(SCOPE_MANAGER_KEY);

  if (!scopeManager) {
    throw new Error('useScopeManager must be used within Auth0ComponentProvider');
  }

  return scopeManager;
}
```

### useToast

```typescript
// composables/use-toast.ts
import { inject } from 'vue';
import { toast as sonnerToast } from 'vue-sonner';
import { TOAST_KEY } from '../types/injection-keys';

interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export function useToast() {
  const config = inject(TOAST_KEY);

  const notify = (options: ToastOptions) => {
    const { type, message, duration } = options;

    switch (type) {
      case 'success':
        sonnerToast.success(message, { duration: duration ?? config?.duration });
        break;
      case 'error':
        sonnerToast.error(message, { duration: duration ?? config?.duration });
        break;
      case 'info':
        sonnerToast.info(message, { duration: duration ?? config?.duration });
        break;
      case 'warning':
        sonnerToast.warning(message, { duration: duration ?? config?.duration });
        break;
    }
  };

  return { notify };
}
```

---

## React → Vue Hook Conversion

### State

```typescript
// ❌ React
const [count, setCount] = useState(0);

// ✅ Vue
const count = ref(0);
// Update: count.value = newValue;
```

### Derived State

```typescript
// ❌ React
const doubled = useMemo(() => count * 2, [count]);

// ✅ Vue
const doubled = computed(() => count.value * 2);
// Vue auto-tracks dependencies — no manual dep array
```

### Functions

```typescript
// ❌ React
const handleClick = useCallback(() => {
  doSomething(count);
}, [count]);

// ✅ Vue
// Just define the function — no wrapper needed
const handleClick = () => {
  doSomething(count.value);
};
```

### Side Effects

```typescript
// ❌ React — mount effect
useEffect(() => {
  fetchData();
}, []);

// ✅ Vue
onMounted(() => fetchData());
```

```typescript
// ❌ React — reactive effect
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// ✅ Vue
watch(count, (val) => {
  document.title = `Count: ${val}`;
});
// OR
watchEffect(() => {
  document.title = `Count: ${count.value}`;
});
```

### Cleanup

```typescript
// ❌ React
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);

// ✅ Vue
onMounted(() => {
  const subscription = subscribe();
  onUnmounted(() => subscription.unsubscribe());
});

// OR with watchEffect
watchEffect((onCleanup) => {
  const subscription = subscribe();
  onCleanup(() => subscription.unsubscribe());
});
```

### Context

```typescript
// ❌ React
const CoreClientContext = createContext<CoreClientInterface | null>(null);
const useCoreClient = () => useContext(CoreClientContext)!;

// Provider:
<CoreClientContext.Provider value={client}>{children}</CoreClientContext.Provider>

// ✅ Vue
const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');

// Provider:
provide(CORE_CLIENT_KEY, client);

// Consumer:
const coreClient = inject(CORE_CLIENT_KEY)!;
```

---

## Best Practices

| Rule                                                           | Reason                                         |
| -------------------------------------------------------------- | ---------------------------------------------- |
| Always return `ref`s, not `reactive`                           | Allows destructuring without losing reactivity |
| Accept `MaybeRefOrGetter<T>` for flexible inputs               | Use `toValue()` to normalize                   |
| Use `shallowRef` for complex objects not needing deep tracking | Performance                                    |
| Register cleanup in `onUnmounted` or `onWatcherCleanup`        | Prevent memory leaks                           |
| Composables can call other composables                         | Composition pattern                            |
| Only call composables in `<script setup>` or `setup()`         | Vue restriction for instance binding           |

---

## Composable Barrel Export

```typescript
// composables/index.ts
export { useCoreClient } from './use-core-client';
export { useTranslator } from './use-translator';
export { useTheme } from './use-theme';
export { useScopeManager } from './use-scope-manager';
export { useToast } from './use-toast';

// Feature-specific
export { useOrganizationDetailsEdit } from './my-organization/organization-management/use-organization-details-edit';
```
