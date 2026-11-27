/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Separate build dirs let the regression-test server run beside the dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  images: {
    formats: ['image/webp'],
    deviceSizes: [384, 640, 828, 1080, 1280, 1920],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

module.exports = nextConfig;
