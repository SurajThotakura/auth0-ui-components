import { computed, type ComputedRef } from 'vue';

import { useCoreClient } from './use-core-client';

export function useTranslator(
  namespace: string,
  customMessages?: Record<string, unknown>,
): { t: ComputedRef<(key: string, params?: Record<string, unknown>) => string> } {
  const { coreClient } = useCoreClient();

  const t = computed(() => {
    if (!coreClient.value) {
      return (_key: string, _params?: Record<string, unknown>) => '';
    }
    return coreClient.value.i18nService.translator(namespace, customMessages);
  });

  return { t };
}
