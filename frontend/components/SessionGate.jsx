'use client';

import { useCallback, useLayoutEffect, useState } from 'react';
import { useRouter } from '@shared/hooks/useAppRouter';
import {
  acceptTermsAndConditions,
  clearAuthStateLocally,
  getCurrentUser,
  getStoredUser,
  getUserAccountType,
  isCompanyAccount,
  logoutUser,
  normalizeAccountType,
  updateStoredUser,
} from '@sharedServices/authService';
import TermsAndConditionsModal from '@sharedComponents/modals/TermsAndConditionsModal';
import PageSkeleton from './shared/PageSkeleton';

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
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsActionLoading, setTermsActionLoading] = useState(false);
  const [termsActionError, setTermsActionError] = useState('');

  const routeAfterTermsAccepted = useCallback((nextUser) => {
    if (!allowIncompleteProfile && nextUser?.profileCompleted === false) {
      router.replace(resolveOnboardingPath(nextUser));
      return;
    }
  }, [allowIncompleteProfile, router]);

  useLayoutEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const storedUser = getStoredUser();
      const requiredType = normalizeAccountType(requiredAccountType);

      if (!cancelled && storedUser) {
        const storedUserType = getUserAccountType(storedUser);
        if (requiredType && storedUserType !== requiredType) {
          router.replace(resolveDashboardPath(storedUser));
          setLoading(false);
          return;
        }

        setUser(storedUser);
        const needsTermsConsent = !storedUser.termsAccepted;
        setTermsModalOpen(needsTermsConsent);
        if (!needsTermsConsent) {
          routeAfterTermsAccepted(storedUser);
        }
        // Keep validating with backend before rendering protected children.
      }

      try {
        const data = await getCurrentUser();
        if (cancelled) {
          return;
        }

        const nextUser = data?.user || null;
        if (!nextUser) {
          clearAuthStateLocally();
          setUser(null);
          router.replace(redirectTo);
          return;
        }

        // Fix: Update local storage with fresh user data from backend immediately.
        // This prevents infinite redirect loops where storedUser has one account type
        // and the backend has another.
        updateStoredUser(nextUser);

        const userType = getUserAccountType(nextUser);
        if (requiredType && userType !== requiredType) {
          router.replace(resolveDashboardPath(nextUser));
          return;
        }

        setUser(nextUser);
        const needsTermsConsent = !nextUser.termsAccepted;
        setTermsModalOpen(needsTermsConsent);
        if (!needsTermsConsent) {
          routeAfterTermsAccepted(nextUser);
        }
      } catch {
        if (!cancelled) {
          clearAuthStateLocally();
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
  }, [allowIncompleteProfile, redirectTo, requiredAccountType, routeAfterTermsAccepted, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return null;
  }

  const handleAgreeToTerms = async () => {
    setTermsActionLoading(true);
    setTermsActionError('');

    try {
      const data = await acceptTermsAndConditions();
      const nextUser = data?.user || null;

      if (!nextUser) {
        throw new Error('Unable to confirm terms consent.');
      }

      setUser(nextUser);
      setTermsModalOpen(false);
      routeAfterTermsAccepted(nextUser);
    } catch (error) {
      setTermsActionError(String(error?.message || 'Unable to save your terms consent right now.'));
    } finally {
      setTermsActionLoading(false);
    }
  };

  const handleDeclineTerms = async () => {
    setTermsActionLoading(true);
    setTermsActionError('');

    try {
      await logoutUser();
    } finally {
      setTermsActionLoading(false);
      setUser(null);
      router.replace(redirectTo);
    }
  };

  return (
    <>
      {children({
        user,
        setUser,
        updateUser(updates) {
          const nextUser = updateStoredUser(updates || {});
          setUser(nextUser);
          return nextUser;
        },
      })}
      <TermsAndConditionsModal
        isOpen={termsModalOpen}
        onClose={() => {}}
        showDecisionActions
        onAgree={handleAgreeToTerms}
        onDecline={handleDeclineTerms}
        decisionLoading={termsActionLoading}
        decisionError={termsActionError}
        disableClose
      />
    </>
  );
}
