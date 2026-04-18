import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const isDeploymentBuild = process.env.CI === 'true'
  || process.env.VERCEL === '1'
  || process.env.RENDER === 'true'
  || Boolean(process.env.RAILWAY_ENVIRONMENT);
const deploymentEnvHint =
  'Set it in your deployment provider environment variables (for Vercel: Project Settings -> Environment Variables).';

const normalizeUrl = (value) => String(value || '').trim().replace(/\/$/, '');

const isLocalUrl = (value) => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(value);

const resolveServiceUrl = ({
  serverEnvKey,
  publicEnvKey,
  productionServerEnvKey,
  productionPublicEnvKey,
  devFallback,
  label,
  requiredInProduction = true,
}) => {
  const productionConfigured = isProduction
    ? normalizeUrl(process.env[productionServerEnvKey] || process.env[productionPublicEnvKey])
    : '';
  const configured = productionConfigured || normalizeUrl(process.env[serverEnvKey] || process.env[publicEnvKey]);

  if (!configured) {
    if (isProduction && requiredInProduction && isDeploymentBuild) {
      throw new Error(
        `${label} is required in production deployment. Set ${productionServerEnvKey || serverEnvKey} or ${productionPublicEnvKey || publicEnvKey}. ${deploymentEnvHint}`
      );
    }

    return normalizeUrl(devFallback);
  }

  try {
    new URL(configured);
  } catch {
    throw new Error(`${label} is not a valid URL: ${configured}. ${deploymentEnvHint}`);
  }

  if (isProduction && !requiredInProduction && isLocalUrl(configured)) {
    return '';
  }

  if (isProduction && isLocalUrl(configured) && isDeploymentBuild) {
    throw new Error(`${label} cannot point to localhost in production deployment: ${configured}. ${deploymentEnvHint}`);
  }

  return configured;
};

const expressApiBase = resolveServiceUrl({
  serverEnvKey: 'EXPRESS_API_URL',
  publicEnvKey: 'NEXT_PUBLIC_EXPRESS_API_URL',
  productionServerEnvKey: 'EXPRESS_API_URL_PRODUCTION',
  productionPublicEnvKey: 'NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION',
  devFallback: 'http://127.0.0.1:5001/api',
  label: 'Express API URL',
});

const fastApiBase = resolveServiceUrl({
  serverEnvKey: 'FASTAPI_URL',
  publicEnvKey: 'NEXT_PUBLIC_FASTAPI_URL',
  productionServerEnvKey: 'FASTAPI_URL_PRODUCTION',
  productionPublicEnvKey: 'NEXT_PUBLIC_FASTAPI_URL_PRODUCTION',
  devFallback: '',
  label: 'FastAPI URL',
  requiredInProduction: false,
});

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  devIndicators: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  async rewrites() {
    const rules = [
      {
        source: '/api/:path*',
        destination: `${expressApiBase}/:path*`,
      },
    ];

    if (fastApiBase) {
      rules.push({
        source: '/ai/:path*',
        destination: `${fastApiBase}/:path*`,
      });
    }

    return rules;
  },
};

export default nextConfig;
