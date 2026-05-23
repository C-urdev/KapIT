'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@shared/hooks/useAppRouter';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle2, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';
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

const mapSignupErrorMessage = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'Something went wrong. Please try again.';
  }

  const lower = raw.toLowerCase();
  if (lower.includes('validation error at "body.password"') || lower.includes('password')) {
    if (lower.includes('too small') || lower.includes('>=8') || lower.includes('at least 8')) {
      return 'Password must be at least 8 characters long.';
    }
  }
  if (lower.includes('verification token is missing')) {
    return 'Your verification session expired. Please verify your email code again.';
  }
  if (lower.includes('social signup session is missing') || lower.includes('missing or expired')) {
    return 'Your sign-up session expired. Please sign in with Google again.';
  }
  if (lower.includes('unable to send verification code')) {
    return 'We could not send the verification code right now. Please try again.';
  }
  if (lower.includes('invalid verification code')) {
    return 'The verification code is invalid. Please check and try again.';
  }

  return raw;
};

export default function SocialSignupFlowClient() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState('loading');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const localAuthBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true';

  const inputRefs = useRef([]);

  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][strength] || '';
  const strengthColor = [
    '',
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-emerald-400',
    'bg-emerald-500',
  ][strength] || '';

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 6) {
      const next = clean.split('');
      setDigits(next);
      inputRefs.current[5]?.focus();
      return;
    }
    const single = clean.slice(-1);
    const updated = [...digits];
    updated[idx] = single;
    setDigits(updated);
    if (single && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const updated = [...digits];
        updated[idx] = '';
        setDigits(updated);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setDigits(next);
    const lastFilled = Math.min(text.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

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

      setError(mapSignupErrorMessage(requestError?.message || 'Unable to send verification code right now.'));
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
        setError(mapSignupErrorMessage(requestError?.message || 'Social signup session is missing or expired. Please try again.'));
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
    const code = digits.join('');
    if (code.length !== 6) {
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
      const result = await verifyRegistrationOtp({ email: session.email, code });
      if (!result?.success || !result?.verificationToken) {
        setError(result?.message || 'Invalid verification code.');
        return;
      }
      setVerificationToken(result.verificationToken);
      setStep('set-password');
    } catch (requestError) {
      setError(mapSignupErrorMessage(requestError?.message || 'Unable to verify this code.'));
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
      setError(mapSignupErrorMessage(requestError?.message || 'Unable to complete social signup right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
      <div className="bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-8 max-w-md w-full shadow-lg">
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
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0f5f1] dark:bg-[#353c44] mb-4">
                <ShieldCheck className="w-7 h-7 text-[#3a5a40] dark:text-[#6f9b74]" />
              </div>
              <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-1">Enter verification code</h2>
              <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-[#3a5a40] dark:text-[#d0d7dd]">{session?.email || ''}</span>
              </p>
            </div>

            <StepDots step={2} />

            <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handleDigitPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  disabled={loading}
                  className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-xl font-bold border rounded-xl outline-none transition-all
                    ${
                      d
                        ? 'border-[#588157] dark:border-[#6f9b74] bg-[#f0f5f1] dark:bg-[#353c44] text-[#3a5a40] dark:text-[#6f9b74]'
                        : 'border-[#a3b18a] dark:border-[#444d57] bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white'
                    }
                    focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ width: '2.75rem', height: '3.5rem' }}
                  autoComplete="off"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || digits.join('').length !== 6}
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
            <div className="text-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep('account-type')}
                className="inline-flex items-center gap-1 text-sm text-[#588157] dark:text-[#6f9b74] hover:underline font-medium disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign up
              </button>
            </div>
          </div>
        ) : null}

        {step === 'set-password' ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0f5f1] dark:bg-[#353c44] mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#3a5a40] dark:text-[#6f9b74]" />
              </div>
              <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-1">Set your password</h2>
              <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">Create a strong password for your new account.</p>
            </div>

            <StepDots step={3} />

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

            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength ? strengthColor : 'bg-[#e5e7eb] dark:bg-[#444d57]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6b7280] dark:text-[#adb5be]">{strengthLabel}</p>
              </div>
            )}

            <div className="relative mt-4">
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
            
            {confirmPassword && password && (
              <p
                className={`mt-1 text-xs ${
                  password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            <p className="text-xs text-[#6b7280] dark:text-[#adb5be] mt-2 mb-4">
              At least 8 characters with uppercase, lowercase, and a number.
            </p>

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

function StepDots({ step = 1 }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {[1, 2, 3].map((value) => (
        <span
          key={value}
          className={`h-2.5 w-2.5 rounded-full ${step >= value ? 'bg-[#588157] dark:bg-[#6f9b74]' : 'bg-[#d6d3c9] dark:bg-[#444d57]'}`}
        />
      ))}
    </div>
  );
}
