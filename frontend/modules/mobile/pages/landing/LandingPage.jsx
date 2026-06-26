import React from 'react';
import LandingFinalCtaSection from '../../../shared/pages/landing/LandingFinalCtaSection';
import LandingHeroSection from '../../../shared/pages/landing/LandingHeroSection';
import LandingHowItWorksSection from '../../../shared/pages/landing/LandingHowItWorksSection';
import LandingTrustedSection from '../../../shared/pages/landing/LandingTrustedSection';
import LandingCategoriesSection from './categories/LandingCategoriesSection';
import LandingReviewShowcaseSection from './LandingReviewShowcaseSection';

export default function MobileLandingPage({ onOpenAccountChoice, onJoinDeveloperClick }) {
  return (
    <>
      <LandingHeroSection onGetStarted={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} />
      <LandingTrustedSection />
      <LandingCategoriesSection onOpenAccountChoice={onOpenAccountChoice} />
      <LandingReviewShowcaseSection />
      <LandingHowItWorksSection />
      <LandingFinalCtaSection onOpenAccountChoice={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} />
    </>
  );
}
