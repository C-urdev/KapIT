'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { isCompanyAccount, loginWithGoogle } from '@sharedServices/authService';

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

function parseHashParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  const hash = String(window.location.hash || '').replace(/^#/, '');
  return new URLSearchParams(hash);
}

function GoogleCallbackContent() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = parseHashParams();
    const oauthError = params.get('error');
    if (oauthError) {
      router.replace('/auth/login');
      return;
    }

    const state = params.get('state');
    const idToken = params.get('id_token');
    const expectedState = (() => {
      try {
        return window.sessionStorage.getItem('oauth_google_state');
      } catch {
        return null;
      }
    })();

    if (!idToken) {
      router.replace('/auth/login');
      return;
    }

    if (expectedState && state && expectedState !== state) {
      router.replace('/auth/login');
      return;
    }

    const processLogin = async () => {
      try {
        const accountTypeHint = (() => {
          try {
            const raw = window.sessionStorage.getItem('oauth_google_intent');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.state !== state || parsed.mode !== 'signup') {
              return null;
            }
            const normalized = String(parsed.accountType || '').trim().toLowerCase();
            return normalized === 'company' || normalized === 'developer' ? normalized : null;
          } catch {
            return null;
          }
        })();

        const data = await loginWithGoogle(idToken, { accountTypeHint });
        if (data?.success && data?.user) {
          try {
            window.sessionStorage.removeItem('oauth_google_state');
            window.sessionStorage.removeItem('oauth_google_intent');
          } catch {
            // Ignore if storage is unavailable.
          }
          router.replace(resolvePostAuthPath(data.user));
          return;
        }
        setError(data?.message || 'Google authentication failed.');
      } catch {
        setError('An unexpected error occurred during Google login.');
      }
    };

    processLogin();
  }, [router]);

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

  return <LoadingView />;
}

function LoadingView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121416]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3a5a40] dark:text-[#6f9b74] animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completing Google sign-in...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
