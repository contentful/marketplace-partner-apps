// @ts-check

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
    },
  },
  {
    ignores: ["build", "coverage", "src/api-client"],
  },
  {
    files: [
      "eslint.config.js",
      "vitest.config.ts",
      "vite.config.ts",
      "openapi-ts.config.ts",
      "scripts/**/*",
    ],
    ...tseslint.configs.disableTypeChecked,
  },
];
