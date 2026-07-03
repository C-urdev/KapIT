const normalizeOrigin = (value: unknown): string => String(value || '').trim().replace(/\/+$/, '');

const resolvePreviewFlag = (): boolean =>
  String(process.env.ALLOW_KAPIT_PREVIEW_ORIGIN || '')
    .trim()
    .toLowerCase() === 'true';

const isKapitPreviewOrigin = (origin: string): boolean =>
  resolvePreviewFlag()
    && /^https:\/\/(?:[^.]+\.)?kapitdev\.netlify\.app$/i.test(origin);

const splitOrigins = (value: unknown): string[] =>
  String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const isLoopbackOrigin = (value: string): boolean => {
  try {
    const parsed = new URL(normalizeOrigin(value));
    return ['localhost', '127.0.0.1', '[::1]'].includes(String(parsed.hostname || '').toLowerCase());
  } catch (_error) {
    return false;
  }
};

const getAllowedOrigins = (): string[] =>
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
