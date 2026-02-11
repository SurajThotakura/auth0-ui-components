import { inject, type Ref } from 'vue';

import { THEME_KEY } from '../types/injection-keys';

export function useTheme(): { isDarkMode: Ref<boolean> } {
  const theme = inject(THEME_KEY);

  if (!theme) {
    throw new Error(
      'useTheme must be used within Auth0ComponentProvider. ' +
        'Make sure your component is wrapped with <Auth0ComponentProvider>.',
    );
  }

  return {
    isDarkMode: theme.isDarkMode,
  };
}
