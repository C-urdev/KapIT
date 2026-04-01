'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AuthPage from '@sharedPages/auth/AuthPage';

export default function AuthPageClient({ initialMode = 'login' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get('type') || null;

  return (
    <AuthPage
      accountType={accountType}
      initialMode={initialMode}
      onBack={() => router.push('/')}
      onRequestAccountType={() => router.push('/auth/register')}
      onBeginSignup={(signupData) => {
        const query = new URLSearchParams();
        if (signupData?.email) query.set('email', signupData.email);
        if (signupData?.username) query.set('username', signupData.username);
        router.push(`/auth/register${query.toString() ? `?${query.toString()}` : ''}`);
      }}
      onLogin={(user) => {
        router.push('/');
      }}
      onWarmRoute={() => {}}
    />
  );
}
