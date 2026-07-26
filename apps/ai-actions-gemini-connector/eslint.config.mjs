import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import * as reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'
import mochaPlugin from 'eslint-plugin-mocha'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,mts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,mts}'], languageOptions: { globals: globals.browser } },
  // @ts-expect-error: TODO: Get to the bottom of this error
  tseslint.configs.strictTypeChecked,
  // @ts-expect-error: TODO: Get to the bottom of this error
  pluginReact.configs.flat['jsx-runtime'],
  mochaPlugin.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx,mts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier,
      'react-hooks': reactHooks,
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',
      'prettier/prettier': ['error', { semi: false }],
      semi: 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // disable `any` checks in tests
    files: ['src/**/*.spec.{ts,tsx}', 'functions/**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  eslintConfigPrettier,
])
