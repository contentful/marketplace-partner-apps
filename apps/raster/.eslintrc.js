/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  extends: ['next/core-web-vitals', 'airbnb', 'eslint:recommended', 'plugin:@typescript-eslint/recommended', 'eslint-config-prettier'],
  rules: {
    indent: 'off',
    'no-use-before-define': 'off',
    'no-else-return': [
      'error',
      {
        allowElseIf: true,
      },
    ],
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
    'react/jsx-props-no-spreading': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    'react/no-multi-comp': 'error',
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'no-plusplus': [2, { allowForLoopAfterthoughts: true }], // allow ++ only in for loops
    'react/react-in-jsx-scope': 'off', // not needed in next.js
  },
};
