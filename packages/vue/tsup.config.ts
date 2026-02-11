import { defineConfig } from 'tsup';
import vue from 'unplugin-vue/esbuild';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    proxy: 'src/proxy.ts',
  },
  format: ['esm', 'cjs'],
  dts: false, // Disable DTS generation due to Vue SFC issues, use vue-tsc separately
  sourcemap: true,
  clean: true,
  minify: true,
  external: [
    'vue',
    'vue-router',
    '@auth0/auth0-vue',
    'vee-validate',
    '@vee-validate/zod',
    'reka-ui',
  ],
  esbuildPlugins: [vue()],
});
