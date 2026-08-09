'use client';

import { useEffect, useState } from 'react';
import Link from '../../../../components/shared/Link';

const COOKIE_CONSENT_STORAGE_KEY = 'kapit_cookie_consent';

const readStoredConsent = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
};

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readStoredConsent());
  }, []);

  const saveConsent = (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[210] mx-auto flex w-[calc(100vw-1.5rem)] max-w-[560px] flex-col gap-3 rounded-lg border border-[#d9ded5] bg-white/96 p-3 shadow-[0_18px_45px_rgba(16,42,27,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-[#181c1b]/96 sm:left-auto sm:right-4 sm:mx-0 sm:w-auto sm:max-w-[552px] sm:flex-row sm:items-center sm:gap-5"
    >
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-[#18281f] dark:text-[#e7efe9]">
        KapIT uses necessary cookies and storage. Optional analytics help us improve; see our{' '}
        <Link href="/privacy-policy" className="font-semibold underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => saveConsent('necessary')}
          className="min-h-10 rounded-md px-3 text-xs font-semibold text-[#26382d] transition-colors hover:bg-[#edf3ea] dark:text-[#d8e3dc] dark:hover:bg-white/8"
        >
          Only necessary
        </button>
        <button
          type="button"
          onClick={() => saveConsent('analytics')}
          className="min-h-10 rounded-md bg-[#050505] px-4 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-[#1b1b1b] active:scale-[0.98] dark:bg-white dark:text-[#111] dark:hover:bg-[#e8e8e8]"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}
