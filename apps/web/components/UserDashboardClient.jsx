'use client';

import UserHomePage from '@userPages/home/UserHomePage';
import { logoutAndRedirect } from '@sharedServices/authService';
import SessionGate from './SessionGate';

export default function UserDashboardClient() {
  const handleLogout = () => {
    logoutAndRedirect('/');
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
