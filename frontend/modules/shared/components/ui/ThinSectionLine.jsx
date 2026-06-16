import React from 'react';

export default function ThinSectionLine({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(12,24,40,0.7)] ${className}`}
      aria-hidden="true"
    />
  );
}
