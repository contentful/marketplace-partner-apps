// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      '.agents/**',
      'dist/**',
      'governance-template/**',
      'vendor/**',
      'scripts/copy-assets.js',
      'scripts/check-changelog-governance.mjs',
      'scripts/check-doc-governance.mjs',
      'scripts/check-classifier-governance.mjs',
      'scripts/check-runtime-governance.mjs',
      'scripts/sync-docs.mjs',
    ],
  },
  {
    rules: {
      // Pre-existing patterns — warn only, not errors, to allow gradual cleanup
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'off',
    },
  }
);
