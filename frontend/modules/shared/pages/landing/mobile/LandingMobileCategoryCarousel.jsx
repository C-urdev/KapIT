import React from 'react';
import LandingCategoryCard from '../LandingCategoryCard';

export default function LandingMobileCategoryCarousel({ categories, onCategoryClick }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium tracking-wide text-[#344e41] dark:text-[#d0d7dd]">
        Swipe through the categories
      </p>

      <div
        className="flex gap-4 overflow-x-auto pb-3 pr-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Explore categories carousel"
      >
        {categories.map((category) => (
          <div key={category.title} className="snap-center shrink-0">
            <LandingCategoryCard
              category={category}
              onClick={() => onCategoryClick?.(category)}
              className="w-[min(78vw,320px)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
