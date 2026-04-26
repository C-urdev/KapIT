import LandingPageClient from '../../components/LandingPageClient';

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: {
      absolute: 'KapIT - AI Job Matching Platform',
    },
    description:
      'KapIT helps developers and companies match jobs faster with AI-powered hiring and skill-based discovery.',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: '/',
      siteName: 'KapIT',
      title: 'KapIT - AI Job Matching Platform',
      description:
        'KapIT helps developers and companies match jobs faster with AI-powered hiring and skill-based discovery.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KapIT - AI Job Matching Platform',
      description:
        'KapIT helps developers and companies match jobs faster with AI-powered hiring and skill-based discovery.',
    },
  };
}

export default function MarketingHomePage() {
  return <LandingPageClient />;
}
