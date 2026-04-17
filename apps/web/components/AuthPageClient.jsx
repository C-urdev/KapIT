'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';
import AuthPage from '@sharedPages/auth/AuthPage';
import { 
  isCompanyAccount, 
  normalizeAccountType, 
  registerUser, 
  sendRegistrationOtp, 
  verifyRegistrationOtp 
} from '@sharedServices/authService';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
  const normalizedInitialMode = initialMode === 'signup' && !accountType ? 'login' : initialMode;

  const [pendingSignup, setPendingSignup] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBeginSignup = async (signupData) => {
    setLoading(true);
    setError('');
    try {
      const res = await sendRegistrationOtp({ email: signupData.email });
      if (res.success) {
        setPendingSignup(signupData);
      } else {
        alert(res.message || 'Failed to send verification code.');
      }
    } catch (err) {
      alert('Unable to send verification code right now.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (otpCode.length < 6) return;
    setLoading(true);
    setError('');
    
    try {
      const verifyRes = await verifyRegistrationOtp({ email: pendingSignup.email, code: otpCode });
      if (!verifyRes.success || !verifyRes.verificationToken) {
        setError(verifyRes.message || 'Invalid verification code.');
        setLoading(false);
        return;
      }

      // Now officially register passing the secure token
      const data = await registerUser({
        username: pendingSignup.username,
        email: pendingSignup.email,
        password: pendingSignup.password,
        accountType: pendingSignup.accountType || accountType || 'developer',
        verificationToken: verifyRes.verificationToken,
        termsAccepted: pendingSignup.termsAccepted === true,
      });

      if (data?.user) {
        router.replace(resolvePostAuthPath(data.user));
      } else {
        setError(data?.message || 'Failed to register account.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#0a1628] dark:to-[#162842]">
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-2xl p-8 max-w-sm w-full shadow-lg">
          <button 
            onClick={() => setPendingSignup(null)}
            disabled={loading}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sign up
          </button>
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3a5a40]/10 dark:bg-[#3ba9d6]/10 mb-4">
              <Mail className="w-6 h-6 text-[#3a5a40] dark:text-[#3ba9d6]" />
            </div>
            <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white mb-2">Verify your email</h2>
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">
              We sent a verification code to <strong className="font-medium text-gray-900 dark:text-gray-200">{pendingSignup.email}</strong>. 
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
              className="w-full text-center text-3xl tracking-[0.5em] font-semibold px-4 py-3 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-xl bg-white dark:bg-[#0f2139] text-[#344e41] dark:text-white focus:ring-2 focus:ring-[#3a5a40] dark:focus:ring-[#3ba9d6] outline-none transition-colors"
            />
            
            <button
              onClick={verifyAndRegister}
              disabled={loading || otpCode.length !== 6}
              className="w-full h-12 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-client-id'}>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0a1628]/50 flex items-center justify-center backdrop-blur-[2px]">
            <Loader2 className="w-10 h-10 text-[#3a5a40] dark:text-[#3ba9d6] animate-spin" />
          </div>
        )}
        <AuthPage
          accountType={accountType}
          initialMode={normalizedInitialMode}
          onBack={() => router.push('/')}
          onRequestAccountType={() => router.push('/')}
          onForgotPassword={() => router.push('/forgot-password')}
          onBeginSignup={handleBeginSignup}
          onLogin={(user) => {
            router.replace(resolvePostAuthPath(user));
          }}
          onWarmRoute={() => {}}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
