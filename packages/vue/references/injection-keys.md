# Vue Injection Keys

> InjectionKey symbols for type-safe dependency injection.

---

## Overview

Vue's `provide`/`inject` uses `InjectionKey` symbols for type safety:

```typescript
import type { InjectionKey } from 'vue';

// Define typed key
const KEY: InjectionKey<MyType> = Symbol('KeyName');

// Provider
provide(KEY, value); // ✅ TypeScript validates value type

// Consumer
const value = inject(KEY); // ✅ TypeScript infers correct type
```

---

## Key Definitions

```typescript
// src/types/injection-keys.ts
import type { InjectionKey, Ref, ShallowRef } from 'vue';
import type { CoreClientInterface } from '@auth0/universal-components-core';

// ─────────────────────────────────────────────────────────────
// Core Client
// ─────────────────────────────────────────────────────────────

/**
 * Provides access to the CoreClient for API calls, i18n, and auth.
 * Initialized asynchronously in provider, so it's a ShallowRef.
 */
export const CORE_CLIENT_KEY: InjectionKey<ShallowRef<CoreClientInterface | null>> =
  Symbol('CoreClient');

// ─────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────

export interface ThemeContext {
  /** Reactive dark mode state */
  isDarkMode: Ref<boolean>;
}

/**
 * Provides theme state for components.
 */
export const THEME_KEY: InjectionKey<ThemeContext> = Symbol('Theme');

// ─────────────────────────────────────────────────────────────
// Scope Manager
// ─────────────────────────────────────────────────────────────

export interface ScopeManagerContext {
  /**
   * Register required scopes for an API.
   * Called by WithOrganizationService and WithAccountService.
   */
  registerScopes: (api: 'me' | 'my-org', scopes: string) => Promise<void>;

  /**
   * Currently ensured scopes per API.
   */
  ensured: {
    me: string;
    'my-org': string;
  };

  /**
   * True when all registered scopes have been ensured.
   */
  isReady: Ref<boolean>;
}

/**
 * Manages OAuth scope registration and validation.
 */
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManagerContext> = Symbol('ScopeManager');

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────

export interface ToastConfig {
  /** Toast position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Default duration in milliseconds */
  duration?: number;
}

/**
 * Configuration for toast notifications.
 */
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
```

---

## Usage in Providers

```vue
<!-- Auth0ComponentProvider.vue -->
<script setup lang="ts">
import { provide, ref, reactive, shallowRef } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

// Create values
const coreClient = shallowRef<CoreClientInterface | null>(null);
const isDarkMode = ref(false);
const ensured = reactive({ me: '', 'my-org': '' });
const isReady = ref(false);

// Provide all keys
provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode });
provide(SCOPE_MANAGER_KEY, {
  registerScopes: async (api, scopes) => {
    /* ... */
  },
  ensured,
  isReady,
});
provide(TOAST_KEY, { position: 'bottom-right', duration: 5000 });
</script>
```

---

## Usage in Composables

```typescript
// composables/use-core-client.ts
import { inject } from 'vue';
import { CORE_CLIENT_KEY } from '../types/injection-keys';

export function useCoreClient() {
  const coreClient = inject(CORE_CLIENT_KEY);

  if (coreClient === undefined) {
    throw new Error('useCoreClient must be used within Auth0ComponentProvider');
  }

  return { coreClient };
}
```

```typescript
// composables/use-theme.ts
import { inject } from 'vue';
import { THEME_KEY } from '../types/injection-keys';

export function useTheme() {
  const theme = inject(THEME_KEY);

  if (!theme) {
    throw new Error('useTheme must be used within Auth0ComponentProvider');
  }

  return theme;
}
```

---

## Comparison with React Context

| Aspect           | React                            | Vue                           |
| ---------------- | -------------------------------- | ----------------------------- |
| Key definition   | `createContext()`                | `Symbol() as InjectionKey<T>` |
| Provider         | `<Context.Provider value={...}>` | `provide(KEY, value)`         |
| Consumer         | `useContext(Context)`            | `inject(KEY)`                 |
| Missing provider | Uses default or throws           | Returns `undefined`           |
| Type inference   | Via generic on createContext     | Via InjectionKey generic      |

---

## Error Handling Pattern

Since `inject()` returns `undefined` when no provider exists, always check:

```typescript
export function useCoreClient() {
  const coreClient = inject(CORE_CLIENT_KEY);

  // Explicit check for undefined (not just falsy)
  if (coreClient === undefined) {
    throw new Error(
      'useCoreClient must be used within Auth0ComponentProvider. ' +
        'Make sure your component is wrapped with <Auth0ComponentProvider>.',
    );
  }

  return { coreClient };
}
```

---

## Default Values

You can provide defaults for optional injection:

```typescript
// With default
const toast = inject(TOAST_KEY, { position: 'top-right', duration: 3000 });

// With factory function (called only when no provider)
const toast = inject(TOAST_KEY, () => ({ position: 'top-right', duration: 3000 }), true);
```

---

## All Keys Summary

| Key                 | Type                                      | Purpose                   |
| ------------------- | ----------------------------------------- | ------------------------- |
| `CORE_CLIENT_KEY`   | `ShallowRef<CoreClientInterface \| null>` | API calls, i18n, auth     |
| `THEME_KEY`         | `{ isDarkMode: Ref<boolean> }`            | Theme state               |
| `SCOPE_MANAGER_KEY` | `ScopeManagerContext`                     | OAuth scope management    |
| `TOAST_KEY`         | `ToastConfig`                             | Toast notification config |
