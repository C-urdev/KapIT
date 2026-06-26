import useViewportMode from './useViewportMode';
import DesktopAuthPage from './desktop/auth/AuthPage';
import MobileAuthPage from './mobile/auth/AuthPage';

export default function AuthPage({ mode = 'login' }) {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopAuthPage : MobileAuthPage;
  return <Page mode={mode} />;
}
