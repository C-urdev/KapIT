import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function TimedInfoPopup({ title, message, durationMs = 60000, dismissKey = '' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && dismissKey) {
      const wasDismissed = window.sessionStorage.getItem(`kapit_company_popup_dismissed_${dismissKey}`) === '1';
      if (wasDismissed) {
        setVisible(false);
        return undefined;
      }
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, Number(durationMs) || 60000);
    return () => window.clearTimeout(timer);
  }, [dismissKey, durationMs, title, message]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && dismissKey) {
      window.sessionStorage.setItem(`kapit_company_popup_dismissed_${dismissKey}`, '1');
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 top-[84px] z-[120] w-[min(92vw,460px)] rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-4 shadow-[0_18px_42px_rgba(58,90,64,0.2)] dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-[0_20px_44px_rgba(0,0,0,0.45)]">
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5f6f52] transition-colors hover:bg-[#eef6ee] hover:text-[#2a3d2f] dark:text-[#adb5be] dark:hover:bg-[#31363d] dark:hover:text-white"
        aria-label="Close notice"
      >
        <X className="h-4 w-4" />
      </button>
      <h4 className="pr-8 text-base font-bold text-[#3a5a40] dark:text-white">{title}</h4>
      <p className="mt-1.5 text-sm leading-6 text-[#344e41] dark:text-[#eceff2]">{message}</p>
    </div>
  );
}
