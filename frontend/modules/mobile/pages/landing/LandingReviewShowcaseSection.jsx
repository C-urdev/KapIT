import React from 'react';
import KapITCleanReviews from '../../../shared/pages/landing/KapITCleanReviews';
import LandingPhoneMockup from '../../../shared/pages/landing/LandingPhoneMockup';

export default function LandingReviewShowcaseSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f8f4ec] via-[#f8f4ec] to-[#f0efe6] dark:bg-gradient-to-b dark:from-[#202428] dark:via-[#1c2024] dark:to-[#181b1f]">
      <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-10 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#588157] dark:text-[#f0c766]">Reviews</p>
          <h3 className="mt-2 text-3xl font-bold text-[#102a1b] dark:text-white">
            The phone design and review cards are back
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#344e41] dark:text-[#d0d7dd]">
            This mobile section keeps the dots, the review cards, and the phone preview so the landing page still feels phone-first.
          </p>
        </div>

        <div className="mt-6">
          <KapITCleanReviews>
            <LandingPhoneMockup />
          </KapITCleanReviews>
        </div>
      </div>
    </section>
  );
}
