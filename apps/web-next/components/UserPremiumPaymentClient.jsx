'use client';

import SessionGate from './SessionGate';
import { updateMyProfile } from '@sharedServices/authService';
import { UserPremiumPaymentWindow } from '@userPages/Premium/UserPremiumPopup';

export default function UserPremiumPaymentClient() {
  return (
    <SessionGate requiredAccountType="developer" redirectTo="/">
      {({ user, setUser, updateUser }) => (
        <UserPremiumPaymentWindow
          user={user}
          onUpgrade={async (updates) => {
            const data = await updateMyProfile(updates || {});
            const nextUser = data?.user || updateUser(updates || {});
            setUser(nextUser);
            return nextUser;
          }}
        />
      )}
    </SessionGate>
  );
}
