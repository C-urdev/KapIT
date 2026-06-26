import useViewportMode from './useViewportMode';
import DesktopPricingPage from './desktop/public/PricingPage';
import MobilePricingPage from './mobile/public/PricingPage';

export default function PricingPage() {
  const isDesktop = useViewportMode();
  const Page = isDesktop ? DesktopPricingPage : MobilePricingPage;
  return <Page />;
}
