<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import type {
  AuthDetails,
  BasicAuth0ContextInterface,
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

export interface Auth0ComponentProviderProps {
  authDetails: Omit<AuthDetails, 'contextInterface'>
  i18n?: I18nInitOptions
  themeSettings?: ThemeSettings
  toastSettings?: ToastConfig
}

const props = withDefaults(defineProps<Auth0ComponentProviderProps>(), {
  themeSettings: () => ({ mode: 'light', theme: 'default' }),
  toastSettings: () => ({ position: 'bottom-right', duration: 5000 }),
})

// Get Auth0 context from @auth0/auth0-vue
const auth0 = useAuth0()

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

  // Map Auth0Vue reactive state to the BasicAuth0ContextInterface expected by core
  const auth0ContextInterface: BasicAuth0ContextInterface = {
    isAuthenticated: auth0.isAuthenticated.value,
    user: auth0.user.value,
    getAccessTokenSilently: auth0.getAccessTokenSilently as BasicAuth0ContextInterface['getAccessTokenSilently'],
    getAccessTokenWithPopup: auth0.getAccessTokenWithPopup as BasicAuth0ContextInterface['getAccessTokenWithPopup'],
    loginWithRedirect: auth0.loginWithRedirect as BasicAuth0ContextInterface['loginWithRedirect'],
    getConfiguration: () => ({} as ReturnType<BasicAuth0ContextInterface['getConfiguration']>),
  }

  // Initialize core client
  coreClient.value = await createCoreClient({
    ...props.authDetails,
    contextInterface: auth0ContextInterface,
  }, props.i18n)
})
</script>

<template>
  <slot />
</template>
