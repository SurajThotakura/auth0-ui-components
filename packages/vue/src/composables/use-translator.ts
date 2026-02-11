import type { EnhancedTranslationFunction } from '@auth0/universal-components-core';
import { computed } from 'vue';

import { useCoreClient } from './use-core-client';

export function useTranslator<T extends Record<string, unknown> = Record<string, unknown>>(
  namespace: string,
  overrides: T = {} as T,
): { t: EnhancedTranslationFunction } {
  const { coreClient } = useCoreClient();

  const translator = computed(() => {
    if (!coreClient) {
      // Return a no-op translator if coreClient is not available
      return ((key: string) => key) as EnhancedTranslationFunction;
    }
    return coreClient.i18nService.translator(namespace, overrides);
  });

  return {
    t: translator.value,
  };
}
