import { inject, type InjectionKey, type Ref } from 'vue';

/**
 * Scope manager context value interface.
 */
export interface ScopeManagerContextValue {
  /** Currently registered scopes */
  registeredScopes: Ref<Set<string>>;
  /** Register additional scopes */
  registerScopes: (scopes: string[]) => void;
  /** Check if a scope is registered */
  hasScope: (scope: string) => boolean;
  /** Get all registered scopes as an array */
  getScopesArray: () => string[];
}

/**
 * Injection key for ScopeManager context.
 */
export const ScopeManagerKey: InjectionKey<ScopeManagerContextValue> = Symbol('ScopeManager');

/**
 * Composable to access the scope manager from context.
 *
 * The scope manager handles OAuth scope registration for components
 * that require specific API permissions.
 *
 * @returns Scope manager context value
 * @throws {Error} Throws if used outside of a ScopeManagerProvider
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useScopeManager } from '@auth0/universal-components-vue';
 *
 * const { registerScopes, hasScope, getScopesArray } = useScopeManager();
 *
 * // Register required scopes
 * registerScopes(['read:mfa', 'write:mfa']);
 *
 * // Check if scope is available
 * if (hasScope('read:mfa')) {
 *   // Perform MFA operations
 * }
 * </script>
 * ```
 */
export function useScopeManager(): ScopeManagerContextValue {
  const context = inject(ScopeManagerKey);

  if (!context) {
    throw new Error(
      'useScopeManager must be used within a ScopeManagerProvider. ' +
        'Make sure you have installed the Auth0ComponentsPlugin or wrapped your app with Auth0ComponentsProvider.',
    );
  }

  return context;
}
