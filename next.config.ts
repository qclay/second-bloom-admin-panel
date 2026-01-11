import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Enable experimental features for better Docker support
  experimental: {
    // Optimize for Docker builds
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar'],
  },
};

export default nextConfig;
