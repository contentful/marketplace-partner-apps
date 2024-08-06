import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build',
  },
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/vite.setup.ts',
  },
});
