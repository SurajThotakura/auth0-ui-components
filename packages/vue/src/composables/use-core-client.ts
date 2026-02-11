import type { CoreClientInterface } from '@auth0/universal-components-core';
import { inject, type ShallowRef } from 'vue';

import { CORE_CLIENT_KEY } from '../types/injection-keys';

export function useCoreClient(): { coreClient: ShallowRef<CoreClientInterface | null> } {
  const coreClient = inject(CORE_CLIENT_KEY);

  if (coreClient === undefined) {
    throw new Error(
      'useCoreClient must be used within Auth0ComponentProvider. ' +
        'Make sure your component is wrapped with <Auth0ComponentProvider>.',
    );
  }

  return { coreClient };
}
