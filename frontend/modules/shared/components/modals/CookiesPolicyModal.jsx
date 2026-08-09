import React from 'react';
import { X, Globe } from 'lucide-react';

export default function CookiesPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-[420px]:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-3xl flex-col bg-white dark:bg-[#121416] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">

        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-[#353c44] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0f4ec] dark:bg-[#353c44]">
              <Globe className="w-5 h-5 text-[#3a5a40] dark:text-[#6f9b74]" />
            </div>
            <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">Cookies Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#344e41] dark:text-white/80" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 space-y-6 custom-scrollbar">

          <div className="bg-[#f8fbf6] dark:bg-[#202428] rounded-xl p-5 border border-[#dce5d4] dark:border-[#353c44]">
            <p className="text-[14.5px] text-[#344e41] dark:text-[#e2e6e9] leading-relaxed">
              KapIT uses cookies to enhance user experience, improve platform performance, and support essential features such as login, job matching, and application tracking. Cookies help us understand how users interact with the platform so we can improve functionality and usability. By using KapIT, you agree to the use of cookies as described in this policy. Users may manage or disable cookies through their browser settings, though some features may not function properly.
            </p>
          </div>

          <section className="space-y-3">
            <h4 className="text-[16px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">
              What Are Cookies?
            </h4>
            <p className="text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you use KapIT so we can improve it.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-[16px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">
              Types of Cookies We Use
            </h4>
            <div className="space-y-4 text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              <div>
                <p className="font-semibold text-[#1c2b1f] dark:text-white mb-1">Essential Cookies</p>
                <p>These are required for the platform to function. They enable core features like login sessions, security, and account management. Without them, KapIT cannot operate properly.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1c2b1f] dark:text-white mb-1">Functional Cookies</p>
                <p>These remember your preferences, such as theme settings and saved filters, to give you a more personalized experience on the platform.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1c2b1f] dark:text-white mb-1">Analytics Cookies</p>
                <p>These help us understand how users interact with KapIT — which features are used most, how navigation flows work, and where improvements can be made. This data is aggregated and anonymized.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1c2b1f] dark:text-white mb-1">Job Matching Cookies</p>
                <p>These are used to improve the relevance of job recommendations shown to you based on your profile and browsing activity within the platform.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[16px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">
              Managing Your Cookie Preferences
            </h4>
            <p className="text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              You can manage or disable non-essential cookies at any time through your browser settings. Please note that disabling certain cookies may affect the functionality of some features on KapIT.
            </p>
            <p className="text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              Most browsers allow you to view, delete, and block cookies through their settings menus. Refer to your browser's help documentation for specific instructions.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-[16px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">
              Third-Party Cookies
            </h4>
            <p className="text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              KapIT does not share cookie data with third-party advertisers. Any analytics or usage data collected is used solely to improve the platform experience for job seekers and employers.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-[16px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">
              Updates to This Policy
            </h4>
            <p className="text-[14.5px] text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed">
              We may update this Cookies Policy from time to time. Any changes will be posted on this page and will take effect immediately upon publication. Continued use of KapIT after such changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <div className="h-4" />
        </main>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#e5e7eb] dark:border-[#353c44] p-4 sm:p-5 bg-[#f9fafb] dark:bg-[#0d1b2e]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-[#344e41] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors border border-[#d1d5db] dark:border-[#353c44]"
          >
            Manage Preferences
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] rounded-lg shadow-sm transition-colors"
          >
            Accept All Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
