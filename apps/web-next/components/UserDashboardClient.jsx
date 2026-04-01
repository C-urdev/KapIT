'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomePage from '@userPages/Home/UserHomePage';
import { logoutUser } from '@sharedServices/authService';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import SessionGate from './SessionGate';

export default function UserDashboardClient() {
  const router = useRouter();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logoutUser();
    router.push('/');
  };

  return (
    <>
      <SessionGate requiredAccountType="developer" redirectTo="/">
        {({ user, updateUser }) => (
          <HomePage
            user={user}
            userType={user?.type}
            onOpenHelp={() => {}}
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
