import LandingPageClient from '../../components/LandingPageClient';
import {
  getSiteUrl,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_IMAGE_PATH,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_TITLE,
  SEO_SITE_NAME,
  toAbsoluteUrl,
} from '../../lib/seo';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: {
      absolute: SEO_DEFAULT_TITLE,
    },
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: SEO_DEFAULT_KEYWORDS,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: toAbsoluteUrl('/'),
      siteName: SEO_SITE_NAME,
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [SEO_DEFAULT_IMAGE_PATH],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [SEO_DEFAULT_IMAGE_PATH],
    },
  };
}

export default function MarketingHomePage() {
  const siteUrl = getSiteUrl();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_SITE_NAME,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/jobs?query={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SEO_SITE_NAME,
      url: siteUrl,
      logo: toAbsoluteUrl(SEO_DEFAULT_IMAGE_PATH),
      description: SEO_DEFAULT_DESCRIPTION,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient />
    </>
  );
}
