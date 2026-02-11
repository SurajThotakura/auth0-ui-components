# Vue Example App

> Example app structure and scaffolding patterns based on React SPA template.

---

## Reference Structure

The Vue example app mirrors the React SPA structure:

```
examples/vue/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── postcss.config.mjs
│
└── src/
    ├── main.ts                 # App entry point
    ├── App.vue                 # Root component with Auth0 provider
    ├── style.css               # Global styles (imports package CSS)
    │
    ├── config/
    │   └── env.ts              # Auth0 configuration
    │
    ├── components/
    │   └── NavBar.vue          # Navigation with auth buttons
    │
    ├── views/
    │   ├── HomePage.vue        # Landing page
    │   ├── OrganizationManagementPage.vue
    │   ├── MfaPage.vue
    │   └── ...                 # One view per block
    │
    └── router/
        └── index.ts            # Vue Router configuration
```

---

## Key Files

### package.json

```json
{
  "name": "vue-spa-example",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "@auth0/auth0-vue": "^2.5.0",
    "@auth0/universal-components-vue": "file:../../packages/vue/auth0-universal-components-vue-1.0.0-beta.1.tgz",
    "@tanstack/vue-query": "^5.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

### main.ts

```typescript
import { createApp } from 'vue';
import { createAuth0 } from '@auth0/auth0-vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';
import { router } from './router';
import { config } from './config/env';

import './style.css';

const app = createApp(App);

// 1. Router FIRST (required for Auth0)
app.use(router);

// 2. Auth0 plugin
app.use(
  createAuth0({
    domain: config.auth0.domain,
    clientId: config.auth0.clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: config.auth0.audience,
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  }),
);

// 3. Vue Query
app.use(VueQueryPlugin);

app.mount('#app');
```

### config/env.ts

```typescript
export const config = {
  auth0: {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  },
};
```

### App.vue

```vue
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { Auth0ComponentProvider } from '@auth0/universal-components-vue';
import { config } from './config/env';
import NavBar from './components/NavBar.vue';

const { isLoading, isAuthenticated } = useAuth0();
</script>

<template>
  <Auth0ComponentProvider
    :auth-details="{ domain: config.auth0.domain }"
    :theme-settings="{ mode: 'light', theme: 'default' }"
  >
    <div class="min-h-screen bg-background">
      <NavBar />
      <main class="container mx-auto px-4 py-8">
        <div v-if="isLoading" class="flex justify-center p-8">Loading...</div>
        <RouterView v-else />
      </main>
    </div>
  </Auth0ComponentProvider>
</template>
```

### components/NavBar.vue

```vue
<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { RouterLink } from 'vue-router';

const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

const handleLogin = () => {
  loginWithRedirect();
};

const handleLogout = () => {
  logout({ logoutParams: { returnTo: window.location.origin } });
};
</script>

<template>
  <nav class="border-b bg-background">
    <div class="container mx-auto flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-6">
        <RouterLink to="/" class="text-lg font-semibold"> Vue Example </RouterLink>

        <template v-if="isAuthenticated">
          <RouterLink
            to="/organization-management"
            class="text-sm text-muted-foreground hover:text-foreground"
          >
            Organization
          </RouterLink>
          <RouterLink to="/mfa" class="text-sm text-muted-foreground hover:text-foreground">
            MFA
          </RouterLink>
        </template>
      </div>

      <div class="flex items-center gap-4">
        <template v-if="isAuthenticated">
          <span class="text-sm text-muted-foreground">
            {{ user?.name || user?.email }}
          </span>
          <button
            class="rounded-lg bg-muted px-4 py-2 text-sm hover:bg-muted/80"
            @click="handleLogout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <button
            class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            @click="handleLogin"
          >
            Login
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
```

### router/index.ts

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createAuthGuard } from '@auth0/auth0-vue';

import HomePage from '@/views/HomePage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/organization-management',
      name: 'organization-management',
      component: () => import('@/views/OrganizationManagementPage.vue'),
      beforeEnter: createAuthGuard(),
    },
    {
      path: '/mfa',
      name: 'mfa',
      component: () => import('@/views/MfaPage.vue'),
      beforeEnter: createAuthGuard(),
    },
  ],
});

export { router };
```

### views/OrganizationManagementPage.vue

```vue
<script setup lang="ts">
import { OrganizationDetailsEdit } from '@auth0/universal-components-vue';
</script>

<template>
  <div class="max-w-3xl">
    <OrganizationDetailsEdit />
  </div>
</template>
```

### style.css

```css
/* Import package styles */
@import '@auth0/universal-components-vue/styles';

/* Or if using local build */
@import '../../packages/vue/dist/styles.css';
```

---

## Integration Checklist

When adding a new converted component to the example app:

1. **Create view component** in `src/views/`
2. **Add route** in `router/index.ts`
3. **Add NavBar link** in `components/NavBar.vue`
4. **Import block** from the Vue package
5. **Test preview** at corresponding route

---

## Environment Variables

Create `.env` file:

```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api
```

---

## Using Local Package (Tarball)

```bash
# In packages/vue
pnpm build
pnpm pack  # Creates .tgz file

# In examples/vue
pnpm add ../../packages/vue/auth0-universal-components-vue-1.0.0-beta.1.tgz
```

---

## Commands

```bash
# Development
cd examples/vue
pnpm dev  # Start at localhost:5173

# Build
pnpm build

# Preview production build
pnpm preview
```
