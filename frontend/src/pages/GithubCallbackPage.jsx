import useViewportMode from './useViewportMode';
import DesktopGithubCallbackPage from './desktop/auth/GithubCallbackPage';
import MobileGithubCallbackPage from './mobile/auth/GithubCallbackPage';

export default function GithubCallbackPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopGithubCallbackPage : MobileGithubCallbackPage;
  return <Page />;
}
