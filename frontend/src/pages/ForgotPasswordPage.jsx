import useViewportMode from './useViewportMode';
import DesktopForgotPasswordPage from './desktop/auth/ForgotPasswordPage';
import MobileForgotPasswordPage from './mobile/auth/ForgotPasswordPage';

export default function ForgotPasswordPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopForgotPasswordPage : MobileForgotPasswordPage;
  return <Page />;
}
