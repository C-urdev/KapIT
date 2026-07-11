'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, AlertCircle, Eye, EyeOff, GitFork, X, ArrowLeft } from 'lucide-react';
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
  const [signupStep, setSignupStep] = useState('email'); // 'email' | 'password'
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
    setSignupStep('email');
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

      // Step 1: validate email and advance to password step
      if (signupStep === 'email') {
        const email = String(formData.email || '').trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError('Please enter a valid email address.');
          return;
        }
        setSignupStep('password');
        return;
      }

      // Step 2: validate passwords and proceed to terms
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
        data = await loginWithGoogle('mock-google-' + email.split('@')[0], { state });
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

  const isDarkTheme = theme === 'dark';
  const brandTitleClass = isDarkTheme ? 'text-white' : 'text-[#344e41]';
  const brandLinkClass = isDarkTheme
    ? 'group flex items-center gap-3.5 rounded-full py-1 pr-3 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb995]'
    : 'group flex items-center gap-3.5 rounded-full py-1 pr-3 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40]';
  const logoClass = isDarkTheme
    ? 'h-11 w-11 rounded-xl border border-white/10 bg-white object-contain p-1 shadow-[0_12px_24px_rgba(0,0,0,0.24)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]'
    : 'h-11 w-11 rounded-xl border border-[#d7e2ce] bg-white object-contain p-1 shadow-[0_12px_24px_rgba(58,90,64,0.16)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]';
  const themeToggleClass = isDarkTheme
    ? 'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#202428]/88 text-[#e2e6e9] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition-colors hover:bg-[#2a2f35]'
    : 'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e2ce] bg-white/86 text-[#344e41] shadow-[0_10px_22px_rgba(58,90,64,0.12)] backdrop-blur-xl transition-colors hover:bg-[#eef4ea]';


  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f8faf8] dark:bg-[#121416]">
      {/* Soft background glow effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#a3b18a]/20 blur-[120px] pointer-events-none dark:bg-[#444d57]/10" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#588157]/15 blur-[120px] pointer-events-none dark:bg-[#344e41]/15" />
      <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#dad7cd]/40 blur-[100px] pointer-events-none dark:hidden" />

      {/* Header — matched exactly to SiteTopNav */}
      <header className="absolute inset-x-0 top-5 z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] lg:top-6">
        <div className="landing-desktop-shell relative flex items-center justify-between py-2 lg:gap-8">
          <button type="button" onClick={onBack} className={brandLinkClass} aria-label="Back to home">
            <KapITLogo className={logoClass} />
            <h1 className={`text-[1.24rem] font-bold tracking-[-0.035em] ${brandTitleClass}`}>KapIT</h1>
          </button>
          
          <button
            type="button"
            onClick={toggleTheme}
            className={themeToggleClass}
            aria-label="Toggle theme"
          >
            {isDarkTheme ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        
        {/* Auth Card */}
        <div className="w-full max-w-[420px]">
          <div className="rounded-[24px] bg-white/95 dark:bg-[#1a1d20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.4)] border border-[#a3b18a]/15 dark:border-[#444d57]/30 backdrop-blur-xl px-7 py-9 sm:px-8 sm:py-10">

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/20 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-red-600 dark:text-red-400 leading-snug">{error}</p>
              </div>
            )}

            {infoMessage && (
              <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 rounded-xl">
                <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400 leading-snug">{infoMessage}</p>
              </div>
            )}

            {/* ============================================ */}
            {/* LOGIN MODE — single step                     */}
            {/* ============================================ */}
            {authMode === 'login' && (
              <>
                {/* Header */}
                <div className="text-center mb-7">
                  <h2 className="text-[22px] sm:text-2xl font-semibold text-[#344e41] tracking-tight dark:text-white mb-2">
                    Welcome back
                  </h2>
                  <p className="text-[14px] text-[#3a5a40]/65 dark:text-[#adb5be] leading-relaxed">
                    Sign in to continue to KapIT
                  </p>
                </div>

                {/* Social login */}
                <div className="space-y-2.5 mb-6">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleClick}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#f0f5ef]/60 dark:hover:bg-[#1f2b23]/40 rounded-xl border border-[#a3b18a]/30 dark:border-[#444d57]/35 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGithubClick}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#f0f5ef]/60 dark:hover:bg-[#1f2b23]/40 rounded-xl border border-[#a3b18a]/30 dark:border-[#444d57]/35 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
                  >
                    <GitFork className="w-[18px] h-[18px]" />
                    Continue with GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-x-0 h-px bg-[#a3b18a]/25 dark:bg-[#444d57]/40"></div>
                  <span className="relative bg-white dark:bg-[#1a1d20] px-3 text-[11px] text-[#3a5a40]/50 dark:text-[#adb5be]/50 font-medium uppercase tracking-widest">
                    or
                  </span>
                </div>

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#344e41]/80 dark:text-[#adb5be] mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        setShowRegisterPrompt(false);
                      }}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 bg-[#f8faf8] dark:bg-[#1f2b23]/40 border border-[#a3b18a]/30 dark:border-[#5f8a68]/30 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/35 dark:placeholder:text-[#adb5be]/35 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157]/60 transition-all text-[14px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#344e41]/80 dark:text-[#adb5be] mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({...formData, password: e.target.value});
                          setShowRegisterPrompt(false);
                        }}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-11 bg-[#f8faf8] dark:bg-[#1f2b23]/40 border border-[#a3b18a]/30 dark:border-[#5f8a68]/30 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/35 dark:placeholder:text-[#adb5be]/35 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157]/60 transition-all text-[14px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40]/40 hover:text-[#344e41] dark:text-[#adb5be]/40 dark:hover:text-[#e7f4ea] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => onForgotPassword?.()}
                      className="text-[13px] text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-medium hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#344e41] hover:bg-[#1f3a2a] dark:bg-[#588157] dark:hover:bg-[#344e41] text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[14px] mt-1"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Please wait
                      </span>
                    ) : 'Continue'}
                  </button>
                </form>

                {/* Toggle to signup */}
                <div className="mt-6 text-center text-[14px] text-[#3a5a40]/65 dark:text-[#adb5be]">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      if (!accountType) {
                        onRequestAccountType?.();
                        return;
                      }
                      setAuthMode('signup');
                      setSignupStep('email');
                      setError('');
                      setInfoMessage('');
                      setShowRegisterPrompt(false);
                    }}
                    className="text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-medium hover:underline transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {/* ============================================ */}
            {/* SIGNUP MODE — Step 1: Email + Social         */}
            {/* ============================================ */}
            {authMode === 'signup' && signupStep === 'email' && (
              <>
                {/* Header */}
                <div className="text-center mb-7">
                  <h2 className="text-[22px] sm:text-2xl font-semibold text-[#344e41] tracking-tight dark:text-white mb-2">
                    Create your account
                  </h2>
                  {signupAccountTypeLabel ? (
                    <p className="text-[13px] text-[#588157] dark:text-[#6f9b74] font-medium">
                      {signupAccountTypeLabel}
                    </p>
                  ) : null}
                </div>

                {/* Social login */}
                <div className="space-y-2.5 mb-6">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleClick}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#f0f5ef]/60 dark:hover:bg-[#1f2b23]/40 rounded-xl border border-[#a3b18a]/30 dark:border-[#444d57]/35 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGithubClick}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#f0f5ef]/60 dark:hover:bg-[#1f2b23]/40 rounded-xl border border-[#a3b18a]/30 dark:border-[#444d57]/35 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
                  >
                    <GitFork className="w-[18px] h-[18px]" />
                    Continue with GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-x-0 h-px bg-[#a3b18a]/25 dark:bg-[#444d57]/40"></div>
                  <span className="relative bg-white dark:bg-[#1a1d20] px-3 text-[11px] text-[#3a5a40]/50 dark:text-[#adb5be]/50 font-medium uppercase tracking-widest">
                    or
                  </span>
                </div>

                {/* Email-only form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#344e41]/80 dark:text-[#adb5be] mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        setShowRegisterPrompt(false);
                      }}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 bg-[#f8faf8] dark:bg-[#1f2b23]/40 border border-[#a3b18a]/30 dark:border-[#5f8a68]/30 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/35 dark:placeholder:text-[#adb5be]/35 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157]/60 transition-all text-[14px]"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#344e41] hover:bg-[#1f3a2a] dark:bg-[#588157] dark:hover:bg-[#344e41] text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[14px] mt-1"
                  >
                    Continue
                  </button>
                </form>

                {/* Toggle to login */}
                <div className="mt-6 text-center text-[14px] text-[#3a5a40]/65 dark:text-[#adb5be]">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setSignupStep('email');
                      setError('');
                      setInfoMessage('');
                      setShowRegisterPrompt(false);
                    }}
                    className="text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-medium hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}

            {/* ============================================ */}
            {/* SIGNUP MODE — Step 2: Password               */}
            {/* ============================================ */}
            {authMode === 'signup' && signupStep === 'password' && (
              <>
                {/* Header with back */}
                <div className="mb-7">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('email');
                      setError('');
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3a5a40]/60 dark:text-[#adb5be]/60 hover:text-[#344e41] dark:hover:text-white transition-colors mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <h2 className="text-[22px] sm:text-2xl font-semibold text-[#344e41] tracking-tight dark:text-white mb-2">
                    Set your password
                  </h2>
                  {/* Email display chip */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0f5ef] dark:bg-[#1f2b23]/50 border border-[#a3b18a]/20 dark:border-[#444d57]/30">
                    <span className="text-[13px] text-[#344e41] dark:text-[#e7f4ea] font-medium">{formData.email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSignupStep('email');
                        setError('');
                        setFormData({ ...formData, password: '', confirmPassword: '' });
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className="text-[#3a5a40]/40 hover:text-[#344e41] dark:text-[#adb5be]/40 dark:hover:text-white transition-colors"
                      aria-label="Change email"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Password form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#344e41]/80 dark:text-[#adb5be] mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 pr-11 bg-[#f8faf8] dark:bg-[#1f2b23]/40 border border-[#a3b18a]/30 dark:border-[#5f8a68]/30 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/35 dark:placeholder:text-[#adb5be]/35 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157]/60 transition-all text-[14px]"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40]/40 hover:text-[#344e41] dark:text-[#adb5be]/40 dark:hover:text-[#e7f4ea] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password ? (
                      <div className="mt-2.5 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <div
                              key={value}
                              className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                                value <= passwordStrength ? passwordStrengthColor : 'bg-[#a3b18a]/20 dark:bg-[#444d57]/40'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-[#3a5a40]/50 dark:text-[#adb5be]/50">{passwordStrengthLabel}</p>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#344e41]/80 dark:text-[#adb5be] mb-1.5">Confirm password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Re-enter your password"
                        className="w-full px-4 py-3 pr-11 bg-[#f8faf8] dark:bg-[#1f2b23]/40 border border-[#a3b18a]/30 dark:border-[#5f8a68]/30 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/35 dark:placeholder:text-[#adb5be]/35 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157]/60 transition-all text-[14px]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40]/40 hover:text-[#344e41] dark:text-[#adb5be]/40 dark:hover:text-[#e7f4ea] transition-colors"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password ? (
                      <p
                        className={`mt-1.5 text-[11px] font-medium ${
                          formData.password === formData.confirmPassword
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#344e41] hover:bg-[#1f3a2a] dark:bg-[#588157] dark:hover:bg-[#344e41] text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[14px] mt-1"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Please wait
                      </span>
                    ) : 'Create account'}
                  </button>
                </form>

                {/* Toggle to login */}
                <div className="mt-6 text-center text-[14px] text-[#3a5a40]/65 dark:text-[#adb5be]">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setSignupStep('email');
                      setError('');
                      setInfoMessage('');
                      setShowRegisterPrompt(false);
                    }}
                    className="text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-medium hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}

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
                  setSignupStep('email');
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



