import useViewportMode from './useViewportMode';
import DesktopJobsPage from './desktop/public/JobsPage';
import MobileJobsPage from './mobile/public/JobsPage';

export default function JobsPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopJobsPage : MobileJobsPage;
  return <Page />;
}
