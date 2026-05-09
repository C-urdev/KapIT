'use client';

import SessionGate from './SessionGate';
import { UserPremiumPaymentWindow } from '@userPages/premium/UserPremiumPopup';

export default function UserPremiumPaymentClient() {
  return (
    <SessionGate requiredAccountType="developer" redirectTo="/">
      {({ user, setUser }) => (
        <UserPremiumPaymentWindow
          user={user}
          onUpgrade={async (nextUserPayload) => {
            const nextUser = nextUserPayload || user;
            setUser(nextUser);
            return nextUser;
          }}
        />
      )}
    </SessionGate>
  );
}
