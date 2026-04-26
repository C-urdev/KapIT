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
    const redirectToSafeLogin = () => {
      router.replace('/auth/login?authError=social');
    };

    const oauthError = searchParams.get('error');
    if (oauthError) {
      redirectToSafeLogin();
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      redirectToSafeLogin();
      return;
    }

    const processLogin = async () => {
      try {
        const data = await loginWithGithub(code, { state });
        if (data?.success && data?.user) {
          router.replace(resolvePostAuthPath(data.user));
        } else {
          setError('Unable to complete sign-in. Please try again.');
        }
      } catch (error) {
        const responseCode = String(error?.data?.code || '').trim();
        if (responseCode === 'SOCIAL_ACCOUNT_NOT_REGISTERED') {
          router.replace('/auth/social-signup');
          return;
        }
        if (responseCode === 'SOCIAL_SIGNUP_ACCOUNT_TYPE_MISMATCH') {
          setError('This email is already used by a different account type. Please use another email for this signup path.');
          return;
        }
        if (responseCode === 'SOCIAL_SIGNUP_EMAIL_ALREADY_USED') {
          setError('This email is already registered. Please sign in with your existing account.');
          return;
        }
        if (responseCode === 'OAUTH_STATE_INVALID') {
          redirectToSafeLogin();
          return;
        }
        setError('Unable to complete sign-in. Please try again.');
      }
    };

    processLogin();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
        <div className="bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-8 max-w-sm w-full shadow-lg text-center">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121416]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3a5a40] dark:text-[#6f9b74] animate-spin" />
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
