import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build',
    rollupOptions: {
      external: ['is-hotkey'],
    },
  },
  plugins: [react()],
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
