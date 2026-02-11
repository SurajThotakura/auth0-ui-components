import { inject } from 'vue';

import { TOAST_KEY } from '../types/injection-keys';

export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UseToastReturn {
  notify: (options: ToastOptions) => void;
}

export function showToast(options: ToastOptions): void {
  // This is a placeholder - actual toast implementation would use vue-sonner or similar
  console.log(`[${options.type.toUpperCase()}] ${options.message}`);
}

export function useToast(): UseToastReturn {
  const toastConfig = inject(TOAST_KEY);

  return {
    notify: (options: ToastOptions) => {
      showToast({
        ...options,
        duration: options.duration ?? toastConfig?.duration,
      });
    },
  };
}
