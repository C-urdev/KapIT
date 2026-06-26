import useViewportMode from './useViewportMode';
import DesktopNotFoundPage from './desktop/public/NotFoundPage';
import MobileNotFoundPage from './mobile/public/NotFoundPage';

export default function NotFoundPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopNotFoundPage : MobileNotFoundPage;
  return <Page />;
}
