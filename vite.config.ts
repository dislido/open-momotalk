import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

import importTemplate from './scripts/rollup-plugin-import-template.js';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/static',
  plugins: [
    importTemplate(),
    compression({ threshold: 10240, exclude: [/\.(br)$/, /\.(gz)$/] }),
    compression({ threshold: 10240, algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] }),
  ],
  resolve: {
    alias: {
      '@/common/': '/client/common/',
      '@/components/': '/client/components/',
      '@/utils/': '/client/utils/',
      '@/styles/': '/client/styles/',
      '@/shared/': '/shared/',
    },
  },
  build: {
    target: 'ESNext',
    assetsDir: 'build',
    outDir: 'static',
    rollupOptions: {
      input: {
        momotalk: 'client/pages/momotalk/index.html',
      },
    },
  },
}) as UserConfig;
