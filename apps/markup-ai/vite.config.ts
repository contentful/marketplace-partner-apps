import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "",
  build: {
    outDir: "build",
    // Increased limit since we're not splitting chunks
    chunkSizeWarningLimit: 3800,
    // Ensure CommonJS modules are properly converted
    // This is required for @contentful/field-editor-shared which uses require()
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "auto",
      ignoreDynamicRequires: false,
    },
    rollupOptions: {
      output: {
        // Don't use manual chunks - let Vite handle chunking naturally
        // This ensures React and react-query are available in the correct load order
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: "localhost",
    port: 3000,
  },
});
