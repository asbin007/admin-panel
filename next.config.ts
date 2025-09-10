import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/**", // Allow all paths under this hostname
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // Allow all paths under Cloudinary
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable error pages for static export
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Suppress hydration warnings for browser extensions
  reactStrictMode: true,
  // Fix chunk loading timeout issues
  webpack: (config, { dev, isServer }) => {
    // Fix for module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Fix chunk loading timeout
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: {
            ...config.optimization.splitChunks?.cacheGroups?.default,
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    return config;
  },
  // Add timeout configuration
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
