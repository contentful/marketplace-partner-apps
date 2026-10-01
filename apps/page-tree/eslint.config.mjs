import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Never lint generated output
  {
    ignores: ["build/**", "coverage/**", "node_modules/**", "*.config.*"],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // keep signal high, noise low
      "@typescript-eslint/no-unused-vars": ["warn"],
      "react/react-in-jsx-scope": "off",
    },
  },
];
