/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle the font files into the serverless function output so they can be
  // read at runtime via fs (process.cwd()/assets/fonts/*).
  experimental: {
    // resvg ships a native .node addon; keep it out of the webpack bundle.
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
    outputFileTracingIncludes: {
      '/api/**': ['./assets/fonts/**'],
    },
  },
  async rewrites() {
    return [
      { source: '/svg', destination: '/api/code' },
      { source: '/gif', destination: '/api/code/gif' },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
