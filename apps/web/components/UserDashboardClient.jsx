'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import UserHomePage from '@userPages/home/UserHomePage';
import { logoutUser } from '@sharedServices/authService';
import SessionGate from './SessionGate';

const ConfirmModal = dynamic(() => import('@sharedComponents/ui/ConfirmModal'));

export default function UserDashboardClient() {
  const handleLogout = async () => {
    await logoutUser();

    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  return (
    <>
      <SessionGate requiredAccountType="developer" redirectTo="/">
        {({ user, updateUser }) => (
          <UserHomePage
            user={user}
            userType={user?.type}
            onOpenHelp={null}
            onLogout={handleLogout}
            onUpdateUser={async (updates) => updateUser(updates)}
          />
        )}
      </SessionGate>

    </>
  );
}
