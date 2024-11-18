/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  assetPrefix: '.',
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
};

module.exports = nextConfig;
