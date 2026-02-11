<script setup lang="ts">
// NO import from @auth0/auth0-vue - proxy handles auth server-side
import type { AuthDetails, CoreClientInterface } from '@auth0/universal-components-core';
import { createCoreClient, applyStyleOverrides } from '@auth0/universal-components-core';
import { provide, ref, reactive, onMounted, shallowRef } from 'vue';
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

// Core client WITHOUT auth context (proxy handles tokens)
const coreClient = shallowRef<CoreClientInterface | null>(null);

onMounted(async () => {
  coreClient.value = await createCoreClient(
    { ...props.authDetails, contextInterface: undefined }, // Key difference
    props.i18n,
  );
});

const isDarkMode = ref(props.themeSettings?.mode === 'dark');
const ensuredScopes = reactive({ me: '', 'my-org': '' });
const isReady = ref(false);

const scopeManager = {
  registerScopes: async (_api: 'me' | 'my-org', _scopes: string) => {
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
