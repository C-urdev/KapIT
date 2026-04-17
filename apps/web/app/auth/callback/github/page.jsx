'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { loginWithGithub, isCompanyAccount } from '@sharedServices/authService';

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

function GithubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('No authorization code received from GitHub.');
      return;
    }

    const processLogin = async () => {
      try {
        const data = await loginWithGithub(code);
        if (data?.success && data?.user) {
          router.replace(resolvePostAuthPath(data.user));
        } else {
          setError(data?.message || 'GitHub authentication failed.');
        }
      } catch (err) {
        setError('An unexpected error occurred during GitHub login.');
      }
    };

    processLogin();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#0a1628] dark:to-[#162842]">
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-2xl p-8 max-w-sm w-full shadow-lg text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Failed</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full h-11 bg-[#3a5a40] hover:bg-[#344e41] text-white font-semibold rounded-xl transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <LoadingView />
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a1628]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3a5a40] dark:text-[#3ba9d6] animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completing GitHub sign-in...</p>
      </div>
    </div>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <GithubCallbackContent />
    </Suspense>
  );
}
