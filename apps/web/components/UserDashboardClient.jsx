'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import UserHomePage from '@userPages/home/UserHomePage';
import { logoutUser } from '@sharedServices/authService';
import SessionGate from './SessionGate';

const ConfirmModal = dynamic(() => import('@sharedComponents/ui/ConfirmModal'));

export default function UserDashboardClient() {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
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
            onLogout={() => setLogoutConfirmOpen(true)}
            onUpdateUser={async (updates) => updateUser(updates)}
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
