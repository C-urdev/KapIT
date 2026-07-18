'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRouter, useSearchParams } from '@shared/hooks/useAppRouter';
import EmployerLandingPage from '@sharedPages/employers/EmployerLandingPage';
import { getCurrentUser, getStoredUser, isCompanyAccount, updateStoredUser } from '@sharedServices/authService';
import { getSessionSnapshot } from '@sharedServices/apiClient';

const LoginModal = lazy(() => import('@sharedComponents/auth/LoginModal'));

const resolveDashboardPath = (user) => (
  isCompanyAccount(user) ? '/company/dashboard' : '/dashboard/user'
);

export default function EmployerLandingPageClient() {
  const router = useRouter();
  const location = useLocation();
  const searchParams = useSearchParams();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(searchParams.get('login') === '1');

  useEffect(() => {
    let cancelled = false;

    const redirectIfAuthenticated = async () => {
      const storedUser = getStoredUser();
      const { csrfToken } = getSessionSnapshot();
      if (!storedUser && !csrfToken) return;

      try {
        const data = await getCurrentUser();
        const currentUser = data?.user || null;
        if (!cancelled && currentUser) {
          updateStoredUser(currentUser);
          router.replace(resolveDashboardPath(currentUser));
        }
      } catch {
        // A stale cached session should not block the public employer page.
      }
    };

    void redirectIfAuthenticated();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const hash = String(location.hash || '').replace(/^#/, '');
    if (!hash) return;

    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: 'start' });
    });
  }, [location.hash]);

  const closeLogin = () => {
    setIsLoginModalOpen(false);
    if (searchParams.get('login') === '1') router.replace('/for-employers');
  };

  return (
    <>
      <EmployerLandingPage
        onCreateAccount={() => router.push('/auth/register?type=company')}
        onSignIn={() => setIsLoginModalOpen(true)}
      />

      <Suspense fallback={null}>
        {isLoginModalOpen ? (
          <LoginModal
            open={isLoginModalOpen}
            onClose={closeLogin}
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
