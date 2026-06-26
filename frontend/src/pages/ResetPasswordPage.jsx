import useViewportMode from './useViewportMode';
import DesktopResetPasswordPage from './desktop/auth/ResetPasswordPage';
import MobileResetPasswordPage from './mobile/auth/ResetPasswordPage';

export default function ResetPasswordPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopResetPasswordPage : MobileResetPasswordPage;
  return <Page />;
}
