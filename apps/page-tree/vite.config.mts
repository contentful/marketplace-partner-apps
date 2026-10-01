import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",

      // ONLY measure your app code
      include: ["src/**/*.{ts,tsx}"],

      // EXCLUDE stuff that will always skew coverage
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "src/**/__mocks__/**",
        "src/**/*.d.ts",
        "src/index.tsx",
        "src/App.tsx",
        "src/locations/*.tsx", // location screens (covered by manual smoke tests)
        "src/locations/page/components/PageShell.tsx", // layout only
        "src/locations/page/components/InfoPopover.tsx",
        "src/locations/page/hook.ts",
        "src/locations/page/styles.ts",
        "src/components/LocalhostWarning.tsx", // dev-only scaffold
        "test/**",
        "**/*.config.*",
        "**/eslint.config.*",
        "**/vite.config.*",
      ],

      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },

  base: "",
  build: { outDir: "build" },
  server: { host: "localhost", port: 3000 },
});
