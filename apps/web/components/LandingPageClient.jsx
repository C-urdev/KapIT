'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LandingPage from '@sharedPages/landing/LandingPage';
import { getCurrentUser } from '@sharedServices/authService';

const SelectAccountTypeModal = dynamic(() => import('@sharedComponents/auth/SelectAccountTypeModal'));

const resolveDashboardPath = (user) => (
  user?.accountType === 'company' || user?.type === 'company'
    ? '/company/dashboard'
    : '/dashboard/user'
);

export default function LandingPageClient() {
  const router = useRouter();
  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);

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

  return (
    <>
      <LandingPage
        onGetStarted={() => setIsAccountTypeModalOpen(true)}
        onJoinDeveloper={() => router.push('/auth/register?type=developer')}
        onSignIn={() => router.push('/auth/login')}
      />

      {isAccountTypeModalOpen ? (
        <SelectAccountTypeModal
          open={isAccountTypeModalOpen}
          onClose={() => setIsAccountTypeModalOpen(false)}
          onSelect={(type) => {
            setIsAccountTypeModalOpen(false);

            if (type === 'login') {
              router.push('/auth/login');
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
    </>
  );
}
