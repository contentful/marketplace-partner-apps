import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
       "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error', // Treats Prettier issues as ESLint errors
    },
  },
  eslintConfigPrettier, // Disables ESLint rules that might conflict with Prettier
);