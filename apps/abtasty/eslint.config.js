import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    ignores: ["dist/**", "node_modules/**"],
    languageOptions: {
      parser: tseslint.parser, // 👈 use TS parser
      parserOptions: {
        project: "./tsconfig.json", // 👈 optional, for type-aware linting
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin, // 👈 add TS plugin
    },
    rules: {
      "prefer-const": "warn",
      "no-constant-binary-expression": "error",
      // TS-specific rules (you can add more later)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);