'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getStoredUser, logoutUser, updateStoredUser } from '@sharedServices/authService';

export default function SessionGate({ children, redirectTo = '/auth/login', requiredAccountType = null }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const storedUser = getStoredUser();
      if (!cancelled && storedUser) {
        setUser(storedUser);
      }

      try {
        const data = await getCurrentUser();
        if (cancelled) {
          return;
        }

        const nextUser = data?.user || null;
        if (!nextUser) {
          if (!storedUser) {
            await logoutUser();
            router.replace(redirectTo);
          }
          setUser(storedUser || null);
          return;
        }

        if (requiredAccountType && nextUser.accountType !== requiredAccountType && nextUser.type !== requiredAccountType) {
          router.replace(nextUser.accountType === 'company' || nextUser.type === 'company' ? '/company/dashboard' : '/dashboard/user');
          return;
        }

        setUser(nextUser);
      } catch {
        if (!cancelled) {
          if (!storedUser) {
            await logoutUser();
            router.replace(redirectTo);
          }
          setUser(storedUser || null);
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
  }, [redirectTo, requiredAccountType, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dad7cd] dark:bg-[#0a1628] px-6 transition-colors duration-300">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-[#d6d3c9] dark:border-[#24405d]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3a5a40] border-r-[#588157] dark:border-t-[#7fd0ee] dark:border-r-[#3ba9d6] animate-spin" />
        </div>
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
