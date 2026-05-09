const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://kapit.online').replace(/\/+$/, '');

export default function sitemap() {
  const now = new Date();
  const entries = [
    '/',
    '/jobs',
  ];

  return entries.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
