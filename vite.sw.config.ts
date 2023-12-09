import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'ESNext',
    outDir: 'static',
    lib: {
      name: 'sw',
      entry: '/client/worker/sw.ts',
      formats: ['es'],
      fileName: 'sw',
    },
    minify: 'esbuild',
    emptyOutDir: false,
  },
}) as UserConfig;
