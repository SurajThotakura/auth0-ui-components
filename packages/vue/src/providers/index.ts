import type { AuthDetails, I18nInitOptions } from '@auth0/universal-components-core';

import type { ToastConfig } from '../types/injection-keys';

export { default as Auth0ComponentProvider } from './Auth0ComponentProvider.vue';
export { default as Auth0ProxyComponentProvider } from './Auth0ProxyComponentProvider.vue';

export interface ThemeSettings {
  mode?: 'light' | 'dark';
  theme?: 'default' | 'minimal' | 'rounded';
}

export interface Auth0ComponentProviderProps {
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  i18n?: I18nInitOptions;
  themeSettings?: ThemeSettings;
  toastSettings?: ToastConfig;
}

export interface Auth0ProxyComponentProviderProps {
  authDetails: Omit<AuthDetails, 'contextInterface'>;
  i18n?: I18nInitOptions;
  themeSettings?: ThemeSettings;
  toastSettings?: ToastConfig;
}
