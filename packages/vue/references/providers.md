# Vue Providers

> Provider patterns using `provide`/`inject` with `InjectionKey` for type-safe dependency injection.

---

## Critical: Provider Order

**Providers MUST be created FIRST before ANY other Vue code.**

Vue's `provide`/`inject` system requires providers to exist before consumers. All composables use `inject()` — they will **fail silently** without providers.

```
⛔ WRONG ORDER:                    ✅ CORRECT ORDER:
1. Components                     1. injection-keys.ts
2. Composables                    2. Providers (both SPA & Proxy)
3. Providers                      3. Entry points (index.ts, proxy.ts)
   ↓                              4. Composables
Runtime errors,                   5. Components, Blocks
undefined values
```

---

## Injection Keys

```typescript
// src/types/injection-keys.ts
import type { InjectionKey, Ref } from 'vue';
import type { CoreClientInterface } from '@auth0/universal-components-core';

export interface ThemeContext {
  isDarkMode: Ref<boolean>;
}

export interface ScopeManagerContext {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => void;
  ensured: { me: string; 'my-org': string };
  isReady: Ref<boolean>;
}

export interface ToastConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
}

// Typed InjectionKey symbols
export const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');
export const THEME_KEY: InjectionKey<ThemeContext> = Symbol('Theme');
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManagerContext> = Symbol('ScopeManager');
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
```

---

## SPA Provider

```vue
<!-- src/providers/Auth0ComponentProvider.vue -->
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import type { AuthDetails, BasicAuth0ContextInterface } from '@auth0/universal-components-core';
import { createCoreClient, applyStyleOverrides } from '@auth0/universal-components-core';
import { provide, ref, computed, onMounted, reactive, shallowRef } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

interface Props {
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  i18n?: { currentLanguage?: string; fallbackLanguage?: string };
  themeSettings?: {
    mode?: 'light' | 'dark';
    theme?: 'default' | 'minimal' | 'rounded';
    variables?: {
      common?: Record<string, string>;
      light?: Record<string, string>;
      dark?: Record<string, string>;
    };
  };
  toastSettings?: { position?: string; duration?: number };
}

const props = withDefaults(defineProps<Props>(), {
  themeSettings: () => ({
    mode: 'light',
    theme: 'default',
    variables: { common: {}, light: {}, dark: {} },
  }),
  toastSettings: () => ({ position: 'bottom-right', duration: 5000 }),
});

// Get Auth0 context from @auth0/auth0-vue
const auth0 = useAuth0();

// Map Auth0Vue reactive state to BasicAuth0ContextInterface
const auth0Context = computed(
  (): BasicAuth0ContextInterface => ({
    isAuthenticated: auth0.isAuthenticated.value,
    user: auth0.user.value,
    getAccessTokenSilently: (opts) => auth0.getAccessTokenSilently(opts),
    getAccessTokenWithPopup: (opts) => auth0.getAccessTokenWithPopup(opts),
    loginWithRedirect: (opts) => auth0.loginWithRedirect(opts),
    getConfiguration: () => ({
      domain: props.authDetails.domain ?? '',
      clientId: '',
    }),
  }),
);

// Initialize core client
const coreClient = shallowRef<CoreClientInterface | null>(null);

// Create client asynchronously
onMounted(async () => {
  coreClient.value = await createCoreClient(
    { ...props.authDetails, contextInterface: auth0Context.value },
    props.i18n,
  );
});

// Theme state
const isDarkMode = ref(props.themeSettings?.mode === 'dark');

// Scope manager
const ensuredScopes = reactive({ me: '', 'my-org': '' });
const isReady = ref(false);

const scopeManager = {
  registerScopes: async (api: 'me' | 'my-org', scopes: string) => {
    const current = new Set(ensuredScopes[api].split(' ').filter(Boolean));
    scopes
      .split(' ')
      .filter(Boolean)
      .forEach((s) => current.add(s));
    ensuredScopes[api] = Array.from(current).join(' ');

    // Ensure scopes with core client
    if (coreClient.value) {
      await coreClient.value.ensureScopes(scopes, api);
    }
    isReady.value = true;
  },
  ensured: ensuredScopes,
  isReady,
};

// ⚠️ CRITICAL: All provide() calls must happen synchronously in setup
provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode });
provide(SCOPE_MANAGER_KEY, scopeManager);
provide(TOAST_KEY, props.toastSettings);

// Apply theme on mount
onMounted(() => {
  if (props.themeSettings) {
    applyStyleOverrides(
      props.themeSettings.variables ?? { common: {}, light: {}, dark: {} },
      props.themeSettings.mode ?? 'light',
      props.themeSettings.theme ?? 'default',
    );
  }
});
</script>

<template>
  <slot />
</template>
```

---

## Proxy Provider (No @auth0/auth0-vue)

