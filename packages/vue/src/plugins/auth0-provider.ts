import {
  createCoreClient,
  applyStyleOverrides,
  type CoreClientInterface,
  type StylingVariables,
  type AuthDetails,
} from '@auth0/universal-components-core';
import {
  ref,
  provide,
  watch,
  onMounted,
  type App,
  type Plugin,
  type Component,
  defineComponent,
  h,
} from 'vue';

import { CoreClientKey } from '../composables/use-core-client';
import { ScopeManagerKey, type ScopeManagerContextValue } from '../composables/use-scope-manager';
import { ThemeKey, type ThemeContextValue } from '../composables/use-theme';

/**
 * Theme configuration options.
 */
export interface ThemeSettings {
  /** Theme variant */
  theme?: 'default' | 'minimal' | 'rounded';
  /** Color mode */
  mode?: 'light' | 'dark';
  /** CSS variable overrides */
  variables?: StylingVariables;
  /** Custom loader component */
  loader?: Component;
}

/**
 * Plugin options for Auth0ComponentsPlugin.
 */
export interface Auth0ComponentsPluginOptions {
  /** Auth0 domain (e.g., 'your-tenant.auth0.com') */
  domain: string;
  /** Auth0 client ID */
  clientId: string;
  /** Function to get access token */
  getAccessToken: () => Promise<string>;
  /** Optional auth details for RWA mode */
  authDetails?: AuthDetails;
  /** Initial language code */
  language?: string;
  /** Fallback language code */
  fallbackLanguage?: string;
  /** Theme settings */
  themeSettings?: ThemeSettings;
}

/**
 * Default empty style overrides.
 */
const defaultStyleOverrides: StylingVariables = { common: {}, light: {}, dark: {} };

/**
 * Auth0ComponentsProvider component for use in templates.
 *
 * Provides CoreClient, Theme, and ScopeManager contexts to all child components.
 *
 * @example
 * ```vue
 * <template>
 *   <Auth0ComponentsProvider
 *     :domain="domain"
 *     :clientId="clientId"
 *     :getAccessToken="getAccessToken"
 *     :themeSettings="{ mode: 'dark' }"
 *   >
 *     <App />
 *   </Auth0ComponentsProvider>
 * </template>
 * ```
 */
export const Auth0ComponentsProvider = defineComponent({
  name: 'Auth0ComponentsProvider',
  props: {
    domain: { type: String, required: true },
    clientId: { type: String, required: true },
    getAccessToken: { type: Function as unknown as () => () => Promise<string>, required: true },
    authDetails: { type: Object as () => AuthDetails, default: undefined },
    language: { type: String, default: 'en-US' },
    fallbackLanguage: { type: String, default: undefined },
    themeSettings: { type: Object as () => ThemeSettings, default: () => ({}) },
  },
  setup(props, { slots }) {
    // Core client state
    const coreClient = ref<CoreClientInterface | null>(null);

    // Theme state
    const isDarkMode = ref(props.themeSettings?.mode === 'dark');
    const variables = ref<StylingVariables>(
      props.themeSettings?.variables ?? defaultStyleOverrides,
    );
    const loader = ref<Component | null>(props.themeSettings?.loader ?? null);

    // Scope manager state
    const registeredScopes = ref(new Set<string>());

    // Initialize CoreClient
    onMounted(async () => {
      try {
        const client = await createCoreClient({
          domain: props.domain,
          clientId: props.clientId,
          getAccessToken: props.getAccessToken as () => Promise<string>,
          authDetails: props.authDetails,
          language: props.language,
          fallbackLanguage: props.fallbackLanguage,
        });
        coreClient.value = client;
      } catch (error) {
        console.error('[Auth0ComponentsProvider] Failed to initialize CoreClient:', error);
      }
    });

    // Apply theme overrides when settings change
    watch(
      () => [props.themeSettings?.variables, props.themeSettings?.mode, props.themeSettings?.theme],
      () => {
        const { variables: vars, mode, theme } = props.themeSettings ?? {};
        applyStyleOverrides(vars ?? defaultStyleOverrides, mode, theme);
        isDarkMode.value = mode === 'dark';
        variables.value = vars ?? defaultStyleOverrides;
      },
      { immediate: true },
    );

    // Provide CoreClient context
    provide(CoreClientKey, coreClient);

    // Provide Theme context
    const themeContext: ThemeContextValue = {
      isDarkMode,
      variables,
      loader,
    };
    provide(ThemeKey, themeContext);

    // Provide ScopeManager context
    const scopeManagerContext: ScopeManagerContextValue = {
      registeredScopes,
      registerScopes: (scopes: string[]) => {
        scopes.forEach((scope) => registeredScopes.value.add(scope));
      },
      hasScope: (scope: string) => registeredScopes.value.has(scope),
      getScopesArray: () => Array.from(registeredScopes.value),
    };
    provide(ScopeManagerKey, scopeManagerContext);

    return () => slots.default?.();
  },
});

