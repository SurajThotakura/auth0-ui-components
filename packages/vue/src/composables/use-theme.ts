import { inject, ref } from 'vue';
import type { Ref } from 'vue';

import { THEME_KEY } from '../types/injection-keys';

interface UseThemeReturn {
  isDarkMode: Ref<boolean>;
  loader?: Ref<unknown>;
}

export function useTheme(): UseThemeReturn {
  const themeContext = inject(THEME_KEY);

  if (!themeContext) {
    return {
      isDarkMode: ref(false),
    };
  }

  return {
    isDarkMode: themeContext.isDarkMode,
  };
}
