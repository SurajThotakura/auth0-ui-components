<script setup lang="ts">
// ⚠️ NO import from @auth0/auth0-vue — proxy handles auth server-side
import type {
  AuthDetails,
  I18nInitOptions,
  CoreClientInterface,
} from '@auth0/universal-components-core'
import {
  createCoreClient,
  applyStyleOverrides,
} from '@auth0/universal-components-core'
import { provide, ref, onMounted, reactive, shallowRef } from 'vue'

import {
  CORE_CLIENT_KEY,
  THEME_KEY,
  SCOPE_MANAGER_KEY,
  TOAST_KEY,
  type ToastConfig,
  type ScopeManagerContext,
} from '../types/injection-keys'

export interface ThemeSettings {
  mode?: 'light' | 'dark'
  theme?: 'default' | 'minimal' | 'rounded'
}

export interface Auth0ProxyComponentProviderProps {
  authDetails: Omit<AuthDetails, 'contextInterface'>
  i18n?: I18nInitOptions
  themeSettings?: ThemeSettings
  toastSettings?: ToastConfig
}

const props = withDefaults(defineProps<Auth0ProxyComponentProviderProps>(), {
  themeSettings: () => ({ mode: 'light', theme: 'default' }),
  toastSettings: () => ({ position: 'bottom-right', duration: 5000 }),
})

// Core client ref (will be initialized async)
const coreClient = shallowRef<CoreClientInterface | undefined>(undefined)

// Theme state
const isDarkMode = ref(props.themeSettings?.mode === 'dark')

// Scope manager state
const ensuredScopes = reactive<{ me: string; 'my-org': string }>({
  me: '',
  'my-org': '',
})

const scopeManager: ScopeManagerContext = {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => {
    const currentScopes = new Set(ensuredScopes[api].split(' ').filter(Boolean))
    const newScopes = scopes.split(' ').filter(Boolean)
    newScopes.forEach((scope) => currentScopes.add(scope))
    ensuredScopes[api] = Array.from(currentScopes).join(' ')
  },
  ensured: ensuredScopes,
}

// Provide all contexts (coreClient will be undefined initially)
provide(CORE_CLIENT_KEY, coreClient)
provide(THEME_KEY, { isDarkMode })
provide(SCOPE_MANAGER_KEY, scopeManager)
provide(TOAST_KEY, props.toastSettings)

// Initialize core client on mount
onMounted(async () => {
  // Apply theme
  if (props.themeSettings) {
    applyStyleOverrides(
      { common: {}, light: {}, dark: {} },
      props.themeSettings.mode,
      props.themeSettings.theme
    )
  }

  // Initialize core client WITHOUT auth context (proxy handles tokens)
  coreClient.value = await createCoreClient({
    ...props.authDetails,
    contextInterface: undefined,
  }, props.i18n)
})
</script>

<template>
  <slot />
</template>
