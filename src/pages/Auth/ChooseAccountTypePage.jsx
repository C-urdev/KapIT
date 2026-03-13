import React, { useState } from 'react';
import { Moon, Sun, AlertCircle, Briefcase, Building2, ArrowLeft } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';
import { registerUser } from '../../services/authService';
import KapITLogo from '@components/KapITLogo';

const ACCOUNT_TYPES = [
  {
    id: 'employee',
    title: 'IT Professional / Developer',
    subtitle: '(Looking for a job)',
    description: 'Build your profile, showcase your projects, and get discovered.',
    icon: Briefcase,
  },
  {
    id: 'company',
    title: 'Company / Client',
    subtitle: '(Looking to hire)',
    description: 'Create a company profile and find IT talent.',
    icon: Building2,
  },
];

export default function ChooseAccountTypePage({ pendingSignup, onBack, onRegistered }) {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (type) => {
    if (!pendingSignup?.email || !pendingSignup?.password || !pendingSignup?.username) {
      setError('Missing sign up details. Please go back and try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await registerUser({
        username: pendingSignup.username,
        email: pendingSignup.email,
        password: pendingSignup.password,
        userType: type,
      });

      onRegistered(
        {
          ...data.user,
          type: data.user?.type || type,
        },
        { isNewUser: true }
      );
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-[#344e41] dark:text-[#b8d4e8] hover:text-[#3a5a40] dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="flex items-center gap-3">
              <KapITLogo className="w-9 h-9 rounded-lg object-contain bg-white" />
              <span className="text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</span>
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 bg-gradient-to-br from-[#dad7cd] to-[#f5f5f2] dark:from-[#0a1628] dark:to-[#162842]">
        <div className="w-full max-w-3xl">
          <div className="bg-white dark:bg-[#162842] rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] p-5 sm:p-8 shadow-lg dark:shadow-[#3ba9d6]/10">
            <div className="text-center mb-7">
              <h2 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">Choose Account Type</h2>
              <p className="text-[#344e41] dark:text-[#b8d4e8]">This helps us show you the right profile form.</p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {ACCOUNT_TYPES.map(({ id, title, subtitle, description, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  disabled={loading}
                  className="text-left group relative overflow-hidden bg-white dark:bg-[#0f2139] border-2 border-[#a3b18a] dark:border-[#2a4a6f] rounded-2xl p-6 hover:border-[#588157] dark:hover:border-[#3ba9d6] transition-all duration-300 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#f5f5f2] dark:bg-[#1e3a5f] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-[#588157] dark:text-[#3ba9d6]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">
                        <span className="block">{title}</span>
                        <span className="block">{subtitle}</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">{description}</p>
                      <div className="mt-4 text-sm font-semibold text-[#588157] dark:text-[#3ba9d6] group-hover:underline">
                        Select →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {loading && (
              <p className="mt-5 text-center text-sm text-[#344e41] dark:text-[#b8d4e8]">Creating your account…</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
