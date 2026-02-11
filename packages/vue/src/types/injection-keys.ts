import type { CoreClientInterface } from '@auth0/universal-components-core';
import type { InjectionKey, Ref, ShallowRef } from 'vue';

// ─────────────────────────────────────────────────────────────
// Core Client
// ─────────────────────────────────────────────────────────────

/**
 * Provides access to the CoreClient for API calls, i18n, and auth.
 * Initialized asynchronously in provider, so it's a ShallowRef.
 */
export const CORE_CLIENT_KEY: InjectionKey<ShallowRef<CoreClientInterface | null>> =
  Symbol('CoreClient');

// ─────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────

export interface ThemeContext {
  /** Reactive dark mode state */
  isDarkMode: Ref<boolean>;
}

/**
 * Provides theme state for components.
 */
export const THEME_KEY: InjectionKey<ThemeContext> = Symbol('Theme');

// ─────────────────────────────────────────────────────────────
// Scope Manager
// ─────────────────────────────────────────────────────────────

export interface ScopeManagerContext {
  /**
   * Register required scopes for an API.
   * Called by WithOrganizationService and WithAccountService.
   */
  registerScopes: (api: 'me' | 'my-org', scopes: string) => Promise<void>;

  /**
   * Currently ensured scopes per API.
   */
  ensured: {
    me: string;
    'my-org': string;
  };

  /**
   * True when all registered scopes have been ensured.
   */
  isReady: Ref<boolean>;
}

/**
 * Manages OAuth scope registration and validation.
 */
export const SCOPE_MANAGER_KEY: InjectionKey<ScopeManagerContext> = Symbol('ScopeManager');

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────

export interface ToastConfig {
  /** Toast position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Default duration in milliseconds */
  duration?: number;
}

/**
 * Configuration for toast notifications.
 */
export const TOAST_KEY: InjectionKey<ToastConfig> = Symbol('Toast');
