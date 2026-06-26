import useViewportMode from './useViewportMode';
import DesktopGoogleCallbackPage from './desktop/auth/GoogleCallbackPage';
import MobileGoogleCallbackPage from './mobile/auth/GoogleCallbackPage';

export default function GoogleCallbackPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopGoogleCallbackPage : MobileGoogleCallbackPage;
  return <Page />;
}
