const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const DEFAULT_LIMITS = Object.freeze({
  maxDepth: 12,
  maxObjectKeys: 120,
  maxTotalKeys: 800,
  maxArrayLength: 200,
  maxStringLength: 8000,
  maxKeyLength: 120,
  maxNodes: 3000,
});

const PROFILE_ROUTES_WITH_IMAGE_PAYLOAD = new Set([
  '/api/developer/profile',
  '/api/company/profile',
  '/api/company/onboarding/profile',
]);

const normalizeRequestPath = (req) => {
  const baseUrl = String(req?.baseUrl || '').trim();
  const path = String(req?.path || '').trim();
  const combined = `${baseUrl}${path}`.trim();
  const raw = String(combined || req?.originalUrl || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }

  const withoutQuery = raw.split('?')[0];
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
};

const isProfileImagePayloadRoute = (req) => {
  const method = String(req?.method || '').trim().toUpperCase();
  if (!['PUT', 'PATCH'].includes(method)) {
    return false;
  }
  return PROFILE_ROUTES_WITH_IMAGE_PAYLOAD.has(normalizeRequestPath(req));
};

const getBodySanitizerLimits = (req) => {
  const limits = {
    maxDepth: toPositiveInteger(process.env.INPUT_MAX_DEPTH, DEFAULT_LIMITS.maxDepth),
    maxObjectKeys: toPositiveInteger(process.env.INPUT_MAX_OBJECT_KEYS, DEFAULT_LIMITS.maxObjectKeys),
    maxTotalKeys: toPositiveInteger(process.env.INPUT_MAX_TOTAL_KEYS, DEFAULT_LIMITS.maxTotalKeys),
    maxArrayLength: toPositiveInteger(process.env.INPUT_MAX_ARRAY_LENGTH, DEFAULT_LIMITS.maxArrayLength),
    maxStringLength: toPositiveInteger(process.env.INPUT_MAX_STRING_LENGTH, DEFAULT_LIMITS.maxStringLength),
    maxKeyLength: toPositiveInteger(process.env.INPUT_MAX_KEY_LENGTH, DEFAULT_LIMITS.maxKeyLength),
    maxNodes: toPositiveInteger(process.env.INPUT_MAX_NODES, DEFAULT_LIMITS.maxNodes),
  };

  if (isProfileImagePayloadRoute(req)) {
    const profileMax = toPositiveInteger(process.env.PROFILE_INPUT_MAX_STRING_LENGTH, 180000);
    limits.maxStringLength = Math.max(limits.maxStringLength, profileMax);
  }

  return limits;
};

module.exports = {
  getBodySanitizerLimits,
};
