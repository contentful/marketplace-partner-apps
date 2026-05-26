import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8")) as {
  name: string;
  version: string;
};

export default defineConfig({
  // Mirror the app's `define` block so build-time constants resolve in specs.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["**/*.spec.tsx"],
    },
  },
});
