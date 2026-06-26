import useViewportMode from './useViewportMode';
import DesktopJobMatchPage from './desktop/user/JobMatchPage';
import MobileJobMatchPage from './mobile/user/JobMatchPage';

export default function JobMatchPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopJobMatchPage : MobileJobMatchPage;
  return <Page />;
}
