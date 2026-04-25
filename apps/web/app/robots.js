const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://kapit.online').replace(/\/+$/, '');

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/auth/callback/', '/onboarding/', '/premium/payment'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
