'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@sharedPages/landing/LandingPage';
import { getCurrentUser, getStoredUser } from '@sharedServices/authService';

const resolveDashboardPath = (user) => (
  user?.accountType === 'company' || user?.type === 'company'
    ? '/company/dashboard'
    : '/dashboard/user'
);

export default function LandingPageClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const redirectIfAuthenticated = async () => {
      const storedUser = getStoredUser();
      if (storedUser && !cancelled) {
        router.replace(resolveDashboardPath(storedUser));
        return;
      }

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

  return (
    <LandingPage
      onGetStarted={() => router.push('/auth/register')}
      onJoinDeveloper={() => router.push('/auth/register?type=developer')}
      onSignIn={() => router.push('/auth/login')}
    />
  );
}
