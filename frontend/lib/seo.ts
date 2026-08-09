const FALLBACK_SITE_URL = 'https://kapit.online';

const trimTrailingSlash = (value: unknown): string => String(value || '').trim().replace(/\/+$/, '');

export const SEO_SITE_NAME = 'KapIT';
export const SEO_DEFAULT_TITLE = 'KapIT - AI Job Matching Platform';
export const SEO_DEFAULT_DESCRIPTION =
  'KapIT helps developers and companies match jobs faster with AI-powered hiring and skill-based discovery.';
export const SEO_DEFAULT_IMAGE_PATH = '/kapit-logo.png';
export const SEO_DEFAULT_KEYWORDS = [
  'KapIT',
  'IT jobs',
  'developer jobs',
  'Filipino developers',
  'AI job matching',
  'hire developers',
];

export const getSiteUrl = (): string => {
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_SITE_URL);
  if (configuredUrl) {
    return configuredUrl;
  }
  return FALLBACK_SITE_URL;
};

export const toAbsoluteUrl = (path = '/'): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
};
