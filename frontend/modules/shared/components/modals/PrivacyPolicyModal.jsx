import React from 'react';
import { X, Shield } from 'lucide-react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-[420px]:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-3xl flex-col bg-white dark:bg-[#121416] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-[#353c44] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0f4ec] dark:bg-[#353c44]">
              <Shield className="w-5 h-5 text-[#3a5a40] dark:text-[#6f9b74]" />
            </div>
            <div>
              <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">Privacy Policy</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-5 h-5 text-[#344e41] dark:text-white/80" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 space-y-8 custom-scrollbar">
          <div className="text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px] space-y-4">
            <p>
              This Privacy Policy explains how KapIT collects, uses, and protects your personal and professional information when you use our platform. We are committed to ensuring that your privacy is protected and respected at all times.
            </p>
          </div>

          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">Information Collection and Processing</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p>KapIT collects and processes user information to operate and improve the platform. This may include personal and professional data provided during registration and use of the Service.</p>
              <p>By using KapIT, you consent to the collection and use of your information in accordance with applicable data protection laws and the platform's Privacy Policy.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white border-b border-[#dce5d4] dark:border-[#353c44] pb-2">Information Sharing</h4>
            <div className="space-y-4 text-[#4b5563] dark:text-[#d0d7dd] leading-relaxed text-[14.5px]">
              <p>Only the information you explicitly include in your public profile and applications is shared with employers. KapIT strictly does not sell personal data to third parties.</p>
            </div>
          </section>

          <div className="h-6"></div>

        </main>
      </div>
    </div>
  );
}
