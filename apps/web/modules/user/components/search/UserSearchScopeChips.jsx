import React from 'react';
import { USER_SEARCH_SCOPE_OPTIONS } from '@userFeatures/search/userSearchScopeOptions';

export default function UserSearchScopeChips({
  value = 'all',
  onChange,
  size = 'mobile',
  className = '',
}) {
  const isDesktop = size === 'desktop';
  const baseButtonClass = isDesktop
    ? 'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors'
    : 'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors';
  const activeClass = 'bg-[#e7efe1] text-[#2f4633] dark:bg-[#2a4a6f] dark:text-white';
  const inactiveClass = isDesktop
    ? 'bg-[#f1f3ec] text-[#5f6f52] hover:bg-[#e7efe1] dark:bg-[#1e3a5f] dark:text-[#b8d4e8] dark:hover:bg-[#24405d]'
    : 'bg-[#f1f3ec] text-[#5f6f52] hover:bg-[#e7efe1] dark:bg-[#2a2d31] dark:text-white/75 dark:hover:bg-[#34383d]';

  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`.trim()}>
      {USER_SEARCH_SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange?.(option.value)}
          className={`${baseButtonClass} ${value === option.value ? activeClass : inactiveClass}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

