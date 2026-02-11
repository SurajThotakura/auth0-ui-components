import type { CoreClientInterface } from '@auth0/universal-components-core';
import { inject } from 'vue';

import { CORE_CLIENT_KEY } from '../types/injection-keys';

export function useCoreClient(): { coreClient: CoreClientInterface | undefined } {
  const coreClientRef = inject(CORE_CLIENT_KEY);
  return { coreClient: coreClientRef?.value };
}
