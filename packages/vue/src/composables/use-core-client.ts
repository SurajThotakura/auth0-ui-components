import type { CoreClientInterface } from '@auth0/universal-components-core';
import { inject, type InjectionKey, type Ref } from 'vue';

/**
 * Injection key for CoreClient context.
 */
export const CoreClientKey: InjectionKey<Ref<CoreClientInterface | null>> = Symbol('CoreClient');

/**
 * Composable to access the CoreClient instance from context.
 *
 * Provides access to the initialized CoreClient which handles API calls and business logic.
 *
 * @returns The current CoreClient instance or null if not initialized.
 * @throws {Error} Throws if used outside of an Auth0ComponentsProvider.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCoreClient } from '@auth0/universal-components-vue';
 *
 * const coreClient = useCoreClient();
 *
 * // Use the client for API calls
 * const factors = await coreClient.value?.myAccountClient.mfa.listFactors();
 * </script>
 * ```
 */
export function useCoreClient(): Ref<CoreClientInterface | null> {
  const coreClient = inject(CoreClientKey);

  if (coreClient === undefined) {
    throw new Error(
      'useCoreClient must be used within Auth0ComponentsProvider. ' +
        'Make sure you have installed the Auth0ComponentsPlugin or wrapped your app with Auth0ComponentsProvider.',
    );
  }

  return coreClient;
}
