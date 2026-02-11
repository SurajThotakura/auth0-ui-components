import { inject, reactive } from 'vue';

import { SCOPE_MANAGER_KEY } from '../types/injection-keys';

interface UseScopeManagerReturn {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => void;
  ensured: { me: string; 'my-org': string };
}

export function useScopeManager(): UseScopeManagerReturn {
  const scopeManagerContext = inject(SCOPE_MANAGER_KEY);

  if (!scopeManagerContext) {
    return {
      registerScopes: () => {},
      ensured: reactive({ me: '', 'my-org': '' }),
    };
  }

  return scopeManagerContext;
}
