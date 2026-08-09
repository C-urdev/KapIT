import React from 'react';
import Footer from '../../../shared/components/branding/Footer';
import LandingFinalCtaSection from '../../../shared/pages/landing/LandingFinalCtaSection';
import LandingFaqSection from '../../../shared/pages/landing/LandingFaqSection';
import LandingHeroSection from '../../../shared/pages/landing/LandingHeroSection';
import LandingHowItWorksSection from '../../../shared/pages/landing/LandingHowItWorksSection';
import ScrollRevealSection from '../../../shared/components/effects/ScrollRevealSection';
import PublicDesktopNav from '../../components/navigation/PublicDesktopNav';
import LandingCategoriesSection from './categories/LandingCategoriesSection';
import LandingSuccessStoriesSection from './LandingSuccessStoriesSection';
import LandingWhyUsSection from './LandingWhyUsSection';

export default function DesktopLandingPage({ onLogoClick, onOpenAccountChoice, onJoinDeveloperClick, onSignIn }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#edf3ef] dark:bg-gradient-to-b dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b]">
      <PublicDesktopNav
        onLogoClick={onLogoClick}
        onGetStarted={onOpenAccountChoice}
        onSignIn={onSignIn}
      />
      <ScrollRevealSection startVisible>
        <LandingHeroSection onGetStarted={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingSuccessStoriesSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingCategoriesSection onOpenAccountChoice={onOpenAccountChoice} />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingHowItWorksSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingFaqSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingWhyUsSection />
      </ScrollRevealSection>
      <ScrollRevealSection>
        <LandingFinalCtaSection onOpenAccountChoice={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} />
      </ScrollRevealSection>
      <Footer />
    </div>
  );
}
