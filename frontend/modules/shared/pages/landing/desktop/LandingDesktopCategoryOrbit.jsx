import React from 'react';
import LandingCategoryCard from '../LandingCategoryCard';

export default function LandingDesktopCategoryOrbit({ categories, onCategoryClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full max-w-6xl mx-auto">
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
