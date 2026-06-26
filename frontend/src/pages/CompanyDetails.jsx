import useViewportMode from './useViewportMode';
import DesktopCompanyDetails from './desktop/public/CompanyDetails';
import MobileCompanyDetails from './mobile/public/CompanyDetails';

export default function CompanyDetails() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopCompanyDetails : MobileCompanyDetails;
  return <Page />;
}
