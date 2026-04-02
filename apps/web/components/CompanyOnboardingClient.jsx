'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import CompanyProfileOnboarding from '@sharedPages/onboarding/CompanyProfileOnboardingPage';
import { logoutUser, updateStoredUser } from '@sharedServices/authService';
import { saveCompanyProfileOnboarding } from '@companyFeatures/companyAPI';
import SessionGate from './SessionGate';

export default function CompanyOnboardingClient() {
  const router = useRouter();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logoutUser();
    router.replace('/');
  };

  return (
    <>
      <SessionGate requiredAccountType="company" redirectTo="/" allowIncompleteProfile>
        {({ user, setUser }) => (
          <CompanyProfileOnboarding
            user={user}
            onLogout={() => setLogoutConfirmOpen(true)}
            onSubmit={async (profileData) => {
              const data = await saveCompanyProfileOnboarding(profileData);
              const updatedUser = data?.user
                ? { ...data.user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' }
                : { ...user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' };

              updateStoredUser(updatedUser);
              setUser(updatedUser);
              router.replace('/company/dashboard');
            }}
          />
        )}
      </SessionGate>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="Are you sure to log out?"
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        tone="danger"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
