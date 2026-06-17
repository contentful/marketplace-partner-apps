import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '', // relative paths
  resolve: {
    alias: {
      // Prevent codemirror from entering the bundle: @contentful/default-field-editors/Field.js
      // statically imports MarkdownEditor from field-editor-markdown, which pulls in codemirror
      // (~400 KB). We render markdown fields as MultipleLineEditor instead (see DefaultField.tsx).
      '@contentful/field-editor-markdown': path.resolve(__dirname, 'src/stubs/field-editor-markdown-stub.ts'),
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 9000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Rich-text editor pulls in Slate.js (~7.7 MB) — isolate it
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
