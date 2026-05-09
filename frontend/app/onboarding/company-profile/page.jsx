import CompanyOnboardingClient from '../../../components/CompanyOnboardingClient';

export const metadata = {
  title: 'Company Onboarding',
  description: 'Finish setting up your KapIT company profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyOnboardingPage() {
  return <CompanyOnboardingClient />;
}
