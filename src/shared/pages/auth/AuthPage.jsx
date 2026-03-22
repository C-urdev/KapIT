import React, { useEffect, useState } from 'react';
import { Moon, Sun, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { loginUser, registerUser } from '@sharedServices/authService';

export default function AuthPage({
  userType,
  accountType,
  onLogin,
  onBeginSignup,
  onRequestAccountType,
  onBack,
  initialMode = 'login',
}) {
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setAuthMode(initialMode);
    setError('');
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (accountType) {
          const data = await registerUser({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            accountType,
          });

          onLogin(
            {
              ...data.user,
              type: data.user?.type || userType,
              accountType: data.user?.accountType || accountType,
            },
            { isNewUser: true }
          );
        } else {
          onBeginSignup?.({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          });
        }
      } else {
        // Login
        const data = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        onLogin(
          {
            ...data.user,
            type: data.user?.type || userType,
          },
          { isNewUser: false }
        );
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const authSubtitle = (() => {
    const resolved = accountType || userType;
    if (resolved === 'developer' || resolved === 'employee') return 'IT Professional / Developer';
    if (resolved === 'company') return 'Company / Client';
    return 'Sign in or create a new account';
  })();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-[#344e41] dark:text-[#b8d4e8] hover:text-[#3a5a40] dark:hover:text-white">
            <span className="text-2xl font-bold text-[#3a5a40] dark:text-white">kapIT</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </header>

      {/* Auth Form */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#0a1628] dark:to-[#162842]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#162842] rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] p-5 sm:p-8 shadow-lg dark:shadow-[#3ba9d6]/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[#344e41] dark:text-[#b8d4e8]">
                {authSubtitle}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg bg-white dark:bg-[#0f2139] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] focus:border-transparent outline-none transition-colors"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#b8d4e8] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg bg-white dark:bg-[#0f2139] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] focus:border-transparent outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#b8d4e8] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg bg-white dark:bg-[#0f2139] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] focus:border-transparent outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#7d9ab8] hover:text-[#344e41] dark:hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#b8d4e8] mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg bg-white dark:bg-[#0f2139] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] focus:border-transparent outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#7d9ab8] hover:text-[#344e41] dark:hover:text-white"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'login' && (
                <div className="text-right">
                  <button type="button" className="text-sm text-[#588157] dark:text-[#3ba9d6] hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  if (authMode === 'login') {
                    if (!accountType) {
                      onRequestAccountType?.();
                      return;
                    }
                    setAuthMode('signup');
                    setError('');
                    return;
                  }

                  setAuthMode('login');
                  setError('');
                }}
                className="text-sm text-[#344e41] dark:text-[#b8d4e8]"
              >
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-[#588157] dark:text-[#3ba9d6] hover:underline font-semibold">
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



