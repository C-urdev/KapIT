'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { resetPasswordWithToken } from '@sharedServices/authService';

const PASSWORD_HINT =
  'Use at least 8 characters with uppercase, lowercase, and a number.';

const hasValidPasswordShape = (value) => (
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && value.length >= 8
);

export default function ResetPasswordPageClient() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!token) {
      setError('This reset link is missing a token. Request a new password reset email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!hasValidPasswordShape(password)) {
      setError(PASSWORD_HINT);
      return;
    }

    setLoading(true);
    try {
      const data = await resetPasswordWithToken({
        token,
        newPassword: password,
      });
      setSuccess(true);
      setInfoMessage(
        data?.message || 'Password has been reset successfully. You can now sign in.'
      );
    } catch (err) {
      setError(String(err?.message || 'Unable to reset password right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#a3b18a] dark:border-[#353c44] bg-white dark:bg-[#121416]">
        <div className="mx-auto flex w-full max-w-[min(100%,1800px)] items-center justify-between px-3 py-4 sm:px-5 lg:px-6 xl:px-7 2xl:px-9">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[#344e41] dark:text-[#d0d7dd] hover:text-[#3a5a40] dark:hover:text-white">
            <KapITLogo className="h-9 w-9 rounded-lg object-contain bg-white" />
            <span className="text-2xl font-bold text-[#3a5a40] dark:text-white">kapIT</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#22272b] rounded-2xl border border-[#a3b18a] dark:border-[#353c44] p-5 sm:p-8 shadow-lg dark:shadow-[#6f9b74]/10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">
                Enter a new password for your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{infoMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#444d57] rounded-lg bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors"
                    required
                    autoComplete="new-password"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading || success}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#444d57] rounded-lg bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors"
                    required
                    autoComplete="new-password"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    disabled={loading || success}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#6b7280] dark:text-[#adb5be]">
                {PASSWORD_HINT}
              </p>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-sm text-[#588157] dark:text-[#6f9b74] hover:underline font-semibold"
              >
                {success ? 'Continue to Sign In' : 'Back to Sign In'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
