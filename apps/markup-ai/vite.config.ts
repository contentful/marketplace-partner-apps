import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Read package.json at config-load time so only the values we expose actually
// land in the client bundle (importing it from app code would inline the entire
// manifest, including scripts and devDependencies).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8")) as {
  name: string;
  version: string;
};

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
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
