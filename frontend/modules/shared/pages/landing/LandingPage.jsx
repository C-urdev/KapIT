import React, { Suspense, lazy, useEffect, useState } from 'react';
import CookieConsentBanner from '../../components/ui/CookieConsentBanner';

const LANDING_DESKTOP_BREAKPOINT = 1100;
const DesktopLandingPage = lazy(() => import('../../../desktop/pages/landing/LandingPage'));
const MobileLandingPage = lazy(() => import('../../../mobile/pages/landing/LandingPage'));

const getInitialLayoutMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${LANDING_DESKTOP_BREAKPOINT}px)`).matches;
};

export default function LandingPage({ onGetStarted, onJoinDeveloper, onSignIn }) {
  const [isDesktopLayout, setIsDesktopLayout] = useState(getInitialLayoutMode);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(min-width: ${LANDING_DESKTOP_BREAKPOINT}px)`);
    const updateLayout = (event) => {
      setIsDesktopLayout(event.matches);
    };

    setIsDesktopLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayout);
      return () => mediaQuery.removeEventListener('change', updateLayout);
    }

    mediaQuery.addListener(updateLayout);
    return () => mediaQuery.removeListener(updateLayout);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAccountChoice = () => {
    onGetStarted?.();
  };

  const handleJoinDeveloperClick = () => {
    onJoinDeveloper?.();
  };

  return (
    <>
      <Suspense fallback={<div className="min-h-[100dvh] w-full bg-[#FDFBF7] dark:bg-[#121416]" />}>
        {isDesktopLayout ? (
          <DesktopLandingPage
            onLogoClick={scrollToTop}
            onOpenAccountChoice={handleOpenAccountChoice}
            onJoinDeveloperClick={handleJoinDeveloperClick}
            onSignIn={onSignIn}
          />
        ) : (
          <MobileLandingPage
            onLogoClick={scrollToTop}
            onOpenAccountChoice={handleOpenAccountChoice}
            onJoinDeveloperClick={handleJoinDeveloperClick}
            onSignIn={onSignIn}
          />
        )}
      </Suspense>
      <CookieConsentBanner />
    </>
  );
}
