'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import DeveloperProfile from '@sharedPages/onboarding/DeveloperProfileOnboardingPage';
import { logoutUser, updateStoredUser } from '@sharedServices/authService';
import { saveDeveloperProfile } from '@userFeatures/developer/userDeveloperAPI';
import SessionGate from './SessionGate';

export default function DeveloperOnboardingClient() {
  const router = useRouter();
  const handleLogout = async () => {
    await logoutUser();
    router.replace('/');
  };

  return (
    <>
      <SessionGate requiredAccountType="developer" redirectTo="/" allowIncompleteProfile>
        {({ user, setUser }) => (
          <DeveloperProfile
            user={user}
            onLogout={handleLogout}
            onSubmit={async (profileData) => {
              const data = await saveDeveloperProfile(profileData);
              const updatedUser = data?.user
                ? { ...data.user, ...profileData, profileCompleted: true, accountType: 'developer' }
                : { ...user, ...profileData, profileCompleted: true, accountType: 'developer' };

              updateStoredUser(updatedUser);
              setUser(updatedUser);
              router.replace('/dashboard/user');
            }}
          />
        )}
      </SessionGate>
    </>
  );
}
