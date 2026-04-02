import React from 'react';
import { BadgeCheck, Check } from 'lucide-react';

export default function PremiumBadge({ className = '', iconClassName = '', compact = false, label = '' }) {
  const sizeClass = compact ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <span
      className={`relative inline-flex items-center justify-center ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${className}`.trim()}
      aria-label={label || 'Premium'}
      title={label || 'Premium'}
    >
      <BadgeCheck className={`${sizeClass} fill-[#f2b500] text-[#f2b500] dark:fill-[#d9a300] dark:text-[#d9a300] ${iconClassName}`.trim()} />
      <Check className={`absolute ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white`} strokeWidth={3.25} />
    </span>
  );
}
