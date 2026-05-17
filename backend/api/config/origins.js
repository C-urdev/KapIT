const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');

const isKapitPreviewOrigin = (origin) =>
  String(process.env.ALLOW_KAPIT_NETLIFY_PREVIEW || '').trim().toLowerCase() === 'true'
    && /^https:\/\/(?:[^.]+\.)?kapitdev\.netlify\.app$/i.test(origin);

const splitOrigins = (value) =>
  String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const isLoopbackOrigin = (value) => {
  try {
    const parsed = new URL(normalizeOrigin(value));
    return ['localhost', '127.0.0.1', '[::1]'].includes(String(parsed.hostname || '').toLowerCase());
  } catch (_error) {
    return false;
  }
};

const getAllowedOrigins = () =>
  {
    const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
    const localOrigins = isProduction
      ? []
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
        ];

    return [
      process.env.CLIENT_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      ...splitOrigins(process.env.CORS_ALLOWED_ORIGINS),
      ...localOrigins,
    ]
      .map(normalizeOrigin)
      .filter(Boolean);
  };

module.exports = {
  normalizeOrigin,
  isKapitPreviewOrigin,
  isLoopbackOrigin,
  getAllowedOrigins,
};
