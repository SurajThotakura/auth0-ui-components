import type { StylingVariables } from '@auth0/universal-components-core';
import { inject, type InjectionKey, type Ref, type Component } from 'vue';

/**
 * Theme context value interface.
 */
export interface ThemeContextValue {
  /** Whether dark mode is currently active */
  isDarkMode: Ref<boolean>;
  /** CSS variable overrides for theming */
  variables: Ref<StylingVariables>;
  /** Optional custom loader component */
  loader: Ref<Component | null>;
}

/**
 * Injection key for Theme context.
 */
export const ThemeKey: InjectionKey<ThemeContextValue> = Symbol('Theme');

/**
 * Composable to access the current theme from context.
 *
 * Provides access to:
 * - isDarkMode: Whether dark mode is active
 * - variables: CSS variable overrides
 * - loader: Optional custom loader component
 *
 * @returns Theme context value
 * @throws {Error} Throws if used outside of a ThemeProvider
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@auth0/universal-components-vue';
 *
 * const { isDarkMode, variables, loader } = useTheme();
 *
 * // React to theme changes
 * watchEffect(() => {
 *   console.log('Dark mode:', isDarkMode.value);
 * });
 * </script>
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = inject(ThemeKey);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
        'Make sure you have installed the Auth0ComponentsPlugin or wrapped your app with Auth0ComponentsProvider.',
    );
  }

  return context;
}
