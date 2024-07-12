module.exports = {
  extends: '@monogram/eslint-config/next',
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.spec.ts', '**/*.test.ts', '**/*.test.tsx', '**/*config.ts'],
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'react/no-unescaped-entities': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    camelcase: 'off',
  },
};
