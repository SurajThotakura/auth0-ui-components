import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        proxy: resolve(__dirname, 'src/proxy.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        'vue',
        '@auth0/auth0-vue',
        '@auth0/universal-components-core',
        '@tanstack/vue-query',
        '@vee-validate/zod',
        'vee-validate',
        'zod',
        'reka-ui',
        '@vueuse/core',
        'lucide-vue-next',
        'vue-sonner',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    sourcemap: true,
    minify: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
