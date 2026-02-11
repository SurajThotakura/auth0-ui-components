import type { CoreClientInterface } from '@auth0/universal-components-core';
import type { InjectionKey, Ref, ShallowRef } from 'vue';

export interface ThemeContext {
  isDarkMode: Ref<boolean>;
}

export interface ScopeManagerContext {
  registerScopes: (api: 'me' | 'my-org', scopes: string) => void;
  ensured: { me: string; 'my-org': string };
}

export interface ToastConfig {
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
  duration?: number;
}

// Core client is provided as a ShallowRef since it's initialized async
export const CORE_CLIENT_KEY: InjectionKey<ShallowRef<CoreClientInterface | undefined>> =
  Symbol('CoreClient');
export const THEME_KEY: InjectionKey<ThemeContext> = Symbol('Theme');
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManagerContext> = Symbol('ScopeManager');
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
