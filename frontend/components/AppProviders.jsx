'use client';

import { useEffect } from 'react';
import { usePathname } from '@shared/hooks/useAppRouter';
import { ThemeProvider } from '@sharedContext/ThemeContext';
import FaqChatbot from '@sharedComponents/support/FaqChatbot';
import ChatbotErrorBoundary from './ChatbotErrorBoundary';

const STATIC_TITLES_BY_PATH = {
  '/': 'AI Job Matching Platform',
  '/for-employers': 'Hire Vetted IT Talent',
  '/for-employers/pricing': 'Employer Pricing',
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

const SEO_BY_PATH = {
  '/': {
    title: 'KapIT - AI Job Matching Platform',
    description: 'KapIT helps IT professionals find skill-matched roles and helps companies hire vetted developers in one focused platform.',
  },
  '/for-employers': {
    title: 'KapIT for Employers - Hire Vetted IT Talent',
    description: 'Find, review, and hire vetted developers and IT professionals with KapIT employer hiring tools.',
  },
  '/pricing': {
    title: 'KapIT Pricing - Plans for Job Seekers',
    description: 'Explore KapIT plans for IT professionals who want better matching, applications, and profile tools.',
  },
  '/for-employers/pricing': {
    title: 'KapIT Employer Pricing - Hiring Plans',
    description: 'Compare KapIT employer plans for posting jobs, reviewing applicants, and hiring IT talent.',
  },
  '/jobs': {
    title: 'KapIT Jobs - Skill-Matched IT Roles',
    description: 'Browse IT jobs and developer roles matched through KapIT.',
  },
  '/privacy-policy': {
    title: 'KapIT Privacy Policy',
    description: 'Read how KapIT handles privacy, account data, and platform information.',
  },
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

const setMetaContent = (selector, content) => {
  if (typeof document === 'undefined') return;
  const element = document.head.querySelector(selector);
  if (!element || !content) return;
  element.setAttribute('content', content);
};

const setCanonicalHref = (href) => {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export default function AppProviders({ children, initialTheme = 'light' }) {
  const pathname = usePathname();
  const isEmployerLandingPage = pathname === '/for-employers';
  const shouldShowChatbot = pathname === '/' || isEmployerLandingPage || String(pathname || '').startsWith('/dashboard/');

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
    const route = String(pathname || '/');
    const seo = SEO_BY_PATH[route];
    const titleText = resolveTitleText(route);
    const title = seo?.title || (titleText ? `KapIT | ${titleText}` : 'KapIT - AI Job Matching Platform');
    const description = seo?.description || 'KapIT helps IT professionals and companies connect through focused job matching tools.';
    const canonicalPath = route === '/' ? '/' : route.replace(/\/$/, '');
    const canonicalUrl = `https://kapit.online${canonicalPath}`;

    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setCanonicalHref(canonicalUrl);
  }, [pathname]);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
      {shouldShowChatbot ? (
        <ChatbotErrorBoundary>
          <FaqChatbot audience={isEmployerLandingPage ? 'employer' : 'general'} />
        </ChatbotErrorBoundary>
      ) : null}
    </ThemeProvider>
  );
}
