const isProduction = process.env.NODE_ENV === 'production';

const normalizeUrl = (value) => String(value || '').trim().replace(/\/$/, '');
const isLocalUrl = (value) => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(value);

const resolveApiBase = ({
  label,
  productionServerEnvKey,
  productionPublicEnvKey,
  serverEnvKey,
  publicEnvKey,
  devFallback = '',
  requiredInProduction = true,
}) => {
  const productionConfigured = isProduction
    ? normalizeUrl(process.env[productionServerEnvKey] || process.env[productionPublicEnvKey])
    : '';
  const configured = productionConfigured || normalizeUrl(process.env[serverEnvKey] || process.env[publicEnvKey]);

  if (!configured) {
    if (isProduction && requiredInProduction) {
      throw new Error(
        `${label} is required in production. Set ${productionServerEnvKey} or ${productionPublicEnvKey}.`
      );
    }
    return normalizeUrl(devFallback);
  }

  try {
    new URL(configured);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }

  if (isProduction && isLocalUrl(configured)) {
    if (!requiredInProduction) {
      return '';
    }
    throw new Error(`${label} cannot point to localhost in production.`);
  }

  return configured;
};

const expressApiBase = resolveApiBase({
  label: 'Express API base URL',
  productionServerEnvKey: 'EXPRESS_API_URL_PRODUCTION',
  productionPublicEnvKey: 'NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION',
  serverEnvKey: 'EXPRESS_API_URL',
  publicEnvKey: 'NEXT_PUBLIC_EXPRESS_API_URL',
  devFallback: 'http://127.0.0.1:5001/api',
});

const fastApiBase = resolveApiBase({
  label: 'FastAPI base URL',
  productionServerEnvKey: 'FASTAPI_URL_PRODUCTION',
  productionPublicEnvKey: 'NEXT_PUBLIC_FASTAPI_URL_PRODUCTION',
  serverEnvKey: 'FASTAPI_URL',
  publicEnvKey: 'NEXT_PUBLIC_FASTAPI_URL',
  devFallback: 'http://127.0.0.1:8000',
  requiredInProduction: false,
});

export async function expressFetch(path, options = {}) {
  const response = await fetch(`${expressApiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Express request failed: ${response.status}`);
  }

  return response.json();
}

export async function fastApiFetch(path, options = {}) {
  if (!fastApiBase) {
    throw new Error('FastAPI base URL is not configured.');
  }

  const response = await fetch(`${fastApiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`FastAPI request failed: ${response.status}`);
  }

  return response.json();
}
