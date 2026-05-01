/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@agent-bridge/core'],
};

export default nextConfig;
