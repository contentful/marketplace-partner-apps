import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build',
    // Warn at 9 MB so we notice before hitting the 10 MB AppBundle API per-file limit.
    // The main chunk previously hit 10,561 KB (over the limit); it was brought down to
    // ~10,485 KB via lazy-loading codemirror/markdown. This guard + manualChunks below
    // keeps headroom visible as deps evolve.
    chunkSizeWarningLimit: 9000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Rich-text editor pulls in Slate.js (~800 KB) — isolate it
          if (id.includes('@contentful/field-editor-rich-text') || id.includes('@udecode/') || id.includes('slate')) {
            return 'vendor-richtext';
          }
          // contentful-management is large and shared; give it its own chunk
          if (id.includes('contentful-management') && !id.includes('@contentful/app-sdk')) {
            return 'vendor-contentful-management';
          }
        },
      },
    },
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/vite.setup.ts',
  },
});
