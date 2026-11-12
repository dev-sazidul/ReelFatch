import type { NextConfig } from 'next';

// Next.js forwards same-origin API requests. Docker uses the backend service hostname;
// local development uses the API's loopback address.
const apiTarget = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  // Keep normal local builds; Docker copies the minimal standalone server into its image.
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/health', destination: `${apiTarget}/api/health` },
      { source: '/api/videos/:path*', destination: `${apiTarget}/api/videos/:path*` },
    ];
  },
  experimental: {
    // Next.js cuts proxied requests off after 30 seconds of silence by default. The API applies
    // its own timeouts (12 s per Facebook call, 120 s per download), so this is only a backstop.
    proxyTimeout: 300_000,
  },
};

export default nextConfig;
