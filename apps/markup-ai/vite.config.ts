import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '',
  resolve: {
    alias: {
      fs: path.resolve(process.cwd(), 'src/shims/empty.ts'),
      path: path.resolve(process.cwd(), 'src/shims/empty.ts'),
      url: path.resolve(process.cwd(), 'src/shims/empty.ts'),
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          contentful: ['@contentful/app-sdk', '@contentful/react-apps-toolkit', '@contentful/f36-components'],
          markup: ['@markupai/toolkit'],
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
