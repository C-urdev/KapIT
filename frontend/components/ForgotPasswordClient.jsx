'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@shared/hooks/useAppRouter';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  requestLocalPasswordResetBypassToken,
  resetPasswordWithOtp,
} from '@sharedServices/authService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PASSWORD_HINT = 'At least 8 characters with uppercase, lowercase, and a number.';

const hasValidPassword = (v) =>
  /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && v.length >= 8;

const maskEmail = (email) => {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`rounded-full transition-all duration-300 ${
            n === step
              ? 'w-8 h-2.5 bg-[#3a5a40] dark:bg-[#6f9b74]'
              : n < step
              ? 'w-2.5 h-2.5 bg-[#588157] dark:bg-[#82ad86]'
              : 'w-2.5 h-2.5 bg-[#d1d5db] dark:bg-[#444d57]'
          }`}
        />
      ))}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
        isError
          ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
          : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function InputLabel({ children }) {
  return (
    <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">
      {children}
    </label>
  );
}

const inputCls =
  'w-full px-4 py-2.5 border border-[#a3b18a] dark:border-[#444d57] rounded-lg ' +
  'bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white ' +
  'focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

function PrimaryButton({ loading, disabled, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Step 1 — Email ──────────────────────────────────────────────────────────

function StepEmail({ onNext }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetOtp({ email: trimmed });
      onNext(trimmed);
    } catch (err) {
      setError(String(err?.message || 'Unable to send code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0f5f1] dark:bg-[#353c44] mb-4">
          <Mail className="w-7 h-7 text-[#3a5a40] dark:text-[#6f9b74]" />
        </div>
        <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-1">
          Forgot password?
        </h1>
        <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">
          Enter your email and we&apos;ll send a verification code.
        </p>
      </div>

      <StepDots step={1} />

      <Alert type="error" message={error} />

      <div>
        <InputLabel>Email address</InputLabel>
        <input
          id="fp-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>

      <PrimaryButton loading={loading}>
        {loading ? 'Sending code…' : 'Send Verification Code'}
      </PrimaryButton>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="inline-flex items-center gap-1 text-sm text-[#588157] dark:text-[#6f9b74] hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </div>
    </form>
  );
}

// ─── Step 2 — OTP Verify ─────────────────────────────────────────────────────

function StepVerify({ email, onNext, onBack }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const localAuthBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true';
  const inputRefs = useRef([]);

  const code = digits.join('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');
  }, []);

  const handleChange = (idx, val) => {
    // Allow paste of full 6-digit code on any box
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

  const handleKeyDown = (idx, e) => {
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

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setDigits(next);
    const lastFilled = Math.min(text.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyPasswordResetOtp({ email, code });
      if (!data?.success || !data?.resetToken) {
        setError(data?.message || 'Invalid or expired code. Please try again.');
        return;
      }
      onNext(data.resetToken);
    } catch (err) {
      setError(String(err?.message || 'Unable to verify code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await sendPasswordResetOtp({ email });
      setInfo('A new code has been sent to your email.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(String(err?.message || 'Unable to resend code.'));
    } finally {
      setResending(false);
    }
  };

  const handleLocalBypass = async () => {
    if (!isLocalhost) return;

    setError('');
    setInfo('');
    setLoading(true);

    try {
      const data = await requestLocalPasswordResetBypassToken({ email });
      if (!data?.success || !data?.resetToken) {
        setError(data?.message || 'Localhost bypass is unavailable.');
        return;
      }

      onNext(data.resetToken);
    } catch (err) {
      setError(String(err?.message || 'Unable to use localhost bypass.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0f5f1] dark:bg-[#353c44] mb-4">
          <ShieldCheck className="w-7 h-7 text-[#3a5a40] dark:text-[#6f9b74]" />
        </div>
        <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-1">
          Enter verification code
        </h1>
        <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-[#3a5a40] dark:text-[#d0d7dd]">
            {maskEmail(email)}
          </span>
        </p>
      </div>

      <StepDots step={2} />

      <Alert type="error" message={error} />
      <Alert type="success" message={info} />

      {/* OTP boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
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

      <PrimaryButton loading={loading}>
        {loading ? 'Verifying…' : 'Verify Code'}
      </PrimaryButton>
      {isLocalhost && localAuthBypassEnabled ? (
        <button
          type="button"
          onClick={handleLocalBypass}
          disabled={loading || resending}
          className="w-full flex items-center justify-center border border-[#a3b18a] dark:border-[#444d57] bg-[#f8faf7] hover:bg-[#eef3ea] dark:bg-[#1a1d20] dark:hover:bg-[#31363d] text-[#3a5a40] dark:text-[#d0d7dd] font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Localhost Bypass
        </button>
      ) : null}

      <div className="flex items-center justify-end mt-2 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[#588157] dark:text-[#6f9b74] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3 — New Password ────────────────────────────────────────────────────

function StepReset({ resetToken, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][strength] || '';
  const strengthColor = [
    '',
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-emerald-400',
    'bg-emerald-500',
  ][strength] || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!hasValidPassword(password)) {
      setError(PASSWORD_HINT);
      return;
    }

    setLoading(true);
    try {
      const data = await resetPasswordWithOtp({ resetToken, newPassword: password });
      if (!data?.success) {
        setError(data?.message || 'Unable to reset password. Please start over.');
        return;
      }
      onDone();
    } catch (err) {
      setError(String(err?.message || 'Unable to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f0f5f1] dark:bg-[#353c44] mb-4">
          <CheckCircle2 className="w-7 h-7 text-[#3a5a40] dark:text-[#6f9b74]" />
        </div>
        <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-1">
          Set new password
        </h1>
        <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">
          Choose a strong password for your account.
        </p>
      </div>

      <StepDots step={3} />

      <Alert type="error" message={error} />

      {/* New password */}
      <div>
        <InputLabel>New password</InputLabel>
        <div className="relative">
          <input
            id="fp-new-password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} pr-12`}
            required
            autoComplete="new-password"
            disabled={loading}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Strength bar */}
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
      </div>

      {/* Confirm password */}
      <div>
        <InputLabel>Confirm new password</InputLabel>
        <div className="relative">
          <input
            id="fp-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputCls} pr-12`}
            required
            autoComplete="new-password"
            disabled={loading}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
      </div>

      <p className="text-xs text-[#6b7280] dark:text-[#adb5be]">{PASSWORD_HINT}</p>

      <PrimaryButton loading={loading}>
        {loading ? 'Resetting password…' : 'Reset Password'}
      </PrimaryButton>
    </form>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  const router = useRouter();
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 mb-2">
        <CheckCircle2 className="w-9 h-9 text-emerald-500 dark:text-emerald-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-2">Password reset!</h1>
        <p className="text-sm text-[#6b7280] dark:text-[#adb5be]">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
      </div>
      <button
        onClick={() => router.push('/auth/login')}
        className="w-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Continue to Sign In
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ForgotPasswordClient() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // step: 1 | 2 | 3 | 'done'
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#a3b18a] dark:border-[#353c44] bg-white dark:bg-[#121416]">
        <div className="mx-auto flex w-full max-w-[min(100%,1800px)] items-center justify-between px-3 py-4 sm:px-5 lg:px-6 xl:px-7 2xl:px-9">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#344e41] dark:text-[#d0d7dd] hover:text-[#3a5a40] dark:hover:text-white transition-colors"
          >
            <KapITLogo className="h-9 w-9 rounded-lg object-contain bg-white" />
            <span className="text-2xl font-bold text-[#3a5a40] dark:text-white">kapIT</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-[#344e41]" />
            ) : (
              <Sun className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#22272b] rounded-2xl border border-[#a3b18a] dark:border-[#353c44] p-5 sm:p-8 shadow-lg dark:shadow-[#6f9b74]/10 transition-all duration-300">
            {step === 1 && (
              <StepEmail
                onNext={(e) => {
                  setEmail(e);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <StepVerify
                email={email}
                onNext={(token) => {
                  setResetToken(token);
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepReset
                resetToken={resetToken}
                onDone={() => setStep('done')}
              />
            )}
            {step === 'done' && <SuccessScreen />}
          </div>
        </div>
      </main>
    </div>
  );
}