```vue
<!-- src/providers/Auth0ProxyComponentProvider.vue -->
<script setup lang="ts">
// ⚠️ NO import from @auth0/auth0-vue — proxy handles auth server-side
import type { AuthDetails } from '@auth0/universal-components-core';
import { createCoreClient, applyStyleOverrides } from '@auth0/universal-components-core';
import { provide, ref, reactive, onMounted, shallowRef } from 'vue';
import { CORE_CLIENT_KEY, THEME_KEY, SCOPE_MANAGER_KEY, TOAST_KEY } from '../types/injection-keys';

interface Props {
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  i18n?: { currentLanguage?: string; fallbackLanguage?: string };
  themeSettings?: {
    mode?: 'light' | 'dark';
    theme?: 'default' | 'minimal' | 'rounded';
    variables?: {
      common?: Record<string, string>;
      light?: Record<string, string>;
      dark?: Record<string, string>;
    };
  };
  toastSettings?: { position?: string; duration?: number };
}

const props = withDefaults(defineProps<Props>(), {
  themeSettings: () => ({
    mode: 'light',
    theme: 'default',
    variables: { common: {}, light: {}, dark: {} },
  }),
  toastSettings: () => ({ position: 'bottom-right', duration: 5000 }),
});

// Core client WITHOUT auth context (proxy handles tokens)
const coreClient = shallowRef<CoreClientInterface | null>(null);

onMounted(async () => {
  coreClient.value = await createCoreClient(
    { ...props.authDetails, contextInterface: undefined }, // ← Key difference
    props.i18n,
  );
});

const isDarkMode = ref(props.themeSettings?.mode === 'dark');
const ensuredScopes = reactive({ me: '', 'my-org': '' });
const isReady = ref(false);

const scopeManager = {
  registerScopes: async (api: 'me' | 'my-org', scopes: string) => {
    // In proxy mode, scopes are handled server-side
    isReady.value = true;
  },
  ensured: ensuredScopes,
  isReady,
};

provide(CORE_CLIENT_KEY, coreClient);
provide(THEME_KEY, { isDarkMode });
provide(SCOPE_MANAGER_KEY, scopeManager);
provide(TOAST_KEY, props.toastSettings);

onMounted(() => {
  if (props.themeSettings) {
    applyStyleOverrides(
      props.themeSettings.variables ?? { common: {}, light: {}, dark: {} },
      props.themeSettings.mode ?? 'light',
      props.themeSettings.theme ?? 'default',
    );
  }
});
</script>

<template>
  <slot />
</template>
```

---

## Provider Exports

```typescript
// src/providers/index.ts
export { default as Auth0ComponentProvider } from './Auth0ComponentProvider.vue';
export { default as Auth0ProxyComponentProvider } from './Auth0ProxyComponentProvider.vue';
```

---

## Why Providers Must Come First

Vue's `provide`/`inject` is NOT like React Context:

| Aspect           | React Context                | Vue provide/inject           |
| ---------------- | ---------------------------- | ---------------------------- |
| Missing provider | Throws error or uses default | Returns `undefined` silently |
| Debug experience | Clear error message          | No error, just `undefined`   |
| Failure mode     | Obvious, immediate           | Silent, delayed, confusing   |

**If you skip providers:**

```typescript
// In a composable
const coreClient = inject(CORE_CLIENT_KEY);
// coreClient is undefined — NO ERROR THROWN
// Later: "Cannot read property 'getMyOrganizationApiClient' of undefined"
```

---

## Provider Architecture Diagram

```
React Provider Tree:                 Vue Equivalent:
─────────────────────               ─────────────────

Auth0Provider                       app.use(createAuth0({...}))  ← plugin
│ (@auth0/auth0-react)              │
└─ Auth0ComponentProvider           └─ Auth0ComponentProvider.vue
   ├─ ThemeProvider                    provide(THEME_KEY, ...)
   ├─ CoreClientContext.Provider       provide(CORE_CLIENT_KEY, ...)
   ├─ QueryClientProvider              app.use(VueQueryPlugin)  ← plugin
   ├─ ScopeManagerProvider             provide(SCOPE_MANAGER_KEY, ...)
   └─ ToastProvider                    provide(TOAST_KEY, ...)
```

---

## Example App Setup (SPA)

```typescript
// examples/vue-spa/src/main.ts
import { createApp } from 'vue';
import { createAuth0 } from '@auth0/auth0-vue';
import { createRouter, createWebHistory } from 'vue-router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';

const app = createApp(App);

// 1. Install router FIRST (required order for Auth0)
app.use(
  createRouter({
    history: createWebHistory(),
    routes: [
      /* ... */
    ],
  }),
);

// 2. Install Auth0 plugin
app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    },
  }),
);

// 3. Install Vue Query
app.use(VueQueryPlugin);

app.mount('#app');
```

---

## Provider Checklist

Before moving to composables, verify:

- [ ] `src/types/injection-keys.ts` exists with all 4 keys
- [ ] `Auth0ComponentProvider.vue` calls `provide()` for all 4 keys
- [ ] `Auth0ProxyComponentProvider.vue` calls `provide()` for all 4 keys
- [ ] `src/providers/index.ts` exports both providers
- [ ] `src/index.ts` exports `Auth0ComponentProvider`
- [ ] `src/proxy.ts` exports `Auth0ProxyComponentProvider`
- [ ] Proxy provider does NOT import `@auth0/auth0-vue`
