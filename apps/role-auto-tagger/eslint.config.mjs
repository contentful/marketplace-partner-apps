/**
 * ESLint exists here for ONE bug class above all: a React hook called after an early return. That is a
 * runtime crash — React error #310, a white-screened config screen in a customer's space — and `tsc`
 * cannot see it. It has happened in a sibling app, from a `useMemo` added below `if (loading) return …`.
 * `eslint-plugin-react-hooks` catches it statically; a hand-rolled scan does not, because a file-wide
 * search for "a hook after a return" drowns in false positives from returns inside nested callbacks.
 *
 * Deliberately WITHOUT `typescript-eslint`: its latest release caps TypeScript below 6.1 and this repo
 * is on 7, so installing it would mean either downgrading TypeScript or forcing an unsupported peer
 * combination whose parser reads TS internals. The type-aware rules it adds are largely what
 * `npm run typecheck` already does; the hook rule is the part nothing else provides.
 *
 * The parser is Babel's rather than `@typescript-eslint/parser`, and that is forced: the latter THROWS
 * on import under TypeScript 7 ("does not support TS 7.0"), which is a hard block rather than a
 * conservative peer range — verified by installing it and calling it. Babel parses TypeScript syntax
 * without the TypeScript compiler at all, so it is unaffected by that version dance, and syntax is all
 * a hook-order rule needs.
 */
import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['build/**', 'node_modules/**', 'coverage/**'] },

  {
    files: ['src/**/*.{ts,tsx}', 'tools/**/*.{ts,mts}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        // No babel.config.js in this repo — Vite handles the build — so config lookup is disabled and
        // the syntax plugins are named directly. It has to be `parserOpts.plugins`: passing
        // `@babel/preset-typescript` as a preset, which is the form the docs lead with, is silently
        // IGNORED here and every TS file then fails on `interface`. Measured both ways.
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript', 'jsx'] },
        },
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // `tsc` owns unused/undefined for TypeScript and understands types, interfaces and enums, which
      // the core rules read as undefined globals. Left to the compiler rather than duplicated badly.
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The reason this config exists. An error, not a warning: it is a crash, not a style opinion.
      'react-hooks/rules-of-hooks': 'error',
      // A stale closure is a real bug — a dependency list missing an entry is how a config screen reads
      // yesterday's parameters — but it is advisory because an intentional omission is sometimes right.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
