module.exports = {
  presets: [
    '@babel/preset-flow',
    '@babel/preset-env',
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
