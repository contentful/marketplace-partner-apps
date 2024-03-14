import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: '', // relative paths
  build: {
    outDir: 'build'
  },
  server: {
    port: 3001,
  },
  plugins: [
    react({ jsxImportSource: '@emotion/react' }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ["test/setup.ts"]
  },
}));
