/**
 * @auth0/universal-components-vue
 *
 * Vue 3 implementation of Auth0 Universal Components.
 * Uses Composition API with composables for state management.
 */

// Composables
export { useCoreClient, CoreClientKey } from './composables/use-core-client';
export { useTranslator } from './composables/use-translator';
export { useTheme, ThemeKey } from './composables/use-theme';
export { useErrorHandler } from './composables/use-error-handler';
export { useScopeManager, ScopeManagerKey } from './composables/use-scope-manager';

// Plugins
export { Auth0ComponentsPlugin } from './plugins/auth0-provider';
export type { Auth0ComponentsPluginOptions } from './plugins/auth0-provider';

// Components - UI
export { Button, buttonVariants } from './components/ui/button';

// Lib utilities
export { cn } from './lib/theme-utils';

// Re-export core types that consumers will need
export type {
  CoreClientInterface,
  StylingVariables,
  EnhancedTranslationFunction,
} from '@auth0/universal-components-core';
