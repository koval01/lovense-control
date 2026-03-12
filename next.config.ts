import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'production'
    ? {
        experimental: {
          optimizePackageImports: ['lucide-react'],
        },
      }
    : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, { dev, isServer }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    // Keep custom chunking on the client in production only.
    // In dev, custom splitChunks can break Next's internal runtime/module mapping.
    if (!dev && !isServer && config.optimization?.splitChunks) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        minSize: 24000, // 24KB - don't split below this
        maxSize: 100000, // 100KB - allow larger chunks before splitting
        maxAsyncRequests: 15,
        maxInitialRequests: 15,
      };
    }
    return config;
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();
