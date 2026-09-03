/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/ml/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ]
  },
}

export default nextConfig
