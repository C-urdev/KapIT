'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, AlertCircle, Eye, EyeOff, GitFork, X } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { createOAuthState, loginUser, loginWithGoogle, loginWithGithub } from '@sharedServices/authService';
import TermsAndConditionsModal from '@sharedComponents/modals/TermsAndConditionsModal';

export default function AuthPage({
  userType,
  accountType,
  socialNoAccountProvider = '',
  onLogin,
  onBeginSignup,
  onRequestAccountType,
  onBack,
  onForgotPassword,
  initialMode = 'login',
  onWarmRoute,
}) {
  const PASSWORD_HINT = 'At least 8 characters with uppercase, lowercase, and a number.';
  const hasValidPasswordShape = (value) => (
    String(value || '').length >= 8
    && /[A-Z]/.test(String(value || ''))
    && /[a-z]/.test(String(value || ''))
    && /\d/.test(String(value || ''))
  );

  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [authTermsOpen, setAuthTermsOpen] = useState(false);
  const [pendingSignupInput, setPendingSignupInput] = useState(null);
  const [termsDecisionError, setTermsDecisionError] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [hasAppliedSocialNoAccountPrompt, setHasAppliedSocialNoAccountPrompt] = useState(false);
  const isLocalAuthBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true';
  const passwordStrength = useMemo(() => {
    const password = String(formData.password || '');
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    return strength;
  }, [formData.password]);
  const passwordStrengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][passwordStrength] || '';
  const passwordStrengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'][passwordStrength] || '';

  const isLoopbackHost = () => {
    const host = String(window.location.hostname || '').trim().toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  };

  useEffect(() => {
    const clearStaleOauthLoading = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      try {
        const pending = window.sessionStorage.getItem('oauth_in_progress');
        if (pending) {
          window.sessionStorage.removeItem('oauth_in_progress');
          setLoading(false);
        }
      } catch {
        // Ignore storage failures.
      }
    };

    window.addEventListener('pageshow', clearStaleOauthLoading);
    window.addEventListener('focus', clearStaleOauthLoading);
    document.addEventListener('visibilitychange', clearStaleOauthLoading);
    clearStaleOauthLoading();

    return () => {
      window.removeEventListener('pageshow', clearStaleOauthLoading);
      window.removeEventListener('focus', clearStaleOauthLoading);
      document.removeEventListener('visibilitychange', clearStaleOauthLoading);
    };
  }, []);

  useEffect(() => {
    setAuthMode(initialMode);
    setError('');
    setInfoMessage('');
    setAuthTermsOpen(false);
    setPendingSignupInput(null);
    setTermsDecisionError('');
    setShowRegisterPrompt(false);
    setHasAppliedSocialNoAccountPrompt(false);
  }, [initialMode]);

  useEffect(() => {
    if (authMode !== 'login' || hasAppliedSocialNoAccountPrompt) {
      return;
    }
    if (!socialNoAccountProvider) {
      return;
    }

    const providerLabel = formatSocialProviderLabel(socialNoAccountProvider);
    setError(`No account is registered for this ${providerLabel} sign-in. Please register first.`);
    setInfoMessage('');
    setShowRegisterPrompt(true);
    setHasAppliedSocialNoAccountPrompt(true);
  }, [authMode, hasAppliedSocialNoAccountPrompt, socialNoAccountProvider]);

  useEffect(() => {
    onWarmRoute?.(authMode === 'signup' ? (accountType || 'developer') : 'login');
  }, [accountType, authMode, onWarmRoute]);

  const signupAccountTypeLabel = accountType === 'company'
    ? 'Company / Client account'
    : accountType === 'developer'
      ? 'IT Professional / Developer account'
      : '';
  const shouldSuggestRegister = (message) => {
    const normalized = String(message || '').trim().toLowerCase();
    return normalized.includes('invalid email or password')
      || normalized.includes('invalid credentials')
      || normalized.includes('user not found');
  };
  function formatSocialProviderLabel(value) {
    return String(value || '').trim().toLowerCase() === 'google'
      ? 'Google'
      : String(value || '').trim().toLowerCase() === 'github'
        ? 'GitHub'
        : 'social';
  }

  const deriveSignupUsername = (email) => {
    const localPart = String(email || '').split('@')[0] || '';
    const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
    if (sanitized.length >= 3) {
      return sanitized;
    }

    const fallbackCore = `user${Date.now().toString().slice(-8)}`.replace(/[^a-zA-Z0-9_]/g, '');
    return fallbackCore.slice(0, 50);
  };

  const handleSignupWithAcceptedTerms = async (signupInput) => {
    if (!signupInput) {
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');
    setTermsDecisionError('');

    try {
      const signupPayload = {
        username: signupInput.username,
        email: signupInput.email,
        password: signupInput.password,
        termsAccepted: true,
        ...(accountType ? { accountType } : {}),
      };

      await onBeginSignup?.(signupPayload);
      setAuthTermsOpen(false);
      setPendingSignupInput(null);
    } catch (err) {
      const rawMessage = String(err?.message || '').trim();
      setTermsDecisionError(rawMessage || 'Unable to create account right now.');
      setError(rawMessage || 'Unable to create account right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setShowRegisterPrompt(false);

    if (authMode === 'signup') {
      if (!accountType) {
        setError('Please choose whether you are looking to hire or looking for a job first.');
        onRequestAccountType?.();
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!hasValidPasswordShape(formData.password)) {
        setError(PASSWORD_HINT);
        return;
      }

      const signupInput = {
        email: String(formData.email || '').trim().toLowerCase(),
        password: String(formData.password || ''),
      };
      signupInput.username = deriveSignupUsername(signupInput.email);

      setPendingSignupInput(signupInput);
      setTermsDecisionError('');
      setAuthTermsOpen(true);
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      await onLogin?.(
        {
          ...data.user,
          type: data.user?.type || userType,
        },
        { isNewUser: false }
      );
    } catch (err) {
      const rawMessage = String(err?.message || '').trim();
      setError(rawMessage || 'Unable to sign in. Please check your email and password.');
      setShowRegisterPrompt(authMode === 'login' && shouldSuggestRegister(rawMessage));
    } finally {
      setLoading(false);
    }
  };
  const getSocialAuthBaseUrl = () => {
    const runtimeOrigin = String(window.location.origin || '').trim().replace(/\/+$/, '');
    const configuredSiteUrl = String(import.meta.env.VITE_SITE_URL || '').trim();
    // In development, always use the exact host the user is currently on
    // (localhost vs 127.0.0.1 must match Google redirect allowlist exactly).
    if (import.meta.env.MODE !== 'production') {
      return runtimeOrigin || configuredSiteUrl.replace(/\/+$/, '');
    }
    const rawBase = configuredSiteUrl || runtimeOrigin;
    return rawBase.replace(/\/+$/, '');
  };

  const redirectToExternalAuth = (url, mode = 'login') => {
    setLoading(true);
    try {
      window.sessionStorage.setItem('oauth_in_progress', '1');
      window.sessionStorage.setItem('oauth_start_mode', mode === 'signup' ? 'signup' : 'login');
    } catch {
      // Ignore storage failures.
    }

    // If browser blocks or interrupts the navigation, quickly release UI lock.
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        try {
          window.sessionStorage.removeItem('oauth_in_progress');
        } catch {
          // Ignore storage failures.
        }
        setLoading(false);
      }
    }, 1500);

    window.location.assign(url);
  };

  const handleGoogleClick = async () => {
    if (loading) {
      return;
    }
    setShowRegisterPrompt(false);
    if (authMode === 'signup' && !accountType) {
      setError('Please choose whether you are looking to hire or looking for a job first.');
      onRequestAccountType?.();
      return;
    }

    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.MODE !== 'production' && isLocalAuthBypassEnabled && isLoopbackHost()) {
      const email = prompt(`[Developer Mode - Missing VITE_GOOGLE_CLIENT_ID]\n\nEnter any existing or new email to simulate logging in with Google:`);
      if (!email) return;
      return handleDeveloperMock('Google', email);
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Client ID is not configured.");
      return;
    }

    setError('');
    setLoading(true);
    let state;
    try {
<<<<<<< HEAD:frontend/modules/shared/pages/auth/AuthPage.jsx
      const oauthState = await createOAuthState({
        provider: 'google',
        mode: authMode,
        accountTypeHint: authMode === 'signup' ? accountType : null,
      });
      state = String(oauthState?.state || '').trim();
      if (!state) {
        throw new Error('Unable to verify social sign-in request. Please try again.');
      }
    } catch (requestError) {
      setLoading(false);
      setError(String(requestError?.message || 'Unable to start Google sign-in right now.'));
      return;
=======
      window.sessionStorage.setItem('oauth_google_state', state);
      window.sessionStorage.setItem(
        'oauth_google_intent',
        JSON.stringify({
          state,
          mode: authMode,
          accountType: accountType || null,
        })
      );
    } catch {
      // Continue without persisted state if storage is unavailable.
>>>>>>> bd8e61b2 (fix(auth): route Google company accounts to company onboarding):apps/web/modules/shared/pages/auth/AuthPage.jsx
    }
    const redirectUri = `${getSocialAuthBaseUrl()}/auth/callback/google`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      state,
      nonce: crypto.randomUUID(),
      prompt: 'select_account',
    });
    redirectToExternalAuth(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, authMode);
  };

  const handleGithubClick = async () => {
    if (loading) {
      return;
    }
    setShowRegisterPrompt(false);
    if (authMode === 'signup' && !accountType) {
      setError('Please choose whether you are looking to hire or looking for a job first.');
      onRequestAccountType?.();
      return;
    }

    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId && import.meta.env.MODE !== 'production' && isLocalAuthBypassEnabled && isLoopbackHost()) {
      const email = prompt(`[Developer Mode - Missing VITE_GITHUB_CLIENT_ID]\n\nEnter any email to simulate logging in with GitHub:`);
      if (!email) return;
      return handleDeveloperMock('GitHub', email);
    }
    if (!clientId) {
      alert("GitHub Client ID is not configured.");
      return;
    }
    setError('');
    setLoading(true);
    let state;
    try {
      const oauthState = await createOAuthState({
        provider: 'github',
        mode: authMode,
        accountTypeHint: authMode === 'signup' ? accountType : null,
      });
      state = String(oauthState?.state || '').trim();
      if (!state) {
        throw new Error('Unable to verify social sign-in request. Please try again.');
      }
    } catch (requestError) {
      setLoading(false);
      setError(String(requestError?.message || 'Unable to start GitHub sign-in right now.'));
      return;
    }
    const redirectUri = `${getSocialAuthBaseUrl()}/auth/callback/github`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    });
    redirectToExternalAuth(`https://github.com/login/oauth/authorize?${params.toString()}`, authMode);
  };

  const handleDeveloperMock = async (provider, email) => {
    if (!isLocalAuthBypassEnabled || !isLoopbackHost()) {
      setError('Local auth bypass is disabled.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const oauthState = await createOAuthState({
        provider: provider === 'Google' ? 'google' : 'github',
        mode: authMode,
        accountTypeHint: authMode === 'signup' ? accountType : null,
      });
      const state = String(oauthState?.state || '').trim();
      if (!state) {
        throw new Error('Unable to verify social sign-in request. Please try again.');
      }

      let data;
      if (provider === 'Google') {
<<<<<<< HEAD:frontend/modules/shared/pages/auth/AuthPage.jsx
        data = await loginWithGoogle('mock-google-' + email.split('@')[0], { state });
=======
        const accountTypeHint = authMode === 'signup' ? (accountType || null) : null;
        data = await loginWithGoogle('mock-google-' + email.split('@')[0], { accountTypeHint });
>>>>>>> bd8e61b2 (fix(auth): route Google company accounts to company onboarding):apps/web/modules/shared/pages/auth/AuthPage.jsx
      } else {
        data = await loginWithGithub('mock-github-' + email.split('@')[0], { state });
      }

      if (data?.success && data?.user) {
        onLogin(
          { ...data.user, type: data.user?.type || userType },
          { isNewUser: data.user.profile_completed === false }
        );
      } else {
        setError(data?.message || `Failed to sign in with ${provider}`);
      }
    } catch (err) {
      setError(String(err?.message || `An error occurred with ${provider} sign-in`));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#a3b18a] dark:border-[#353c44] bg-white dark:bg-[#121416]">
        <div className="mx-auto flex w-full max-w-[min(100%,1700px)] items-center justify-between px-6 py-4 sm:px-8 lg:px-10 xl:px-12 2xl:px-14">
          <button onClick={onBack} className="flex items-center gap-2 text-[#344e41] dark:text-[#d0d7dd] hover:text-[#3a5a40] dark:hover:text-white">
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

      {/* Auth Form */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#121416] dark:to-[#22272b]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#22272b] rounded-2xl border border-[#a3b18a] dark:border-[#353c44] p-5 sm:p-8 shadow-lg dark:shadow-[#6f9b74]/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              {authMode === 'signup' && signupAccountTypeLabel ? (
                <p className="text-sm font-medium text-[#5f6f52] dark:text-[#d0d7dd]">
                  {signupAccountTypeLabel}
                </p>
              ) : null}
            </div>

            {/* Error Message */}
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
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    setShowRegisterPrompt(false);
                  }}
                  className="w-full px-4 py-2 border border-[#a3b18a] dark:border-[#444d57] rounded-lg bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      setShowRegisterPrompt(false);
                    }}
                    className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#444d57] rounded-lg bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {authMode === 'signup' && formData.password ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div
                          key={value}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            value <= passwordStrength ? passwordStrengthColor : 'bg-[#e5e7eb] dark:bg-[#444d57]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#6b7280] dark:text-[#adb5be]">{passwordStrengthLabel}</p>
                  </div>
                ) : null}
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-[#3a5a40] dark:text-[#d0d7dd] mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 pr-12 border border-[#a3b18a] dark:border-[#444d57] rounded-lg bg-white dark:bg-[#1a1d20] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] focus:border-transparent outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-[#3a5a40] dark:text-[#adb5be] hover:text-[#344e41] dark:hover:text-white"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password ? (
                    <p
                      className={`mt-1 text-xs ${
                        formData.password === formData.confirmPassword
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  ) : null}
                </div>
              )}

              {authMode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => onForgotPassword?.()}
                    className="text-sm text-[#588157] dark:text-[#6f9b74] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <span className="w-1/5 border-b border-gray-300 dark:border-gray-600 lg:w-1/4"></span>
              <span className="text-xs text-center text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">or continue with</span>
              <span className="w-1/5 border-b border-gray-300 dark:border-gray-600 lg:w-1/4"></span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleClick}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-[#f0f5f1] dark:bg-[#353c44] hover:bg-[#e2e8e4] dark:hover:bg-[#353c44] border border-[#a3b18a] dark:border-[#444d57] rounded-lg transition-colors disabled:opacity-50 text-[#344e41] dark:text-gray-200 font-medium"
              >
                <svg className="w-5 h-5 mr-2 -ml-1" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleGithubClick}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-[#f0f5f1] dark:bg-[#353c44] hover:bg-[#e2e8e4] dark:hover:bg-[#353c44] border border-[#a3b18a] dark:border-[#444d57] rounded-lg transition-colors disabled:opacity-50 text-[#344e41] dark:text-gray-200 font-medium"
              >
                <GitFork className="w-5 h-5 mr-2 -ml-1" />
                GitHub
              </button>
            </div>

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
                    setInfoMessage('');
                    setShowRegisterPrompt(false);
                    return;
                  }

                  setAuthMode('login');
                  setError('');
                  setInfoMessage('');
                  setShowRegisterPrompt(false);
                }}
                className="text-sm text-[#344e41] dark:text-[#d0d7dd]"
              >
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-[#588157] dark:text-[#6f9b74] hover:underline font-semibold">
                  {authMode === 'login' ? 'Register' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {showRegisterPrompt ? (
        <div className="fixed right-4 top-20 z-40 w-[min(92vw,360px)] sm:right-6 sm:top-24">
          <div
            role="dialog"
            aria-label="Register account prompt"
            className="relative rounded-2xl border border-[#8fa87d] bg-white p-4 shadow-[0_16px_34px_rgba(27,42,29,0.18)] ring-1 ring-[#d8e5d0] dark:border-[#4f5d52] dark:bg-[#22272b] dark:ring-[#314236]"
          >
            <button
              type="button"
              onClick={() => setShowRegisterPrompt(false)}
              aria-label="Close register prompt"
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5f6f52] transition-colors hover:bg-[#f0f5f1] hover:text-[#2a3d2f] dark:text-[#adb5be] dark:hover:bg-[#31363d] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mt-1 text-base font-semibold text-[#2a3d2f] dark:text-white">No account found for this sign in.</h3>
            <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d0d7dd]">
              Register an account first, then sign in.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterPrompt(false);
                  setError('');
                  setInfoMessage('');
                  if (!accountType) {
                    onRequestAccountType?.();
                    return;
                  }
                  setAuthMode('signup');
                }}
                className="rounded-lg bg-[#d69d1a] px-4 py-2 text-sm font-semibold text-[#2b1b00] transition-colors hover:bg-[#bf8a11] dark:bg-[#f2cf6d] dark:text-[#3d2b00] dark:hover:bg-[#f7d982]"
              >
                Register Account
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Auth-level Terms Modal Overlay */}
      <TermsAndConditionsModal
        isOpen={authTermsOpen}
        onClose={() => {
          if (loading) return;
          setAuthTermsOpen(false);
          setTermsDecisionError('');
        }}
        showDecisionActions
        onDecline={() => {
          if (loading) return;
          setAuthTermsOpen(false);
          setPendingSignupInput(null);
          setTermsDecisionError('');
        }}
        onAgree={() => handleSignupWithAcceptedTerms(pendingSignupInput)}
        agreeLabel="Agree & Create Account"
        declineLabel="Not Now"
        decisionLoading={loading}
        decisionError={termsDecisionError}
        disableClose={loading}
      />
    </div>
  );
}



