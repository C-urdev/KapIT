import { lazy, Suspense, useState } from 'react';
import { useRouter } from '@shared/hooks/useAppRouter';
import DesktopPricingPage from './desktop/public/PricingPage';
import MobilePricingPage from './mobile/public/PricingPage';
import { isCompanyAccount } from '@sharedServices/authService';
import useViewportMode from './useViewportMode';

const LoginModal = lazy(() => import('@sharedComponents/auth/LoginModal'));

const resolveDashboardPath = (user) => (
  isCompanyAccount(user) ? '/company/dashboard' : '/dashboard/user'
);

export default function EmployerPricingPage() {
  const router = useRouter();
  const isDesktop = useViewportMode();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const Page = isDesktop ? DesktopPricingPage : MobilePricingPage;

  return (
    <>
      <Page
        audience="company"
        onCreateAccount={() => router.push('/auth/register?type=company')}
        onSignIn={() => setIsLoginModalOpen(true)}
      />

      <Suspense fallback={null}>
        {isLoginModalOpen ? (
          <LoginModal
            open={isLoginModalOpen}
            accountType="company"
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={(user) => {
              setIsLoginModalOpen(false);
              router.replace(resolveDashboardPath(user));
            }}
            onRegisterClick={() => {
              setIsLoginModalOpen(false);
              router.push('/auth/register?type=company');
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
}
