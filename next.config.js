/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily ignore ESLint during build so we can iterate on TS/type issues
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
