'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AuthPage from '@sharedPages/auth/AuthPage';
import { isCompanyAccount, normalizeAccountType } from '@sharedServices/authService';

const resolvePostAuthPath = (user) => {
  if (user?.profileCompleted === false) {
    return isCompanyAccount(user)
      ? '/onboarding/company-profile'
      : '/onboarding/developer-profile';
  }

  return isCompanyAccount(user)
    ? '/company/dashboard'
    : '/dashboard/user';
};

export default function AuthPageClient({ initialMode = 'login' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = normalizeAccountType(searchParams.get('type')) || null;
  const normalizedInitialMode = initialMode === 'signup' && !accountType ? 'login' : initialMode;

  return (
    <AuthPage
      accountType={accountType}
      initialMode={normalizedInitialMode}
      onBack={() => router.push('/')}
      onRequestAccountType={() => router.push('/')}
      onBeginSignup={(signupData) => {
        const query = new URLSearchParams();
        if (signupData?.email) query.set('email', signupData.email);
        if (signupData?.username) query.set('username', signupData.username);
        router.push(`/auth/register${query.toString() ? `?${query.toString()}` : ''}`);
      }}
      onLogin={(user) => {
        router.replace(resolvePostAuthPath(user));
      }}
      onWarmRoute={() => {}}
    />
  );
}
