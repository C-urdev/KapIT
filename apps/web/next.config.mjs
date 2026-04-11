import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

const normalizeUrl = (value) => String(value || '').trim().replace(/\/$/, '');

const isLocalUrl = (value) => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(value);

const resolveServiceUrl = ({ serverEnvKey, publicEnvKey, devFallback, label }) => {
  const configured = normalizeUrl(process.env[serverEnvKey] || process.env[publicEnvKey]);

  if (!configured) {
    if (isProduction) {
      throw new Error(`${label} is required in production. Set ${serverEnvKey} or ${publicEnvKey}.`);
    }

    return normalizeUrl(devFallback);
  }

  try {
    new URL(configured);
  } catch {
    throw new Error(`${label} is not a valid URL: ${configured}`);
  }

  if (isProduction && isLocalUrl(configured)) {
    throw new Error(`${label} cannot point to localhost in production: ${configured}`);
  }

  return configured;
};

const expressApiBase = resolveServiceUrl({
  serverEnvKey: 'EXPRESS_API_URL',
  publicEnvKey: 'NEXT_PUBLIC_EXPRESS_API_URL',
  devFallback: 'http://127.0.0.1:5001/api',
  label: 'Express API URL',
});

const fastApiBase = resolveServiceUrl({
  serverEnvKey: 'FASTAPI_URL',
  publicEnvKey: 'NEXT_PUBLIC_FASTAPI_URL',
  devFallback: 'http://127.0.0.1:8000',
  label: 'FastAPI URL',
});

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${expressApiBase}/:path*`,
      },
      {
        source: '/ai/:path*',
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
