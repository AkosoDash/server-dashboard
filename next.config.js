/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/prometheus/:path*',
        destination: `${process.env.PROMETHEUS_URL || 'http://localhost:9090'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
