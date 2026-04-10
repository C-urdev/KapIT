import path from 'path';

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  async rewrites() {
    const expressApiBase = (process.env.EXPRESS_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://127.0.0.1:5001/api').replace(/\/$/, '');
    const fastApiBase = (process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${expressApiBase}/:path*`,
      },
      {
        source: '/fastapi/:path*',
        destination: `${fastApiBase}/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
