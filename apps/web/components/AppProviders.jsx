'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@sharedContext/ThemeContext';

const STATIC_TITLES_BY_PATH = {
  '/': 'Home',
  '/auth/login': 'Login',
  '/auth/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/jobs': 'Jobs',
  '/job-match': 'Job Match',
  '/premium/payment': 'Premium Payment',
  '/onboarding/developer-profile': 'Developer Onboarding',
  '/onboarding/company-profile': 'Company Onboarding',
};

const toTitleCase = (value) =>
  String(value || '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStoredSessionUser = () => {
  try {
    const raw = window.sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const resolveTitleText = (pathname) => {
  const route = String(pathname || '/');
  const sessionUser = getStoredSessionUser();

  const emailPrefix = String(sessionUser?.email || '').split('@')[0] || '';
  const userDisplayName = String(
    sessionUser?.username
    || sessionUser?.fullName
    || sessionUser?.name
    || emailPrefix
    || ''
  ).trim();
  const companyDisplayName = String(
    sessionUser?.companyName
    || sessionUser?.username
    || sessionUser?.fullName
    || sessionUser?.name
    || emailPrefix
    || ''
  ).trim();

  if (STATIC_TITLES_BY_PATH[route]) {
    return STATIC_TITLES_BY_PATH[route];
  }

  if (route.startsWith('/dashboard/user')) return `User | ${userDisplayName || 'Dashboard'}`;
  if (route.startsWith('/company') || route.startsWith('/dashboard/company')) return `Company | ${companyDisplayName || 'Workspace'}`;

  if (route.startsWith('/jobs/')) return 'Job Details';
  if (route.startsWith('/companies/')) return 'Company Profile';

  const segment = route.split('/').filter(Boolean).pop() || '';
  return segment ? toTitleCase(segment) : 'KapIT';
};

export default function AppProviders({ children }) {
  const pathname = usePathname();

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

  useEffect(() => {
    const titleText = resolveTitleText(pathname);
    document.title = titleText ? `KapIT | ${titleText}` : 'KapIT';
  }, [pathname]);

  return <ThemeProvider>{children}</ThemeProvider>;
}
