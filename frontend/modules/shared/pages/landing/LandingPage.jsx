import React, { useEffect, useState } from 'react';
import DesktopLandingPage from '../../../desktop/pages/landing/LandingPage';
import MobileLandingPage from '../../../mobile/pages/landing/LandingPage';

const LANDING_DESKTOP_BREAKPOINT = 1100;

export default function LandingPage({ onGetStarted, onJoinDeveloper, onSignIn }) {
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

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
    isDesktopLayout ? (
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
    )
  );
}
