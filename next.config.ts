import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // serverExternalPackages: ['@openai/agents']
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that are not available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        process: false,
      };
    }
    return config;
  },
  // Mark Google APIs packages as server-side only
  serverExternalPackages: [
    '@openai/agents',
    'googleapis',
    'google-auth-library',
    'gaxios',
    'gcp-metadata',
    'gtoken'
  ]
};

export default nextConfig;
