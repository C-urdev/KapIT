import useViewportMode from './useViewportMode';
import DesktopJobDetailPage from './desktop/public/JobDetailPage';
import MobileJobDetailPage from './mobile/public/JobDetailPage';

export default function JobDetailPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopJobDetailPage : MobileJobDetailPage;
  return <Page />;
}
