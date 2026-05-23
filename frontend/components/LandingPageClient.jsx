'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from '@shared/hooks/useAppRouter';
import { lazy, Suspense } from 'react';
import LandingPage from '@sharedPages/landing/LandingPage';
import { getCurrentUser, isCompanyAccount } from '@sharedServices/authService';

const SelectAccountTypeModal = lazy(() => import('@sharedComponents/auth/SelectAccountTypeModal'));
const LoginModal = lazy(() => import('@sharedComponents/auth/LoginModal'));

const resolveDashboardPath = (user) => (
  isCompanyAccount(user)
    ? '/company/dashboard'
    : '/dashboard/user'
);

export default function LandingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const shouldOpenAccountTypeModal = searchParams.get('accountTypeModal') === '1';
  const shouldOpenLoginModal = searchParams.get('login') === '1';

  useEffect(() => {
    let cancelled = false;

    const redirectIfAuthenticated = async () => {
      try {
        const data = await getCurrentUser();
        const currentUser = data?.user || null;
        if (!cancelled && currentUser) {
          router.replace(resolveDashboardPath(currentUser));
        }
      } catch {
        // Logged-out visitors should remain on the landing page.
      }
    };

    redirectIfAuthenticated();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (shouldOpenAccountTypeModal) {
      setIsAccountTypeModalOpen(true);
    }
  }, [shouldOpenAccountTypeModal]);

  useEffect(() => {
    if (shouldOpenLoginModal) {
      setIsLoginModalOpen(true);
    }
  }, [shouldOpenLoginModal]);

  const closeAccountTypeModal = () => {
    setIsAccountTypeModalOpen(false);
    if (shouldOpenAccountTypeModal) {
      router.replace('/');
    }
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    if (shouldOpenLoginModal) {
      router.replace('/');
    }
  };

  return (
    <>
      <LandingPage
        onGetStarted={() => setIsAccountTypeModalOpen(true)}
        onJoinDeveloper={() => router.push('/auth/register?type=developer')}
        onSignIn={() => setIsLoginModalOpen(true)}
      />

      <Suspense fallback={null}>
        {isAccountTypeModalOpen ? (
          <SelectAccountTypeModal
            open={isAccountTypeModalOpen}
            onClose={closeAccountTypeModal}
            onSelect={(type) => {
              setIsAccountTypeModalOpen(false);

              if (type === 'login') {
                setIsLoginModalOpen(true);
                return;
              }

              if (type === 'developer') {
                router.push('/auth/register?type=developer');
                return;
              }

              if (type === 'company') {
                router.push('/auth/register?type=company');
              }
            }}
          />
        ) : null}

        {isLoginModalOpen ? (
          <LoginModal
            open={isLoginModalOpen}
            onClose={closeLoginModal}
            onLoginSuccess={(user) => {
              setIsLoginModalOpen(false);
              router.replace(resolveDashboardPath(user));
            }}
            onRegisterClick={() => {
              setIsLoginModalOpen(false);
              setIsAccountTypeModalOpen(true);
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
}
