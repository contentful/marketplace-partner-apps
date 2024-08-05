import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitestSetup.js'],
    mockReset: true,
    clearMocks: true,
  },
  resolve: {
    alias: [{ find: '@/', replacement: resolve(__dirname, '../src') }],
  },
});
