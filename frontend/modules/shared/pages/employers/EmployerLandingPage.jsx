import { lazy, Suspense, useEffect, useState } from 'react';

const DesktopEmployerLandingPage = lazy(() => import('../../../desktop/pages/employers/EmployerLandingPage'));
const MobileEmployerLandingPage = lazy(() => import('../../../mobile/pages/employers/EmployerLandingPage'));

const EMPLOYER_DESKTOP_BREAKPOINT = 1100;

const getInitialLayoutMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${EMPLOYER_DESKTOP_BREAKPOINT}px)`).matches;
};

export default function EmployerLandingPage({ onCreateAccount, onSignIn }) {
  const [isDesktopLayout, setIsDesktopLayout] = useState(getInitialLayoutMode);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(min-width: ${EMPLOYER_DESKTOP_BREAKPOINT}px)`);
    const updateLayout = (event) => setIsDesktopLayout(event.matches);
    setIsDesktopLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayout);
      return () => mediaQuery.removeEventListener('change', updateLayout);
    }

    mediaQuery.addListener(updateLayout);
    return () => mediaQuery.removeListener(updateLayout);
  }, []);

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7faf5] dark:bg-[#121416]" />}>
      {isDesktopLayout ? (
        <DesktopEmployerLandingPage onCreateAccount={onCreateAccount} onSignIn={onSignIn} />
      ) : (
        <MobileEmployerLandingPage onCreateAccount={onCreateAccount} onSignIn={onSignIn} />
      )}
    </Suspense>
  );
}
