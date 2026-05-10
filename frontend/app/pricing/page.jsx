import PricingPageClient from '../../components/PricingPageClient';
import { SEO_DEFAULT_IMAGE_PATH, SEO_SITE_NAME, toAbsoluteUrl } from '../../lib/seo';

export const metadata = {
  title: 'Pricing',
  description: 'Explore KapIT pricing plans for developers, teams, and enterprise hiring workflows.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteUrl('/pricing'),
    siteName: SEO_SITE_NAME,
    title: 'Pricing | KapIT',
    description: 'Explore KapIT pricing plans for developers, teams, and enterprise hiring workflows.',
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | KapIT',
    description: 'Explore KapIT pricing plans for developers, teams, and enterprise hiring workflows.',
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}

