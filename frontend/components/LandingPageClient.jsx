'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from '@shared/hooks/useAppRouter';
import { lazy, Suspense } from 'react';
import LandingPage from '@sharedPages/landing/LandingPage';
import { getCurrentUser, getStoredUser, isCompanyAccount, updateStoredUser } from '@sharedServices/authService';
import { getSessionSnapshot } from '@sharedServices/apiClient';

const LoginModal = lazy(() => import('@sharedComponents/auth/LoginModal'));

const resolveDashboardPath = (user) => (
  isCompanyAccount(user)
    ? '/company/dashboard'
    : '/dashboard/user'
);

export default function LandingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const shouldOpenLoginModal = searchParams.get('login') === '1';
  const loginError = searchParams.get('authError') === 'accountType' ? 'accountType' : '';

  useEffect(() => {
    let cancelled = false;

    const redirectIfAuthenticated = async () => {
      const storedUser = getStoredUser();
      const { csrfToken } = getSessionSnapshot();
      if (!storedUser && !csrfToken) {
        return;
      }

      try {
        const data = await getCurrentUser();
        const currentUser = data?.user || null;
        if (!cancelled && currentUser) {
          updateStoredUser(currentUser);
          router.replace(resolveDashboardPath(currentUser));
        }
      } catch {
        // If the cached session is stale, leave the landing page and let the
        // normal sign-in flow establish a fresh session.
      }
    };

    redirectIfAuthenticated();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (shouldOpenLoginModal) {
      setIsLoginModalOpen(true);
    }
  }, [shouldOpenLoginModal]);

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    if (shouldOpenLoginModal) {
      router.replace('/');
    }
  };

  return (
    <>
      <LandingPage
        onGetStarted={() => router.push('/auth/register?type=developer')}
        onJoinDeveloper={() => router.push('/auth/register?type=developer')}
        onSignIn={() => setIsLoginModalOpen(true)}
      />

      <Suspense fallback={null}>
        {isLoginModalOpen ? (
          <LoginModal
            open={isLoginModalOpen}
            accountType="developer"
            initialError={loginError}
            onClose={closeLoginModal}
            onLoginSuccess={(user) => {
              setIsLoginModalOpen(false);
              router.replace(resolveDashboardPath(user));
            }}
            onRegisterClick={() => {
              setIsLoginModalOpen(false);
              router.push('/auth/register?type=developer');
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
}
