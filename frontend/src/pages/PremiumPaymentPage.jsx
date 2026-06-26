import useViewportMode from './useViewportMode';
import DesktopPremiumPaymentPage from './desktop/user/PremiumPaymentPage';
import MobilePremiumPaymentPage from './mobile/user/PremiumPaymentPage';

export default function PremiumPaymentPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopPremiumPaymentPage : MobilePremiumPaymentPage;
  return <Page />;
}
