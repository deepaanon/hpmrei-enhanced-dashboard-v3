/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React Strict Mode to prevent double rendering
  swcMinify: true,
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    NEXT_PUBLIC_DASHBOARD_PASSWORD: process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD,
  },
  // Simple build ID without Date to avoid hydration mismatch
  generateBuildId: async () => {
    return 'hpmrei-v3-stable'
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
