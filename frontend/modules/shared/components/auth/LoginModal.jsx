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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[400px] rounded-2xl bg-[#202123] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#c5c5d2] hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <h2 id="login-modal-title" className="text-2xl font-bold text-white mb-3">
              Log in to KapIT
            </h2>
            <p className="text-[14px] text-[#c5c5d2] leading-relaxed">
              Find vetted developers and real, skill-matched opportunities.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-950/40 border border-red-900 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleClick}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#2A2B32] hover:bg-[#343541] rounded-full border border-white/10 transition-colors text-white font-medium text-sm disabled:opacity-50"
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
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#2A2B32] hover:bg-[#343541] rounded-full border border-white/10 transition-colors text-white font-medium text-sm disabled:opacity-50"
            >
              <GitFork className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-x-0 h-px bg-white/10"></div>
            <span className="relative bg-[#202123] px-2 text-xs text-[#c5c5d2] font-medium uppercase tracking-wider">
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
                className="w-full px-4 py-3 bg-[#2A2B32] border border-white/10 rounded-full text-white placeholder-[#8e8ea0] focus:outline-none focus:border-white/30 transition-colors text-sm"
                required
              />
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-[#2A2B32] border border-white/10 rounded-full text-white placeholder-[#8e8ea0] focus:outline-none focus:border-white/30 transition-colors text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8ea0] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10a37f] hover:bg-[#0e906f] text-white font-medium py-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center text-sm mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8e8ea0]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegisterClick?.();
              }}
              className="text-[#10a37f] hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
