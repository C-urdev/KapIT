import useViewportMode from './useViewportMode';
import DesktopUserDashboardPage from './desktop/user/UserDashboardPage';
import MobileUserDashboardPage from './mobile/user/UserDashboardPage';

export default function UserDashboardPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopUserDashboardPage : MobileUserDashboardPage;
  return <Page />;
}
