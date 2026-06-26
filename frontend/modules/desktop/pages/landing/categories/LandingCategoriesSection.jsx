import React from 'react';
import ThinSectionLine from '@sharedComponents/ui/ThinSectionLine';
import { CATEGORIES } from '../../../../shared/pages/landing/landingData';
import LandingDesktopCategoryOrbit from '../../../../shared/pages/landing/desktop/LandingDesktopCategoryOrbit';

export default function LandingCategoriesSection({ onOpenAccountChoice }) {
  return (
    <section className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#202428] dark:to-[#23282e] scroll-mt-24">
      <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12 sm:py-14 lg:py-16">
        <div className="max-w-3xl">
          <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">Explore categories</h3>
        </div>

        <div className="mt-8">
          <LandingDesktopCategoryOrbit categories={CATEGORIES} onCategoryClick={onOpenAccountChoice} />
        </div>
      </div>
      <ThinSectionLine className="bottom-0" />
    </section>
  );
}
