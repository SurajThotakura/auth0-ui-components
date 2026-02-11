import { ref, type Ref } from 'vue';

/**
 * Error state interface.
 */
export interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Return type for the useErrorHandler composable.
 */
export interface UseErrorHandlerReturn {
  /** Current error state, null if no error */
  error: Ref<ErrorState | null>;
  /** Handle an error (logs and stores it) */
  handleError: (error: unknown, context?: string) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Whether there is currently an error */
  hasError: Ref<boolean>;
}

/**
 * Composable for handling errors consistently across components.
 *
 * Provides error handling utilities including:
 * - Error state management
 * - Consistent error formatting
 * - Error logging
 *
 * @returns Error handling utilities
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useErrorHandler } from '@auth0/universal-components-vue';
 *
 * const { error, handleError, clearError, hasError } = useErrorHandler();
 *
 * async function fetchData() {
 *   try {
 *     await someApiCall();
 *   } catch (e) {
 *     handleError(e, 'fetchData');
 *   }
 * }
 * </script>
 *
 * <template>
 *   <div v-if="hasError" class="error">
 *     {{ error?.message }}
 *     <button @click="clearError">Dismiss</button>
 *   </div>
 * </template>
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const error = ref<ErrorState | null>(null);

  const handleError = (err: unknown, context?: string): void => {
    let errorState: ErrorState;

    if (err instanceof Error) {
      errorState = {
        message: err.message,
        code: (err as Error & { code?: string }).code,
        details: err,
      };
    } else if (typeof err === 'string') {
      errorState = { message: err };
    } else {
      errorState = {
        message: 'An unexpected error occurred',
        details: err,
      };
    }

    // Log the error with context
    console.error(`[Auth0 Components${context ? ` - ${context}` : ''}]:`, err);

    error.value = errorState;
  };

  const clearError = (): void => {
    error.value = null;
  };

  const hasError = ref(false);

  // Update hasError when error changes
  // Note: In a real implementation, you'd use watchEffect or computed
  // For simplicity, we're using a getter pattern here
  Object.defineProperty(hasError, 'value', {
    get: () => error.value !== null,
    set: () => {}, // No-op setter
  });

  return {
    error,
    handleError,
    clearError,
    hasError,
  };
}
