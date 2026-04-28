'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';
import AuthPage from '@sharedPages/auth/AuthPage';
import { 
  isCompanyAccount, 
  normalizeAccountType, 
  registerUser, 
  sendRegistrationOtp, 
  verifyRegistrationOtp,
  requestLocalRegistrationBypassToken,
} from '@sharedServices/authService';

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
  const socialNoAccountProviderRaw = String(searchParams.get('socialNoAccount') || '').trim().toLowerCase();
  const socialNoAccountProvider =
    socialNoAccountProviderRaw === 'google' || socialNoAccountProviderRaw === 'github'
      ? socialNoAccountProviderRaw
      : '';
  const normalizedInitialMode = initialMode === 'signup' && !accountType ? 'login' : initialMode;

  const [pendingSignup, setPendingSignup] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const localAuthBypassEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS === 'true';

  const completeRegistration = async (signupData, verificationToken) => {
    const data = await registerUser({
      username: signupData.username,
      email: signupData.email,
      password: signupData.password,
      accountType: signupData.accountType || accountType || 'developer',
      verificationToken,
      termsAccepted: signupData?.termsAccepted === true,
    });

    if (data?.user) {
      router.replace(resolvePostAuthPath(data.user));
      return;
    }

    throw new Error(data?.message || 'Failed to register account.');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleBeginSignup = async (signupData) => {
    setLoading(true);
    setError('');
    try {
      const res = await sendRegistrationOtp({ email: signupData.email });
      if (res.success) {
        setPendingSignup(signupData);
        return;
      }

      const otpMessage = String(res?.message || 'Unable to send verification code right now.').trim();
      if (isLocalhost && localAuthBypassEnabled) {
        const bypassRes = await requestLocalRegistrationBypassToken({ email: signupData.email });
        if (!bypassRes?.success || !bypassRes?.verificationToken) {
          throw new Error(bypassRes?.message || otpMessage);
        }
        await completeRegistration(signupData, bypassRes.verificationToken);
        return;
      }

      throw new Error(otpMessage);
    } catch (err) {
      throw new Error(String(err?.message || 'Unable to send verification code right now.'));
    } finally {
      setLoading(false);
    }
  };

  const registerWithVerifiedToken = async (verificationToken) => {
    await completeRegistration(pendingSignup, verificationToken);
  };

  const verifyAndRegister = async () => {
    if (otpCode.length < 6) return;
    setLoading(true);
    setError('');
    
    try {
      const verifyRes = await verifyRegistrationOtp({ email: pendingSignup.email, code: otpCode });
      if (!verifyRes.success || !verifyRes.verificationToken) {
        setError(verifyRes.message || 'Invalid verification code.');
        return;
      }

      await registerWithVerifiedToken(verifyRes.verificationToken);
    } catch (err) {
      setError(String(err?.message || 'An error occurred during verification.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLocalhostBypass = async () => {
    if (!pendingSignup || !isLocalhost) return;

    setLoading(true);
    setError('');

    try {
      const bypassRes = await requestLocalRegistrationBypassToken({ email: pendingSignup.email });
      if (!bypassRes?.success || !bypassRes?.verificationToken) {
        setError(bypassRes?.message || 'Localhost bypass is unavailable.');
        return;
      }

      await registerWithVerifiedToken(bypassRes.verificationToken);
    } catch (err) {
      setError(String(err?.message || 'Unable to bypass verification on localhost.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingSignup || resending || resendCooldown > 0) return;

    setResending(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await sendRegistrationOtp({ email: pendingSignup.email });
      if (!response?.success) {
        throw new Error(response?.message || 'Unable to resend code right now.');
      }
      setInfoMessage('A new verification code has been sent to your email.');
      setResendCooldown(30);
      setOtpCode('');
    } catch (err) {
      setError(String(err?.message || 'Unable to resend code right now.'));
    } finally {
      setResending(false);
    }
  };

  if (pendingSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
        <div className="bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-8 max-w-sm w-full shadow-lg">
          <button 
            onClick={() => setPendingSignup(null)}
            disabled={loading}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sign up
          </button>
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3a5a40]/10 dark:bg-[#6f9b74]/10 mb-4">
              <Mail className="w-6 h-6 text-[#3a5a40] dark:text-[#6f9b74]" />
            </div>
            <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-2">Verify your email</h2>
            <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">
              We sent a verification code to <strong className="font-medium text-gray-900 dark:text-gray-200">{pendingSignup.email}</strong>. 
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{infoMessage}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtpCode(val);
                if (val.length === 6 && !loading) {
                  // We simulate hitting submit automatically on 6th char or wait for button
                }
              }}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-semibold px-4 py-3 border border-[#a3b18a] dark:border-[#444d57] rounded-xl bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#3a5a40] dark:focus:ring-[#6f9b74] outline-none transition-colors"
            />
            
            <button
              onClick={verifyAndRegister}
              disabled={loading || otpCode.length !== 6}
              className="w-full h-12 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
            </button>
            <div className="mt-1 flex items-center justify-center text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || resending || resendCooldown > 0}
                className="text-[#588157] dark:text-[#6f9b74] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
            {isLocalhost && localAuthBypassEnabled ? (
              <button
                type="button"
                onClick={handleLocalhostBypass}
                disabled={loading}
                className="w-full h-11 border border-[#a3b18a] dark:border-[#444d57] bg-[#f8faf7] hover:bg-[#eef3ea] dark:bg-[#1a1d20] dark:hover:bg-[#31363d] text-[#3a5a40] dark:text-[#d0d7dd] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Localhost Bypass
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#121416]/50 flex items-center justify-center backdrop-blur-[2px]">
          <Loader2 className="w-10 h-10 text-[#3a5a40] dark:text-[#6f9b74] animate-spin" />
        </div>
      )}
      <AuthPage
        accountType={accountType}
        initialMode={normalizedInitialMode}
        socialNoAccountProvider={socialNoAccountProvider}
        onBack={() => router.push('/')}
        onRequestAccountType={() => router.push('/?accountTypeModal=1')}
        onForgotPassword={() => router.push('/forgot-password')}
        onBeginSignup={handleBeginSignup}
        onLogin={(user) => {
          router.replace(resolvePostAuthPath(user));
        }}
        onWarmRoute={() => {}}
      />
    </div>
  );
}
