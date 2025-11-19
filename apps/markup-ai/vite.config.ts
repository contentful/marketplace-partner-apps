import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          contentful: ['@contentful/app-sdk', '@contentful/react-apps-toolkit', '@contentful/f36-components'],
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
