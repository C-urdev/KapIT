import React, { useEffect } from 'react';
import { Briefcase, Building2, X } from 'lucide-react';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

const CARDS = [
  {
    id: 'developer',
    title: 'IT Professional / Developer',
    subtitle: '(Looking for a job)',
    description: 'Find jobs, showcase skills, and connect with companies.',
    icon: Briefcase,
  },
  {
    id: 'company',
    title: 'Company / Client',
    subtitle: '(Looking to hire)',
    description: 'Hire skilled Filipino developers and manage projects.',
    icon: Building2,
  },
];

export default function SelectAccountTypeModal({ open, onClose, onSelect }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div className="relative w-full max-w-4xl rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-2xl dark:shadow-[#3ba9d6]/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#a3b18a] dark:border-[#1e3a5f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KapITLogo className="w-9 h-9 rounded-lg object-contain bg-white" />
            <div>
              <div className="text-lg font-extrabold text-[#3a5a40] dark:text-white">KapIT</div>
              <div className="text-xs text-[#344e41] dark:text-[#b8d4e8]">Choose your account type</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#344e41] dark:text-[#b8d4e8]" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102a1b] dark:text-white">
              Choose your account type
            </h2>
            <p className="mt-2 text-sm text-[#344e41] dark:text-[#b8d4e8]">
              This helps us tailor your registration and profile setup.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {CARDS.map(({ id, title, subtitle, description, icon: Icon }) => (
              <div
                key={id}
                className="rounded-xl shadow-lg border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] p-6 flex flex-col"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#2a4a6f] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#588157] dark:text-[#3ba9d6]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="min-h-[4rem] text-lg font-extrabold text-[#102a1b] dark:text-white">
                      <span className="block">{title}</span>
                      <span className="block">{subtitle}</span>
                    </h3>
                    <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">{description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect?.(id)}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
                >
                  Continue →
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onSelect?.('login')}
              className="text-sm text-[#344e41] dark:text-[#b8d4e8]"
            >
              Already have an account?{' '}
              <span className="font-semibold text-[#588157] dark:text-[#3ba9d6] hover:underline">Sign in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



