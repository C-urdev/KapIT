const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');

const isKapitVercelOrigin = (origin) =>
  /^https:\/\/(?:kap-it|kapit-website)(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

const splitOrigins = (value) =>
  String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const getAllowedOrigins = () =>
  [
    process.env.CLIENT_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...splitOrigins(process.env.CORS_ALLOWED_ORIGINS),
    'https://kap-it.vercel.app',
    'https://kapit-website.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

module.exports = {
  normalizeOrigin,
  isKapitVercelOrigin,
  getAllowedOrigins,
};
