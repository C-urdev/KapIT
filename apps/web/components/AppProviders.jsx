'use client';

import { ThemeProvider } from '@sharedContext/ThemeContext';

export default function AppProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}