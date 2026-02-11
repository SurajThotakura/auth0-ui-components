import type { EnhancedTranslationFunction } from '@auth0/universal-components-core';
import { computed, type ComputedRef } from 'vue';

import { useCoreClient } from './use-core-client';

/**
 * Return type for the useTranslator composable.
 */
export interface UseTranslatorReturn {
  /** Enhanced translation function with Trans component support */
  t: ComputedRef<EnhancedTranslationFunction>;
  /** Function to change the current language */
  changeLanguage: (language: string, fallbackLanguage?: string) => Promise<void>;
  /** Current language code */
  currentLanguage: ComputedRef<string>;
  /** Fallback language code */
  fallbackLanguage: ComputedRef<string | undefined>;
}

/**
 * Composable for accessing the i18n service from CoreClient.
 *
 * This composable provides access to the i18n service from the CoreClient context,
 * including enhanced translation functions with component support and language change capabilities.
 *
 * @param namespace - The translation namespace (e.g., 'mfa', 'common')
 * @param overrides - Optional translation overrides for the namespace
 * @returns An object containing the enhanced translator function and changeLanguage function
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTranslator } from '@auth0/universal-components-vue';
 *
 * // Basic usage with namespace only
 * const { t, changeLanguage, currentLanguage } = useTranslator('common');
 *
 * // Usage with overrides
 * const { t: mfaT } = useTranslator('mfa', {
 *   title: 'Custom Title',
 *   'sms.title': 'Text Message'
 * });
 *
 * // Using the basic translator
 * const title = t.value('title');
 * const message = t.value('welcome', { name: 'John' });
 *
 * // Changing language
 * await changeLanguage('es-ES');
 * </script>
 * ```
 */
export function useTranslator(
  namespace: string,
  overrides?: Record<string, unknown>,
): UseTranslatorReturn {
  const coreClient = useCoreClient();

  if (!coreClient.value) {
    throw new Error(
      'useTranslator must be used within Auth0ComponentsProvider with initialized CoreClient',
    );
  }

  const t = computed(() => {
    if (!coreClient.value) {
      throw new Error('CoreClient not initialized');
    }
    return coreClient.value.i18nService.translator(namespace, overrides);
  });

  const changeLanguage = async (language: string, fallbackLanguage?: string): Promise<void> => {
    if (!coreClient.value) {
      throw new Error('CoreClient not initialized');
    }
    await coreClient.value.i18nService.changeLanguage(language, fallbackLanguage);
  };

  const currentLanguage = computed(() => {
    return coreClient.value?.i18nService.currentLanguage ?? 'en-US';
  });

  const fallbackLanguage = computed(() => {
    return coreClient.value?.i18nService.fallbackLanguage;
  });

  return {
    t,
    changeLanguage,
    currentLanguage,
    fallbackLanguage,
  };
}
