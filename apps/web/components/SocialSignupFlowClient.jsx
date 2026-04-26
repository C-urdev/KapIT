'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle2, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import {
  completeSocialSignup,
  fetchSocialSignupSession,
  isCompanyAccount,
  requestLocalRegistrationBypassToken,
  sendRegistrationOtp,
  verifyRegistrationOtp,
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

const normalizeAccountType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'company') return 'company';
  if (normalized === 'developer' || normalized === 'employee' || normalized === 'user') return 'developer';
  return '';
};

const ACCOUNT_TYPE_OPTIONS = [
  {
    id: 'developer',
    title: 'Looking for a job',
    subtitle: 'Create account (Developer)',
    icon: Briefcase,
  },
  {
    id: 'company',
    title: 'Looking to hire',
    subtitle: 'Create account (Company)',
    icon: Building2,
  },
];

const getAccountTypeLabel = (value) => (value === 'company' ? 'Company' : value === 'developer' ? 'Developer' : '');

export default function SocialSignupFlowClient() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState('loading');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const localAuthBypassEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS === 'true';

  const pageTitle = useMemo(() => {
    if (step === 'verify-otp') return 'Verify your email';
    if (step === 'set-password') return 'Create your password';
    if (step === 'loading') return 'Preparing social signup';
    return 'Choose account type';
  }, [step]);

  const startOtpStep = async (accountTypeValue, emailOverride = '') => {
    const signupEmail = String(emailOverride || session?.email || '').trim().toLowerCase();
    const runtimeIsLocalhost = isLocalhost || (
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1', '::1'].includes(String(window.location.hostname || '').trim().toLowerCase())
    );
    if (!signupEmail) {
      setError('Social signup session is missing. Please start again.');
      setStep('invalid');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    const tryLocalBypass = async () => {
      const bypass = await requestLocalRegistrationBypassToken({ email: signupEmail });
      if (bypass?.success && bypass?.verificationToken) {
        setSelectedAccountType(accountTypeValue);
        setVerificationToken(bypass.verificationToken);
        setStep('set-password');
        setInfo('Localhost bypass is active. Email verification was skipped for this development run.');
        return true;
      }
      return false;
    };

    try {
      if (runtimeIsLocalhost && localAuthBypassEnabled) {
        const bypassed = await tryLocalBypass();
        if (bypassed) {
          return;
        }
      }

      const result = await sendRegistrationOtp({ email: signupEmail });
      if (!result?.success) {
        setError(result?.message || 'Unable to send verification code.');
        return;
      }
      setSelectedAccountType(accountTypeValue);
      setStep('verify-otp');
      setInfo(`We sent a 6-digit code to ${signupEmail}.`);
    } catch (requestError) {
      const requestMessage = String(requestError?.message || '');
      const missingEmailProvider = requestError?.status === 503
        || /email service is not configured|email provider is not configured/i.test(requestMessage);

      if (missingEmailProvider && runtimeIsLocalhost && localAuthBypassEnabled) {
        try {
          const bypassed = await tryLocalBypass();
          if (bypassed) {
            return;
          }
          setError('Localhost bypass is unavailable.');
          return;
        } catch (bypassError) {
          setError(String(bypassError?.message || 'Unable to use localhost bypass right now.'));
          return;
        }
      }

      setError(String(requestError?.message || 'Unable to send verification code right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError('');
      setInfo('');
      try {
        const response = await fetchSocialSignupSession();
        const social = response?.social || {};
        const normalizedEmail = String(social.email || '').trim().toLowerCase();
        if (!normalizedEmail) {
          throw new Error('Social signup session is missing or expired. Please try social sign-in again.');
        }

        const hintedType = normalizeAccountType(social.accountTypeHint);
        setSession({
          provider: String(social.provider || 'social'),
          email: normalizedEmail,
          name: String(social.name || '').trim(),
          accountTypeHint: hintedType,
        });
        setSelectedAccountType(hintedType || '');

        if (hintedType) {
          await startOtpStep(hintedType, normalizedEmail);
          return;
        }

        setStep('account-type');
      } catch (requestError) {
        setStep('invalid');
        setError(String(requestError?.message || 'Social signup session is missing or expired. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');
  }, []);

  const handleChooseAccountType = async (accountTypeValue) => {
    await startOtpStep(accountTypeValue);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }

    if (!session?.email) {
      setError('Social signup session is missing. Please start again.');
      setStep('invalid');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const result = await verifyRegistrationOtp({ email: session.email, code: otpCode });
      if (!result?.success || !result?.verificationToken) {
        setError(result?.message || 'Invalid verification code.');
        return;
      }
      setVerificationToken(result.verificationToken);
      setStep('set-password');
    } catch (requestError) {
      setError(String(requestError?.message || 'Unable to verify this code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!verificationToken) {
      setError('Verification token is missing. Please verify email again.');
      setStep('verify-otp');
      return;
    }
    if (!selectedAccountType) {
      setError('Please choose an account type.');
      setStep('account-type');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Password and retype password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await completeSocialSignup({
        verificationToken,
        password,
        accountType: selectedAccountType,
      });

      if (!result?.success || !result?.user) {
        setError(result?.message || 'Unable to complete social signup.');
        return;
      }

      router.replace(resolvePostAuthPath(result.user));
    } catch (requestError) {
      setError(String(requestError?.message || 'Unable to complete social signup right now.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
      <div className="bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-8 max-w-md w-full shadow-lg">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3a5a40]/10 dark:bg-[#6f9b74]/10 mb-4">
            {step === 'set-password' ? (
              <Eye className="w-6 h-6 text-[#3a5a40] dark:text-[#6f9b74]" />
            ) : (
              <Mail className="w-6 h-6 text-[#3a5a40] dark:text-[#6f9b74]" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-2">{pageTitle}</h1>
          {session ? (
            <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">
              Continue your {session.provider} sign up for <strong>{session.email}</strong>
              {session.name ? ` (${session.name})` : ''}.
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        {step === 'loading' ? (
          <div className="py-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#3a5a40] dark:text-[#6f9b74]" />
          </div>
        ) : null}

        {step === 'invalid' ? (
          <button
            type="button"
            onClick={() => router.replace('/auth/login')}
            className="w-full h-11 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold rounded-xl transition-all"
          >
            Back to login
          </button>
        ) : null}

        {info ? (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{info}</p>
          </div>
        ) : null}

        {step === 'account-type' ? (
          <div className="space-y-3">
            {ACCOUNT_TYPE_OPTIONS.map(({ id, title, subtitle, icon: Icon }) => (
              <button
                key={id}
                type="button"
                disabled={loading}
                onClick={() => handleChooseAccountType(id)}
                className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                  selectedAccountType === id
                    ? 'border-[#588157] dark:border-[#6f9b74]'
                    : 'border-[#a3b18a] dark:border-[#444d57] hover:border-[#588157] dark:hover:border-[#6f9b74]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f5f1] dark:bg-[#1a1d20]">
                    <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#6f9b74]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#3a5a40] dark:text-white">{title}</span>
                    <span className="block text-xs text-[#5f6f52] dark:text-[#d0d7dd]">{subtitle}</span>
                  </span>
                </div>
              </button>
            ))}
            {selectedAccountType ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#f0f5f1] px-3 py-2 text-xs font-medium text-[#3a5a40] dark:bg-[#1a1d20] dark:text-[#d0d7dd]">
                <CheckCircle2 className="h-4 w-4" />
                Selected account type: {getAccountTypeLabel(selectedAccountType)}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 'verify-otp' ? (
          <div className="space-y-3">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-semibold px-4 py-3 border border-[#a3b18a] dark:border-[#444d57] rounded-xl bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#3a5a40] dark:focus:ring-[#6f9b74] outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="w-full h-12 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => startOtpStep(selectedAccountType)}
              disabled={loading}
              className="w-full text-sm text-[#588157] dark:text-[#6f9b74] hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        ) : null}

        {step === 'set-password' ? (
          <div className="space-y-3">
            {selectedAccountType ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-[#f0f5f1] px-3 py-2 text-xs font-medium text-[#3a5a40] dark:bg-[#1a1d20] dark:text-[#d0d7dd]">
                <CheckCircle2 className="h-4 w-4" />
                Account type: {getAccountTypeLabel(selectedAccountType)}
              </div>
            ) : null}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 pr-11 border border-[#a3b18a] dark:border-[#444d57] rounded-xl bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#3a5a40] dark:focus:ring-[#6f9b74] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40] dark:text-[#adb5be]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Retype password"
                className="w-full px-4 py-3 pr-11 border border-[#a3b18a] dark:border-[#444d57] rounded-xl bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#3a5a40] dark:focus:ring-[#6f9b74] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40] dark:text-[#adb5be]"
                aria-label={showConfirmPassword ? 'Hide retype password' : 'Show retype password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteSignup}
              disabled={loading}
              className="w-full h-12 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
