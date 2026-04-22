import DeveloperOnboardingClient from '../../../components/DeveloperOnboardingClient';

export const metadata = {
  title: 'Developer Onboarding',
  description: 'Finish setting up your KapIT developer profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeveloperOnboardingPage() {
  return <DeveloperOnboardingClient />;
}
