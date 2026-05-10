'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@sharedContext/ThemeContext';
import FaqChatbot from '@sharedComponents/support/FaqChatbot';
import ChatbotErrorBoundary from './ChatbotErrorBoundary';

const STATIC_TITLES_BY_PATH = {
  '/': 'AI Job Matching Platform',
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

export default function AppProviders({ children, initialTheme = 'light' }) {
  const pathname = usePathname();

  useEffect(() => {
    const isEventLike = (value) => {
      if (typeof value === 'undefined' || value === null) return false;
      return Object.prototype.toString.call(value) === '[object Event]';
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      if (!isEventLike(reason)) {
        return;
      }

      event.preventDefault();
    };

    const handleWindowError = (event) => {
      if (!isEventLike(event?.error)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError, true);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError, true);
    };
  }, []);

  useEffect(() => {
    const titleText = resolveTitleText(pathname);
    if (pathname === '/') {
      document.title = 'KapIT - AI Job Matching Platform';
      return;
    }

    document.title = titleText ? `KapIT | ${titleText}` : 'KapIT - AI Job Matching Platform';
  }, [pathname]);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
      <ChatbotErrorBoundary>
        <FaqChatbot />
      </ChatbotErrorBoundary>
    </ThemeProvider>
  );
}
