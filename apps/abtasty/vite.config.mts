import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Enables Jest-like global test functions (test, expect)
    environment: 'jsdom', // Simulates a browser for component tests
    setupFiles: './src/setupTests.ts', // Equivalent to Jest's setup file
  },
  base: '',
  build: {
    outDir: 'build',
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // <-- alias pour "@/..."
    },
  },
});
