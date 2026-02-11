<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import type {
  AuthDetails,
  BasicAuth0ContextInterface,
  CoreClientInterface,
} from '@auth0/universal-components-core';
import { createCoreClient, applyStyleOverrides } from '@auth0/universal-components-core';
import { provide, ref, computed, onMounted, reactive, shallowRef } from 'vue';
import {
  CORE_CLIENT_KEY,
  THEME_KEY,
  SCOPE_MANAGER_KEY,
  TOAST_KEY,
  type ToastConfig,
} from '../types/injection-keys';

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
  toastSettings?: ToastConfig;
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
    getAccessTokenSilently: auth0.getAccessTokenSilently as BasicAuth0ContextInterface['getAccessTokenSilently'],
    getAccessTokenWithPopup: auth0.getAccessTokenWithPopup as BasicAuth0ContextInterface['getAccessTokenWithPopup'],
    loginWithRedirect: auth0.loginWithRedirect as BasicAuth0ContextInterface['loginWithRedirect'],
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

// CRITICAL: All provide() calls must happen synchronously in setup
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
