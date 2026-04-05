'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@sharedContext/ThemeContext';

export default function AppProviders({ children }) {
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      const isEventObject =
        reason instanceof Event ||
        Object.prototype.toString.call(reason) === '[object Event]';

      if (!isEventObject) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
