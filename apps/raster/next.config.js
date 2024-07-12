/** @type {import('next').NextConfig} */
const nextConfig = {
  // StrictMode renders components twice (on dev but not production)
  // in order to detect any problems with your code
  // and warn you about them (which can be quite useful).
  reactStrictMode: false,
  output: 'export',
  distDir: 'dist',
};

module.exports = nextConfig;