/**
 * Vue plugin for Auth0 Universal Components.
 *
 * Installs the Auth0ComponentsProvider globally and provides
 * CoreClient, Theme, and ScopeManager contexts.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { Auth0ComponentsPlugin } from '@auth0/universal-components-vue';
 *
 * const app = createApp(App);
 *
 * app.use(Auth0ComponentsPlugin, {
 *   domain: 'your-tenant.auth0.com',
 *   clientId: 'your-client-id',
 *   getAccessToken: async () => {
 *     // Return access token
 *   },
 *   themeSettings: {
 *     mode: 'dark',
 *   },
 * });
 *
 * app.mount('#app');
 * ```
 */
export const Auth0ComponentsPlugin: Plugin<Auth0ComponentsPluginOptions> = {
  install(app: App, options: Auth0ComponentsPluginOptions) {
    // Core client state
    const coreClient = ref<CoreClientInterface | null>(null);

    // Theme state
    const isDarkMode = ref(options.themeSettings?.mode === 'dark');
    const variables = ref<StylingVariables>(
      options.themeSettings?.variables ?? defaultStyleOverrides,
    );
    const loader = ref<Component | null>(options.themeSettings?.loader ?? null);

    // Scope manager state
    const registeredScopes = ref(new Set<string>());

    // Initialize CoreClient asynchronously
    createCoreClient({
      domain: options.domain,
      clientId: options.clientId,
      getAccessToken: options.getAccessToken,
      authDetails: options.authDetails,
      language: options.language ?? 'en-US',
      fallbackLanguage: options.fallbackLanguage,
    })
      .then((client) => {
        coreClient.value = client;
      })
      .catch((error) => {
        console.error('[Auth0ComponentsPlugin] Failed to initialize CoreClient:', error);
      });

    // Apply initial theme overrides
    const { variables: vars, mode, theme } = options.themeSettings ?? {};
    applyStyleOverrides(vars ?? defaultStyleOverrides, mode, theme);

    // Provide CoreClient globally
    app.provide(CoreClientKey, coreClient);

    // Provide Theme context globally
    const themeContext: ThemeContextValue = {
      isDarkMode,
      variables,
      loader,
    };
    app.provide(ThemeKey, themeContext);

    // Provide ScopeManager context globally
    const scopeManagerContext: ScopeManagerContextValue = {
      registeredScopes,
      registerScopes: (scopes: string[]) => {
        scopes.forEach((scope) => registeredScopes.value.add(scope));
      },
      hasScope: (scope: string) => registeredScopes.value.has(scope),
      getScopesArray: () => Array.from(registeredScopes.value),
    };
    app.provide(ScopeManagerKey, scopeManagerContext);

    // Register the provider component globally
    app.component('Auth0ComponentsProvider', Auth0ComponentsProvider);
  },
};
