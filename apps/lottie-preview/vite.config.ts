import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from '@svgr/rollup';
import path from 'path';

export default defineConfig(() => ({
  base: '', // relative paths
  server: {
    port: 3000,
  },
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
