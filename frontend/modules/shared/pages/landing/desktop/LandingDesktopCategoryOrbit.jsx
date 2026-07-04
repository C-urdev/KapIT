import React from 'react';
import LandingCategoryCard from '../LandingCategoryCard';

export default function LandingDesktopCategoryOrbit({ categories, onCategoryClick }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
      {categories.map((category) => (
        <LandingCategoryCard
          key={category.title}
          category={category}
          onClick={() => onCategoryClick?.(category)}
          className="w-full"
        />
      ))}
    </div>
  );
}
