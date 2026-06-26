import useViewportMode from './useViewportMode';
import DesktopCompanyOnboardingPage from './desktop/company/CompanyOnboardingPage';
import MobileCompanyOnboardingPage from './mobile/company/CompanyOnboardingPage';

export default function CompanyOnboardingPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopCompanyOnboardingPage : MobileCompanyOnboardingPage;
  return <Page />;
}
