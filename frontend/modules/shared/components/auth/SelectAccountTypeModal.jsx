import React, { useEffect, useState } from 'react';
import { Briefcase, Building2, X, ArrowRight } from 'lucide-react';

const ACCOUNT_TYPES = [
  {
    id: 'developer',
    title: 'IT Professional',
    description: 'Find jobs, showcase skills, and connect with companies.',
    icon: Briefcase,
  },
  {
    id: 'company',
    title: 'Company',
    description: 'Hire skilled Filipino developers and manage projects.',
    icon: Building2,
  },
];

export default function SelectAccountTypeModal({ open, onClose, onSelect }) {
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!open) return;
    setHovered(null);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div
        className="relative w-full max-w-[460px] rounded-[24px] bg-white/95 dark:bg-[#1a1d20]/95 shadow-[0_16px_40px_rgb(0,0,0,0.12)] border border-[#a3b18a]/15 dark:border-[#444d57]/20 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-account-type-title"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[#3a5a40]/40 hover:text-[#344e41] hover:bg-black/5 dark:text-[#adb5be]/50 dark:hover:text-white dark:hover:bg-white/5 transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2
              id="select-account-type-title"
              className="text-[24px] font-semibold text-[#344e41] tracking-tight dark:text-white mb-2"
            >
              Create your account
            </h2>
            <p className="text-[14px] text-[#3a5a40]/60 dark:text-[#adb5be]/80">
              How will you use KapIT?
            </p>
          </div>

          {/* Options Stack */}
          <div className="space-y-4">
            
            {/* IT Professional - Highly Needed / Recommended */}
            <button
              onClick={() => onSelect?.('developer')}
              className="group relative w-full text-left p-5 rounded-2xl transition-all duration-300 bg-gradient-to-br from-[#f2f6f3] to-[#f8faf8] dark:from-[#1f2b23]/40 dark:to-[#1a1d20] border border-[#588157]/20 dark:border-[#6f9b74]/20 hover:border-[#588157]/40 dark:hover:border-[#6f9b74]/40 hover:shadow-sm"
            >
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-[#588157]/10 dark:bg-[#6f9b74]/15 border border-[#588157]/15 dark:border-[#6f9b74]/20 text-[11px] font-semibold text-[#588157] dark:text-[#82ad86] uppercase tracking-wider">
                Highly Needed
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#588157]/10 dark:bg-[#6f9b74]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#588157]/20 dark:group-hover:bg-[#6f9b74]/20 transition-colors">
                  <Briefcase className="w-5 h-5 text-[#3a5a40] dark:text-[#82ad86]" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[15px] font-semibold text-[#344e41] dark:text-white mb-1">
                    IT Professional
                  </div>
                  <div className="text-[13px] text-[#3a5a40]/65 dark:text-[#adb5be]/70 leading-relaxed pr-16">
                    Find jobs, showcase your skills, and connect with great companies.
                  </div>
                </div>
              </div>
            </button>

            {/* Company - Secondary */}
            <button
              onClick={() => onSelect?.('company')}
              className="group relative w-full text-left p-5 rounded-2xl transition-all duration-300 bg-transparent hover:bg-gradient-to-br hover:from-[#fdfcf9] hover:to-white dark:hover:from-[#2a261f]/40 dark:hover:to-[#1a1d20] border border-[#a3b18a]/20 dark:border-[#444d57]/30 hover:border-[#d69d1a]/30 dark:hover:border-[#d69d1a]/30 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] group-hover:bg-[#d69d1a]/10 dark:group-hover:bg-[#d69d1a]/15 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Building2 className="w-5 h-5 text-[#3a5a40]/60 dark:text-[#adb5be]/60 group-hover:text-[#b38214] dark:group-hover:text-[#e8b538] transition-colors" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[15px] font-semibold text-[#344e41] dark:text-white mb-1">
                    Company
                  </div>
                  <div className="text-[13px] text-[#3a5a40]/65 dark:text-[#adb5be]/70 leading-relaxed">
                    Hire skilled Filipino developers and manage your projects easily.
                  </div>
                </div>
              </div>
            </button>

          </div>

          <div className="mt-8 text-center text-[13px] text-[#3a5a40]/60 dark:text-[#adb5be]/70">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSelect?.('login')}
              className="text-[#588157] dark:text-[#6f9b74] hover:text-[#344e41] dark:hover:text-white font-semibold hover:underline transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




