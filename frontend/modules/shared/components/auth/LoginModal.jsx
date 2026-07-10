import React, { useState, useEffect } from 'react';
import { X, GitFork, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { createOAuthState, loginUser } from '@sharedServices/authService';

export default function LoginModal({ open, onClose, onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isLocalAuthBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_AUTH_BYPASS === 'true';

  const isLoopbackHost = () => {
    const host = String(window.location.hostname || '').trim().toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  };

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser({ email, password });
      if (data?.user) {
        onLoginSuccess?.(data.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const rawMessage = String(err?.message || '').trim();
      setError(rawMessage || 'Unable to sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const getSocialAuthBaseUrl = () => {
    const runtimeOrigin = String(window.location.origin || '').trim().replace(/\/+$/, '');
    const configuredSiteUrl = String(import.meta.env.VITE_SITE_URL || '').trim();
    // In development, use the current browser origin to avoid localhost/127 mismatch.
    if (import.meta.env.MODE !== 'production') {
      return runtimeOrigin || configuredSiteUrl.replace(/\/+$/, '');
    }
    const rawBase = configuredSiteUrl || runtimeOrigin;
    return rawBase.replace(/\/+$/, '');
  };

  const redirectToExternalAuth = (url) => {
    setLoading(true);
    try {
      window.sessionStorage.setItem('oauth_in_progress', '1');
      window.sessionStorage.setItem('oauth_start_mode', 'login');
    } catch {
      // Ignore
    }
    window.location.assign(url);
  };

  const handleGoogleClick = async () => {
    if (loading) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId && import.meta.env.MODE !== 'production' && isLocalAuthBypassEnabled && isLoopbackHost()) {
      alert('Mock Google login requires backend bypass logic. Please use email/password for mock.');
      return;
    }
    if (!clientId) {
      alert("Google Client ID is not configured.");
      return;
    }
    setError('');
    setLoading(true);
    let state;
    try {
      const oauthState = await createOAuthState({ provider: 'google', mode: 'login' });
      state = String(oauthState?.state || '').trim();
      if (!state) throw new Error('Unable to verify request.');
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Unable to start Google sign-in.');
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
    redirectToExternalAuth(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  const handleGithubClick = async () => {
    if (loading) return;
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId && import.meta.env.MODE !== 'production' && isLocalAuthBypassEnabled && isLoopbackHost()) {
      alert('Mock GitHub login requires backend bypass logic. Please use email/password for mock.');
      return;
    }
    if (!clientId) {
      alert("GitHub Client ID is not configured.");
      return;
    }
    setError('');
    setLoading(true);
    let state;
    try {
      const oauthState = await createOAuthState({ provider: 'github', mode: 'login' });
      state = String(oauthState?.state || '').trim();
      if (!state) throw new Error('Unable to verify request.');
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Unable to start GitHub sign-in.');
      return;
    }
    const redirectUri = `${getSocialAuthBaseUrl()}/auth/callback/github`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    });
    redirectToExternalAuth(`https://github.com/login/oauth/authorize?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[400px] rounded-[24px] bg-white/95 dark:bg-[#1a1d20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#a3b18a]/20 dark:border-[#444d57]/30 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#3a5a40]/60 hover:text-[#344e41] dark:text-[#adb5be] dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <h2 id="login-modal-title" className="text-2xl font-semibold text-[#344e41] tracking-tight dark:text-white mb-3">
              Log in to KapIT
            </h2>
            <p className="text-[14px] text-[#3a5a40]/80 dark:text-[#adb5be] leading-relaxed">
              Find vetted developers and real, skill-matched opportunities.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleClick}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#eef6ee]/50 dark:hover:bg-[#1f2b23]/50 rounded-xl border border-[#a3b18a]/40 dark:border-[#444d57]/40 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-transparent hover:bg-[#eef6ee]/50 dark:hover:bg-[#1f2b23]/50 rounded-xl border border-[#a3b18a]/40 dark:border-[#444d57]/40 transition-all duration-200 text-[#344e41] dark:text-[#e7f4ea] font-medium text-[14px] shadow-sm hover:shadow disabled:opacity-50"
            >
              <GitFork className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-x-0 h-px bg-[#a3b18a]/30 dark:bg-[#444d57]/50"></div>
            <span className="relative bg-white dark:bg-[#1a1d20] px-2 text-xs text-[#3a5a40]/60 dark:text-[#adb5be]/60 font-medium uppercase tracking-wider">
              OR
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#f8faf8] dark:bg-[#1f2b23]/50 border border-[#a3b18a]/40 dark:border-[#5f8a68]/40 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/50 dark:placeholder:text-[#adb5be]/50 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157] transition-all text-[14px] shadow-sm"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-10 bg-[#f8faf8] dark:bg-[#1f2b23]/50 border border-[#a3b18a]/40 dark:border-[#5f8a68]/40 rounded-xl text-[#344e41] dark:text-[#e7f4ea] placeholder:text-[#3a5a40]/50 dark:placeholder:text-[#adb5be]/50 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157] transition-all text-[14px] shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a40]/60 hover:text-[#344e41] dark:text-[#adb5be]/60 dark:hover:text-[#e7f4ea]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#344e41] hover:bg-[#1f3a2a] dark:bg-[#588157] dark:hover:bg-[#344e41] text-white font-medium py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center text-[14px] mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center text-[14px] text-[#3a5a40]/80 dark:text-[#adb5be]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegisterClick?.();
              }}
              className="text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
