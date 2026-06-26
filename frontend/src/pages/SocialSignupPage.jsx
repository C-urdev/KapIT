import useViewportMode from './useViewportMode';
import DesktopSocialSignupPage from './desktop/auth/SocialSignupPage';
import MobileSocialSignupPage from './mobile/auth/SocialSignupPage';

export default function SocialSignupPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopSocialSignupPage : MobileSocialSignupPage;
  return <Page />;
}
