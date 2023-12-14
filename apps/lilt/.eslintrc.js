module.exports = {
  env: {
    node: true,
    commonjs: true
  },
  extends: [
    'plugin:prettier/recommended',
    require.resolve('@contentful/eslint-config-extension'),
    require.resolve('@contentful/eslint-config-extension/jest'),
    require.resolve('@contentful/eslint-config-extension/jsx-a11y'),
    require.resolve('@contentful/eslint-config-extension/react')
  ],
  rules: {
    'react/no-did-mount-set-state': 'off'
  }
};
