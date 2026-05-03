'use client';

import UserHomePage from '@userPages/home/UserHomePage';
import { logoutAndRedirect, updateMyProfile } from '@sharedServices/authService';
import { ToastProvider } from '@sharedComponents/ui/ToastProvider';
import SessionGate from './SessionGate';

const PROFILE_PATCH_FIELDS = new Set([
  'isPremium',
  'username',
  'bio',
  'socials',
  'profileImage',
  'phone',
  'address',
  'name',
  'education',
  'vocationalCourse',
  'desiredJob',
  'birthday',
  'age',
  'sex',
  'companyName',
  'industry',
  'companySize',
  'website',
  'hiringFor',
]);

export default function UserDashboardClient() {
  const handleLogout = () => {
    logoutAndRedirect('/');
  };

  return (
    <ToastProvider>
      <SessionGate requiredAccountType="developer" redirectTo="/">
        {({ user, updateUser }) => (
          <UserHomePage
            user={user}
            userType={user?.type}
            onOpenHelp={null}
            onLogout={handleLogout}
            onUpdateUser={async (updates) => {
              const nextUpdates = updates && typeof updates === 'object' ? updates : {};
              const persistedUpdates = {};
              const localOnlyUpdates = {};

              for (const [key, value] of Object.entries(nextUpdates)) {
                if (PROFILE_PATCH_FIELDS.has(key)) {
                  persistedUpdates[key] = value;
                } else {
                  localOnlyUpdates[key] = value;
                }
              }

              const hasPersistedUpdates = Object.keys(persistedUpdates).length > 0;
              if (!hasPersistedUpdates) {
                return updateUser(localOnlyUpdates);
              }

              const data = await updateMyProfile(persistedUpdates);
              return updateUser({ ...(data?.user || {}), ...localOnlyUpdates });
            }}
          />
        )}
      </SessionGate>
    </ToastProvider>
  );
}
