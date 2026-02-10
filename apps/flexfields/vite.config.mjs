import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build',
  },
  plugins: [react()],
  resolve: {
    alias: {
      'is-hotkey': path.resolve(__dirname, 'node_modules/is-hotkey'),
    },
  },
  optimizeDeps: {
    include: ['is-hotkey'],
  },
  test: {
    globals: true,
    browser: {
      provider: 'playwright',
      enabled: true,
      headless: true,
      name: 'chromium',
    },
    setupFiles: './test/vite.setup.ts',
  },
});