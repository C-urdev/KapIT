import useViewportMode from './useViewportMode';
import DesktopPrivacyPolicyPage from './desktop/public/PrivacyPolicyPage';
import MobilePrivacyPolicyPage from './mobile/public/PrivacyPolicyPage';

export default function PrivacyPolicyPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopPrivacyPolicyPage : MobilePrivacyPolicyPage;
  return <Page />;
}
