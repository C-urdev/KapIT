import React, { useEffect, useRef, useState } from 'react';
import Footer from '@sharedComponents/branding/Footer';
import SiteTopNav from '@sharedComponents/navigation/SiteTopNav';
import DesktopLandingPage from '../../../desktop/pages/landing/LandingPage';
import MobileLandingPage from '../../../mobile/pages/landing/LandingPage';

export default function LandingPage({ onGetStarted, onJoinDeveloper, onSignIn }) {
  const topRef = useRef(null);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
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
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAccountChoice = () => {
    onGetStarted?.();
  };

  const handleJoinDeveloperClick = () => {
    onJoinDeveloper?.();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#edf3ef] dark:bg-gradient-to-b dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b]">
      <div ref={topRef} />
      <SiteTopNav onLogoClick={scrollToTop} onGetStarted={handleOpenAccountChoice} onSignIn={onSignIn} />
      {isDesktopLayout ? (
        <DesktopLandingPage
          onOpenAccountChoice={handleOpenAccountChoice}
          onJoinDeveloperClick={handleJoinDeveloperClick}
        />
      ) : (
        <MobileLandingPage
          onOpenAccountChoice={handleOpenAccountChoice}
          onJoinDeveloperClick={handleJoinDeveloperClick}
        />
      )}
      <Footer />
    </div>
  );
}
