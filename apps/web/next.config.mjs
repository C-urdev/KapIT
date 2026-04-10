import path from 'path';

const isLocalOnlyUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  async rewrites() {
    const isProduction = process.env.NODE_ENV === 'production';
    const expressApiBase = String(process.env.EXPRESS_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL || '').trim().replace(/\/$/, '');
    const fastApiBase = String(process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || '').trim().replace(/\/$/, '');
    const rewrites = [];

    const resolvedExpressApiBase = expressApiBase || (!isProduction ? 'http://127.0.0.1:5001/api' : '');
    const resolvedFastApiBase = fastApiBase || (!isProduction ? 'http://127.0.0.1:8000' : '');

    if (resolvedExpressApiBase && (!isProduction || !isLocalOnlyUrl(resolvedExpressApiBase))) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${resolvedExpressApiBase}/:path*`,
      });
    }

    if (resolvedFastApiBase && (!isProduction || !isLocalOnlyUrl(resolvedFastApiBase))) {
      rewrites.push({
        source: '/fastapi/:path*',
        destination: `${resolvedFastApiBase}/:path*`,
      });
    }

    return rewrites;
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
