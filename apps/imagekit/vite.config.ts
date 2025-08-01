import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  base: '', // relative paths
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['test/setup.ts'],
  },
});
