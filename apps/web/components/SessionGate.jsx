'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getStoredUser,
  getUserAccountType,
  isCompanyAccount,
  logoutUser,
  normalizeAccountType,
  updateStoredUser,
} from '@sharedServices/authService';

const resolveDashboardPath = (user) =>
  isCompanyAccount(user) ? '/company/dashboard' : '/dashboard/user';

const resolveOnboardingPath = (user) =>
  isCompanyAccount(user)
    ? '/onboarding/company-profile'
    : '/onboarding/developer-profile';

export default function SessionGate({
  children,
  redirectTo = '/auth/login',
  requiredAccountType = null,
  allowIncompleteProfile = false,
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const storedUser = getStoredUser();
      if (!cancelled && storedUser) {
        setUser(storedUser);

        if (!allowIncompleteProfile && storedUser.profileCompleted === false) {
          router.replace(resolveOnboardingPath(storedUser));
          setLoading(false);
          return;
        }
      }

      try {
        const data = await getCurrentUser();
        if (cancelled) {
          return;
        }

        const nextUser = data?.user || null;
        if (!nextUser) {
          await logoutUser();
          setUser(null);
          router.replace(redirectTo);
          return;
        }

        const requiredType = normalizeAccountType(requiredAccountType);
        const userType = getUserAccountType(nextUser);
        if (requiredType && userType !== requiredType) {
          router.replace(resolveDashboardPath(nextUser));
          return;
        }

        if (!allowIncompleteProfile && nextUser.profileCompleted === false) {
          router.replace(resolveOnboardingPath(nextUser));
          return;
        }

        setUser(nextUser);
      } catch {
        if (!cancelled) {
          await logoutUser();
          setUser(null);
          router.replace(redirectTo);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [allowIncompleteProfile, redirectTo, requiredAccountType, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <p className="text-base font-semibold text-[#344e41]">Loading</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children({
    user,
    setUser,
    updateUser(updates) {
      const nextUser = updateStoredUser(updates || {});
      setUser(nextUser);
      return nextUser;
    },
  });
}
