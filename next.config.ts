import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  assetPrefix: '/',
  poweredByHeader: false,
  // If you're using images
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;