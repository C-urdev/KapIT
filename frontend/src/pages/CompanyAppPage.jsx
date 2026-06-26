import useViewportMode from './useViewportMode';
import DesktopCompanyAppPage from './desktop/company/CompanyAppPage';
import MobileCompanyAppPage from './mobile/company/CompanyAppPage';

export default function CompanyAppPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopCompanyAppPage : MobileCompanyAppPage;
  return <Page />;
}
