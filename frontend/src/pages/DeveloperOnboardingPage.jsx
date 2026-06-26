import useViewportMode from './useViewportMode';
import DesktopDeveloperOnboardingPage from './desktop/user/DeveloperOnboardingPage';
import MobileDeveloperOnboardingPage from './mobile/user/DeveloperOnboardingPage';

export default function DeveloperOnboardingPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopDeveloperOnboardingPage : MobileDeveloperOnboardingPage;
  return <Page />;
}
