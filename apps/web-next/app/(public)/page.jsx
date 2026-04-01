import LandingPageClient from '../../components/LandingPageClient';

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: 'Home',
    description: 'Find developers, jobs, and company opportunities on KapIT.',
  };
}

export default function MarketingHomePage() {
  return <LandingPageClient />;
}