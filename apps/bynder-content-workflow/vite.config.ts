import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig(() => ({
  base: "", // relative paths
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: "happy-dom",
  },
  build: {
    outDir: 'build',
  },
}));
